import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(6, "A senha deve ter pelo menos 6 caracteres");

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Listen for auth state changes (recovery link will trigger SIGNED_IN event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setHasSession(!!session);
        }
        setCheckingSession(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({
        title: "Senha inválida",
        description: passwordResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A confirmação deve ser igual à senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Erro ao definir senha",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setSuccess(true);
    toast({
      title: "Senha definida com sucesso!",
      description: "Você será redirecionado em instantes.",
    });

    // Redirect after a short delay
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-brand-blue text-xl">Verificando acesso...</div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Link Inválido ou Expirado</CardTitle>
            <CardDescription>
              Este link de acesso não é válido ou já foi utilizado.
              Entre em contato com o administrador para obter um novo link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full bg-brand-magenta hover:bg-brand-magenta/90"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md border-border shadow-lg">
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-brand-blue">Senha Definida!</h2>
              <p className="text-muted-foreground">
                Redirecionando para o painel...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-brand-magenta/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-brand-magenta" />
            </div>
            <CardTitle className="text-2xl text-brand-blue">Definir Senha</CardTitle>
            <CardDescription>
              Crie uma senha segura para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-brand-blue font-semibold">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-brand-blue font-semibold">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-magenta hover:bg-brand-magenta/90"
              >
                {loading ? "Salvando..." : "Definir Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
