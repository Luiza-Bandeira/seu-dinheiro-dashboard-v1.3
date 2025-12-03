import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Users, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface AdminNotificationsProps {
  profiles: Profile[];
}

const notificationTypes = [
  { value: "aviso", label: "Aviso", icon: AlertTriangle, color: "bg-yellow-500" },
  { value: "lembrete", label: "Lembrete", icon: Clock, color: "bg-blue-500" },
  { value: "novidade", label: "Novidade", icon: CheckCircle, color: "bg-green-500" },
  { value: "alerta", label: "Alerta", icon: AlertTriangle, color: "bg-red-500" },
];

export function AdminNotifications({ profiles }: AdminNotificationsProps) {
  const [type, setType] = useState("aviso");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState("");

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      p.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const getRecipientCount = () => {
    if (recipientType === "all") return profiles.length;
    if (recipientType === "specific") return selectedUsers.length;
    return profiles.length;
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleSendNotification = async () => {
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para enviar.",
        variant: "destructive",
      });
      return;
    }

    let targetUsers: string[] = [];

    if (recipientType === "all") {
      targetUsers = profiles.map((p) => p.id);
    } else if (recipientType === "specific") {
      if (selectedUsers.length === 0) {
        toast({
          title: "Erro",
          description: "Selecione pelo menos um usuário.",
          variant: "destructive",
        });
        return;
      }
      targetUsers = selectedUsers;
    }

    setSending(true);

    try {
      const notifications = targetUsers.map((userId) => ({
        user_id: userId,
        type,
        message: message.trim(),
        read: false,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Notificação enviada para ${targetUsers.length} usuário(s).`,
      });

      setMessage("");
      setSelectedUsers([]);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-brand-blue/20">
          <CardHeader>
            <CardTitle className="text-brand-blue flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar Nova Notificação
            </CardTitle>
            <CardDescription>
              Envie notificações para todos os usuários ou selecione destinatários específicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de Notificação */}
            <div className="space-y-2">
              <Label>Tipo de Notificação</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className="h-4 w-4" />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destinatários */}
            <div className="space-y-2">
              <Label>Destinatários</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Todos os usuários ({profiles.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Selecionar usuários específicos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Usuários Específicos */}
            {recipientType === "specific" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <Input
                  placeholder="Buscar usuário por nome ou email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {filteredProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Checkbox
                        id={profile.id}
                        checked={selectedUsers.includes(profile.id)}
                        onCheckedChange={(checked) =>
                          handleUserSelection(profile.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={profile.id}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="font-medium">
                          {profile.full_name || "Sem nome"}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {profile.email}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                {selectedUsers.length > 0 && (
                  <Badge variant="secondary">
                    {selectedUsers.length} usuário(s) selecionado(s)
                  </Badge>
                )}
              </motion.div>
            )}

            {/* Mensagem */}
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Digite a mensagem da notificação..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Preview */}
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-muted rounded-lg border"
              >
                <p className="text-xs text-muted-foreground mb-2">Prévia:</p>
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-brand-magenta mt-0.5" />
                  <div>
                    <Badge
                      className={
                        notificationTypes.find((t) => t.value === type)?.color
                      }
                    >
                      {notificationTypes.find((t) => t.value === type)?.label}
                    </Badge>
                    <p className="mt-2 text-sm">{message}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Botão Enviar */}
            <Button
              onClick={handleSendNotification}
              disabled={sending || !message.trim()}
              className="w-full bg-brand-magenta hover:bg-brand-magenta/90"
            >
              {sending ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para {getRecipientCount()} usuário(s)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
