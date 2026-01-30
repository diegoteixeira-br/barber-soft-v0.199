import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Shield, 
  LogOut, 
  Loader2, 
  User, 
  MessageSquare, 
  Bug, 
  Lightbulb,
  CreditCard,
  Crown,
  Infinity,
  Calendar,
  ExternalLink,
  AlertTriangle,
  Trash2,
  XCircle,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeedback } from "@/hooks/useFeedback";
import { useSubscription } from "@/hooks/useSubscription";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AccountTab() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin } = useSuperAdmin();
  const { status, isLoading: subscriptionLoading, openCustomerPortal } = useSubscription();
  const { 
    settings, 
    setDeletionPassword: saveDeletionPassword, 
    disableDeletionPassword, 
    changeDeletionPassword,
    requestDeletionPasswordReset,
    isLoading: settingsLoading 
  } = useBusinessSettings();
  
  // Security state
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // Deletion password state
  const [deletionPasswordEnabled, setDeletionPasswordEnabled] = useState(false);
  const [deletionPasswordInput, setDeletionPasswordInput] = useState("");
  const [confirmDeletionPassword, setConfirmDeletionPassword] = useState("");
  const [savingDeletionPassword, setSavingDeletionPassword] = useState(false);
  
  // Password verification modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalAction, setPasswordModalAction] = useState<'disable' | 'change' | null>(null);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [passwordModalError, setPasswordModalError] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  
  // Feedback state
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'bug' | 'suggestion'>('feedback');
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const { submitFeedback, isSubmitting: isSubmittingFeedback } = useFeedback();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email || null);
    };
    getUser();
  }, []);

  // Sync deletion password enabled state with settings
  useEffect(() => {
    if (settings) {
      setDeletionPasswordEnabled(settings.deletion_password_enabled ?? false);
    }
  }, [settings]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
    navigate("/auth");
  };

  const handleSubmitFeedback = () => {
    if (!feedbackMessage.trim()) return;
    
    submitFeedback(
      { type: feedbackType, message: feedbackMessage },
      {
        onSuccess: () => {
          setFeedbackMessage("");
          setFeedbackType('feedback');
        }
      }
    );
  };

  const handleSaveDeletionPassword = async () => {
    if (deletionPasswordInput.length < 4 || deletionPasswordInput.length > 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter entre 4 e 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d+$/.test(deletionPasswordInput)) {
      toast({
        title: "Senha inválida",
        description: "A senha deve conter apenas números.",
        variant: "destructive",
      });
      return;
    }

    if (deletionPasswordInput !== confirmDeletionPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    // If already has password, require current password first
    if (settings?.deletion_password_hash) {
      setPasswordModalAction('change');
      setShowPasswordModal(true);
      return;
    }

    setSavingDeletionPassword(true);
    const success = await saveDeletionPassword(deletionPasswordInput);
    setSavingDeletionPassword(false);

    if (success) {
      toast({
        title: "Senha de exclusão salva",
        description: "A proteção foi ativada com sucesso.",
      });
      setDeletionPasswordInput("");
      setConfirmDeletionPassword("");
      setDeletionPasswordEnabled(true);
    }
  };

  const handleToggleDeletionPassword = async (enabled: boolean) => {
    if (!enabled) {
      // If disabling and password exists, require password confirmation
      if (settings?.deletion_password_hash) {
        setPasswordModalAction('disable');
        setShowPasswordModal(true);
        return;
      }
      
      setSavingDeletionPassword(true);
      const success = await disableDeletionPassword();
      setSavingDeletionPassword(false);
      
      if (success) {
        setDeletionPasswordEnabled(false);
        toast({
          title: "Proteção desativada",
          description: "A senha de exclusão foi desativada.",
        });
      }
    } else {
      setDeletionPasswordEnabled(true);
    }
  };

  const handlePasswordModalConfirm = async () => {
    if (!currentPasswordInput) {
      setPasswordModalError(true);
      return;
    }

    setSavingDeletionPassword(true);
    
    if (passwordModalAction === 'disable') {
      const success = await disableDeletionPassword(currentPasswordInput);
      
      if (success) {
        setDeletionPasswordEnabled(false);
        setShowPasswordModal(false);
        setCurrentPasswordInput("");
        setPasswordModalError(false);
        toast({
          title: "Proteção desativada",
          description: "A senha de exclusão foi desativada.",
        });
      } else {
        setPasswordModalError(true);
      }
    } else if (passwordModalAction === 'change') {
      const success = await changeDeletionPassword(currentPasswordInput, deletionPasswordInput);
      
      if (success) {
        setShowPasswordModal(false);
        setCurrentPasswordInput("");
        setDeletionPasswordInput("");
        setConfirmDeletionPassword("");
        setPasswordModalError(false);
        toast({
          title: "Senha alterada",
          description: "A senha de exclusão foi alterada com sucesso.",
        });
      } else {
        setPasswordModalError(true);
      }
    }
    
    setSavingDeletionPassword(false);
  };

  const handleRequestPasswordReset = async () => {
    setIsRequestingReset(true);
    await requestDeletionPasswordReset();
    setIsRequestingReset(false);
    setShowPasswordModal(false);
    setCurrentPasswordInput("");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "EXCLUIR") return;
    
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke("delete-my-account");
      
      if (error) {
        toast({
          title: "Erro ao excluir conta",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso.",
      });
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (err) {
      toast({
        title: "Erro ao excluir conta",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
      setDeleteConfirmText("");
    }
  };

  const isPartner = status?.is_partner;
  const daysRemaining = status?.days_remaining;

  const getStatusBadge = () => {
    if (isSuperAdmin) {
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Vitalício</Badge>;
    }
    if (isPartner) {
      return <Badge className="bg-gold/20 text-gold border-gold/30">Parceiro</Badge>;
    }
    switch (status?.plan_status) {
      case "trial":
        return <Badge variant="secondary">Trial</Badge>;
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "overdue":
        return <Badge variant="destructive">Pagamento Pendente</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getPlanName = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isPartner) return "Parceiro";
    switch (status?.plan_type) {
      case "inicial":
        return "Plano Inicial";
      case "profissional":
        return "Plano Profissional";
      case "franquias":
        return "Plano Franquias";
      default:
        return "Sem plano";
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSuperAdmin ? (
              <Infinity className="h-5 w-5 text-purple-400" />
            ) : isPartner ? (
              <Crown className="h-5 w-5 text-gold" />
            ) : (
              <CreditCard className="h-5 w-5 text-primary" />
            )}
            Assinatura
          </CardTitle>
          <CardDescription>
            Gerencie seu plano e faturamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isSuperAdmin ? "bg-purple-500/20" : isPartner ? "bg-gold/20" : "bg-primary/20"
                  }`}>
                    {isSuperAdmin ? (
                      <Shield className="h-5 w-5 text-purple-400" />
                    ) : isPartner ? (
                      <Crown className="h-5 w-5 text-gold" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{getPlanName()}</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trial Progress */}
              {status?.plan_status === "trial" && daysRemaining !== null && (
                <div className="space-y-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-500 font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Período de teste
                    </span>
                    <span className="text-muted-foreground">{daysRemaining} dias restantes</span>
                  </div>
                  <Progress value={((7 - daysRemaining) / 7) * 100} className="h-2" />
                </div>
              )}

              {/* Partner Expiration */}
              {!isSuperAdmin && isPartner && status?.partner_ends_at && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-gold/10 border border-gold/20">
                  <Calendar className="h-4 w-4 text-gold" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gold">
                      Acesso válido até: {format(new Date(status.partner_ends_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {daysRemaining !== null && daysRemaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {daysRemaining} dia{daysRemaining > 1 ? 's' : ''} restante{daysRemaining > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Super Admin Info */}
              {isSuperAdmin && (
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-sm text-purple-400">
                    Você tem acesso vitalício como Super Admin. Sem restrições de faturamento.
                  </p>
                </div>
              )}

              {/* View Subscription Page Button */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/assinatura")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Ver Detalhes da Assinatura
              </Button>

              {/* Manage Subscription Button (Stripe Portal) */}
              {!isSuperAdmin && !isPartner && status?.plan_status === "active" && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={async () => {
                    setIsOpeningPortal(true);
                    await openCustomerPortal();
                    setIsOpeningPortal(false);
                  }}
                  disabled={isOpeningPortal}
                >
                  {isOpeningPortal ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Gerenciar no Stripe
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Atualize sua senha de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova Senha</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={changingPassword || !newPassword || !confirmPassword}>
              {changingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Deletion Password Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Senha de Exclusão
          </CardTitle>
          <CardDescription>
            Proteja a exclusão de agendamentos confirmados/finalizados com uma senha numérica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="deletion-password-toggle" className="text-sm font-medium">
                Exigir senha para excluir
              </Label>
              <p className="text-xs text-muted-foreground">
                Impede que colaboradores excluam agendamentos sem autorização
              </p>
            </div>
            <Switch
              id="deletion-password-toggle"
              checked={deletionPasswordEnabled}
              onCheckedChange={handleToggleDeletionPassword}
              disabled={savingDeletionPassword}
            />
          </div>
          
          {deletionPasswordEnabled && (
            <>
              <Separator />
              
              {settings?.deletion_password_hash ? (
                // Password already configured - show info and change option
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-500 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Senha de exclusão configurada e ativa
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Para alterar ou desativar, você precisará informar a senha atual.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deletion-password">Nova Senha (4-6 dígitos)</Label>
                      <Input
                        id="deletion-password"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={deletionPasswordInput}
                        onChange={(e) => setDeletionPasswordInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-deletion-password">Confirmar Nova Senha</Label>
                      <Input
                        id="confirm-deletion-password"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={confirmDeletionPassword}
                        onChange={(e) => setConfirmDeletionPassword(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                      />
                    </div>
                    <Button 
                      onClick={handleSaveDeletionPassword}
                      disabled={savingDeletionPassword || !deletionPasswordInput || !confirmDeletionPassword}
                      className="w-full"
                    >
                      {savingDeletionPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Alterar Senha
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Button 
                      variant="link" 
                      className="text-xs text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setPasswordModalAction('disable');
                        setShowPasswordModal(true);
                      }}
                    >
                      Esqueci minha senha de exclusão
                    </Button>
                  </div>
                </div>
              ) : (
                // No password yet - show setup form
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deletion-password">Nova Senha (4-6 dígitos)</Label>
                    <Input
                      id="deletion-password"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={deletionPasswordInput}
                      onChange={(e) => setDeletionPasswordInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-deletion-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-deletion-password"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={confirmDeletionPassword}
                      onChange={(e) => setConfirmDeletionPassword(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                    />
                  </div>
                  <Button 
                    onClick={handleSaveDeletionPassword}
                    disabled={savingDeletionPassword || !deletionPasswordInput || !confirmDeletionPassword}
                    className="w-full"
                  >
                    {savingDeletionPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar Senha
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Password Verification Modal */}
      <AlertDialog open={showPasswordModal} onOpenChange={(open) => {
        if (!open) {
          setShowPasswordModal(false);
          setCurrentPasswordInput("");
          setPasswordModalError(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirme sua senha de exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Para {passwordModalAction === 'disable' ? 'desativar a proteção' : 'alterar a senha'}, digite sua senha de exclusão atual:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password-modal">Senha atual</Label>
              <Input
                id="current-password-modal"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={currentPasswordInput}
                onChange={(e) => {
                  setCurrentPasswordInput(e.target.value.replace(/\D/g, ''));
                  setPasswordModalError(false);
                }}
                placeholder="••••••"
                className={passwordModalError ? "border-destructive" : ""}
              />
              {passwordModalError && (
                <p className="text-xs text-destructive">Senha incorreta. Tente novamente.</p>
              )}
            </div>
          </div>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="link"
              className="text-xs text-muted-foreground hover:text-primary mr-auto"
              onClick={handleRequestPasswordReset}
              disabled={isRequestingReset}
            >
              {isRequestingReset ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Esqueci minha senha"
              )}
            </Button>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePasswordModalConfirm();
              }}
              disabled={!currentPasswordInput || savingDeletionPassword}
            >
              {savingDeletionPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feedback Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Enviar Feedback
          </CardTitle>
          <CardDescription>
            Sua opinião é muito importante para nós. Compartilhe sua experiência ou reporte um problema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Tipo</Label>
            <RadioGroup 
              value={feedbackType} 
              onValueChange={(value) => setFeedbackType(value as typeof feedbackType)}
              className="grid grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="feedback" id="acc-feedback" className="peer sr-only" />
                <Label
                  htmlFor="acc-feedback"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <MessageSquare className="mb-2 h-5 w-5" />
                  <span className="text-xs">Feedback</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="bug" id="acc-bug" className="peer sr-only" />
                <Label
                  htmlFor="acc-bug"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <Bug className="mb-2 h-5 w-5" />
                  <span className="text-xs">Bug</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="suggestion" id="acc-suggestion" className="peer sr-only" />
                <Label
                  htmlFor="acc-suggestion"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <Lightbulb className="mb-2 h-5 w-5" />
                  <span className="text-xs">Sugestão</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="feedback-message" className="text-sm font-medium mb-2 block">
              Mensagem
            </Label>
            <Textarea
              id="feedback-message"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder={
                feedbackType === 'bug' 
                  ? "Descreva o problema encontrado com o máximo de detalhes..."
                  : feedbackType === 'suggestion'
                  ? "Compartilhe sua ideia de melhoria..."
                  : "Conte-nos sua experiência..."
              }
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={handleSubmitFeedback}
            disabled={!feedbackMessage.trim() || isSubmittingFeedback}
            className="w-full"
          >
            {isSubmittingFeedback ? "Enviando..." : "Enviar Feedback"}
          </Button>
        </CardContent>
      </Card>

      {/* Session Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Sessão
          </CardTitle>
          <CardDescription>
            Gerencie sua sessão de usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{email || "Carregando..."}</p>
              <p className="text-xs text-muted-foreground">Usuário logado</p>
            </div>
          </div>

          <Separator />

          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Sair do Sistema
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone - Cancel/Delete */}
      {!isSuperAdmin && (
        <Card className="border-destructive/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis. Tome cuidado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cancel Subscription */}
            {status?.plan_status === "active" && !isPartner && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Cancelar Assinatura</p>
                    <p className="text-sm text-muted-foreground">
                      Você continuará tendo acesso até o fim do período pago. Após isso, sua conta será desativada.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={async () => {
                    setIsOpeningPortal(true);
                    await openCustomerPortal();
                    setIsOpeningPortal(false);
                  }}
                  disabled={isOpeningPortal}
                >
                  {isOpeningPortal ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Cancelar Assinatura
                </Button>
              </div>
            )}

            {/* Delete Account */}
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Excluir Conta Permanentemente</p>
                  <p className="text-sm text-muted-foreground">
                    Esta ação é irreversível. Todos os seus dados, clientes, agendamentos e configurações serão excluídos permanentemente.
                  </p>
                  {status?.plan_status === "active" && (
                    <p className="text-sm text-destructive font-medium mt-2">
                      ⚠️ Você precisa cancelar sua assinatura antes de excluir a conta.
                    </p>
                  )}
                </div>
              </div>
              
              {status?.plan_status === "active" ? (
                <Button 
                  variant="outline" 
                  className="w-full border-destructive/50 text-destructive"
                  onClick={() => navigate("/assinatura")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Ir para Cancelar Assinatura
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Minha Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">
                        Tem certeza absoluta?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <p>
                          Esta ação <strong>não pode ser desfeita</strong>. Isso irá excluir permanentemente:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Sua conta e perfil</li>
                          <li>Todas as unidades e profissionais</li>
                          <li>Todos os clientes e histórico</li>
                          <li>Todos os agendamentos e dados financeiros</li>
                          <li>Todas as configurações e integrações</li>
                        </ul>
                        <div className="mt-4">
                          <Label htmlFor="delete-confirm" className="text-sm font-medium">
                            Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar:
                          </Label>
                          <Input
                            id="delete-confirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="EXCLUIR"
                            className="mt-2"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "EXCLUIR" || isDeletingAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir Permanentemente
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
