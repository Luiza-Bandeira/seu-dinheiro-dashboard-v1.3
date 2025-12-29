import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Build dynamic CORS headers based on origin
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  
  const allowedOrigins = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/.*\.lovableproject\.com$/,
    /^https?:\/\/.*\.lovable\.app$/,
    /^https?:\/\/.*--.*\.lovable\.app$/,
    /^https?:\/\/(www\.)?seudinheironamesa\.luizabandeira\.com\.br$/,
  ]
  
  const isAllowed = allowedOrigins.some(pattern => pattern.test(origin))
  
  console.log('CORS check - Origin:', origin, 'Allowed:', isAllowed)
  
  const allowOrigin = isAllowed ? origin : (origin ? '*' : '')
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requestingUser) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if requesting user is admin using user_roles table (consistent with RLS policies)
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!adminRole) {
      console.error('User is not admin:', requestingUser.id)
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem gerenciar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const body = await req.json()
    const { action, email, fullName, password, userId } = body

    // Validate email format helper
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // ===== DELETE USER =====
    if (action === 'delete') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId é obrigatório para deletar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent admin from deleting themselves
      if (userId === requestingUser.id) {
        return new Response(
          JSON.stringify({ error: 'Você não pode deletar a si mesmo' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Deleting user:', userId)

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('User deleted successfully:', userId)

      return new Response(
        JSON.stringify({ success: true, message: 'Usuário deletado com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== CREATE USER WITH PASSWORD =====
    if (action === 'create') {
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Formato de email inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!fullName) {
        return new Response(
          JSON.stringify({ error: 'Nome é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!password || password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if email already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())

      if (emailExists) {
        return new Response(
          JSON.stringify({ error: 'Este email já está cadastrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Creating user with password:', email, fullName)

      // Create user WITH password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      })

      if (createError) {
        console.error('Error creating user:', createError)
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('User created:', newUser.user.id)

      // Add role 'aluno' to user_roles (upsert to avoid duplicates)
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: newUser.user.id,
          role: 'aluno',
        }, { onConflict: 'user_id,role' })

      if (roleError) {
        console.error('Error adding role:', roleError)
        // Don't fail - user was created successfully
      }

      // Wait a bit for the trigger to create the profile, then upsert to ensure data is correct
      await new Promise(resolve => setTimeout(resolve, 500))

      // Upsert profile to ensure it exists with correct data and approved status
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          email: email,
          full_name: fullName,
          payment_status: 'approved',
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Error upserting profile:', profileError)
        // Don't fail - user was created successfully
      }

      console.log('User creation complete with approved status:', newUser.user.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          userId: newUser.user.id,
          message: 'Usuário criado com sucesso.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida. Use "create" ou "delete"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})