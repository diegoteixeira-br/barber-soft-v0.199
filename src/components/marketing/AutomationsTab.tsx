import { useState, useEffect } from "react";
import { Cake, UserX, Save, Loader2, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMarketingSettings } from "@/hooks/useMarketingSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AutomationsTab() {
  const { settings, isLoading, updateSettings } = useMarketingSettings();
  
  const [birthdayEnabled, setBirthdayEnabled] = useState(false);
  const [birthdayMessage, setBirthdayMessage] = useState("");
  const [rescueEnabled, setRescueEnabled] = useState(false);
  const [rescueDays, setRescueDays] = useState(30);
  const [rescueMessage, setRescueMessage] = useState("");
  const [sendHour, setSendHour] = useState(11);
  const [sendMinute, setSendMinute] = useState(30);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [reminderMessage, setReminderMessage] = useState("");

  useEffect(() => {
    if (settings) {
      setBirthdayEnabled(settings.birthday_automation_enabled ?? false);
      setBirthdayMessage(settings.birthday_message_template ?? "");
      setRescueEnabled(settings.rescue_automation_enabled ?? false);
      setRescueDays(settings.rescue_days_threshold ?? 30);
      setRescueMessage(settings.rescue_message_template ?? "");
      setSendHour(settings.automation_send_hour ?? 11);
      setSendMinute(settings.automation_send_minute ?? 30);
      setReminderEnabled(settings.appointment_reminder_enabled ?? false);
      setReminderMinutes(settings.appointment_reminder_minutes ?? 30);
      setReminderMessage(settings.appointment_reminder_template ?? "");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      birthday_automation_enabled: birthdayEnabled,
      birthday_message_template: birthdayMessage,
      rescue_automation_enabled: rescueEnabled,
      rescue_days_threshold: rescueDays,
      rescue_message_template: rescueMessage,
      automation_send_hour: sendHour,
      automation_send_minute: sendMinute,
      appointment_reminder_enabled: reminderEnabled,
      appointment_reminder_minutes: reminderMinutes,
      appointment_reminder_template: reminderMessage,
    });
  };

  // Reminder time options (in minutes)
  const reminderTimeOptions = [
    { value: 15, label: "15 minutos" },
    { value: 30, label: "30 minutos" },
    { value: 45, label: "45 minutos" },
    { value: 60, label: "1 hora" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  // Generate hour options (business hours: 8-20)
  const hourOptions = Array.from({ length: 13 }, (_, i) => i + 8);
  // Generate minute options (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div className="space-y-6">
      {/* Send Time Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Horário de Envio</CardTitle>
              <CardDescription>
                Define o horário em que as automações serão executadas diariamente (Horário de Brasília)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Enviar às</Label>
            <Select value={sendHour.toString()} onValueChange={(v) => setSendHour(Number(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((h) => (
                  <SelectItem key={h} value={h.toString()}>
                    {h.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-lg font-medium">:</span>
            <Select value={sendMinute.toString()} onValueChange={(v) => setSendMinute(Number(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">(Horário de Brasília)</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            💡 Recomendamos enviar no horário do almoço (11h-13h) para melhor taxa de leitura sem incomodar os clientes.
          </p>
        </CardContent>
      </Card>

      {/* Birthday Automation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Cake className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Aniversário</CardTitle>
                <CardDescription>
                  Envio automático de mensagem no dia do aniversário do cliente
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={birthdayEnabled}
              onCheckedChange={setBirthdayEnabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="birthday-message">Mensagem de Parabéns</Label>
          <Textarea
              id="birthday-message"
              placeholder="Olá {{nome}}! 🎂 Feliz aniversário! A equipe deseja um dia incrível pra você. Venha comemorar conosco! 🎉 Caso não queira receber esses mimos por aqui, digite SAIR."
              value={birthdayMessage}
              onChange={(e) => setBirthdayMessage(e.target.value)}
              className="mt-2 min-h-[100px]"
              disabled={!birthdayEnabled}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use <code className="rounded bg-muted px-1">{"{{nome}}"}</code> para inserir o nome do cliente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Rescue/Reactivation Automation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <UserX className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Resgate de Clientes</CardTitle>
                <CardDescription>
                  Envio automático para clientes inativos após X dias
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={rescueEnabled}
              onCheckedChange={setRescueEnabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="rescue-days" className="whitespace-nowrap">
              Enviar após
            </Label>
            <Input
              id="rescue-days"
              type="number"
              min={7}
              max={90}
              value={rescueDays}
              onChange={(e) => setRescueDays(Number(e.target.value))}
              className="w-20"
              disabled={!rescueEnabled}
            />
            <span className="text-sm text-muted-foreground">dias sem vir</span>
          </div>

          <div>
            <Label htmlFor="rescue-message">Mensagem de Resgate</Label>
          <Textarea
              id="rescue-message"
              placeholder="Olá {{nome}}! Sentimos sua falta! 💈 Já faz um tempo desde sua última visita. Bora dar aquele tapa no visual? Mas ó, se preferir não receber esses toques, é só mandar SAIR. Sem stress, a amizade continua! 🤜"
              value={rescueMessage}
              onChange={(e) => setRescueMessage(e.target.value)}
              className="mt-2 min-h-[100px]"
              disabled={!rescueEnabled}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use <code className="rounded bg-muted px-1">{"{{nome}}"}</code> para inserir o nome do cliente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Reminder Automation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Bell className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Lembrete de Agendamento</CardTitle>
                <CardDescription>
                  Envio automático de lembrete antes do horário agendado
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="reminder-minutes" className="whitespace-nowrap">
              Enviar
            </Label>
            <Select 
              value={reminderMinutes.toString()} 
              onValueChange={(v) => setReminderMinutes(Number(v))}
              disabled={!reminderEnabled}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reminderTimeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">antes do agendamento</span>
          </div>

          <div>
            <Label htmlFor="reminder-message">Mensagem de Lembrete</Label>
            <Textarea
              id="reminder-message"
              placeholder={`Olá {{nome}}! 👋

Lembrando do seu agendamento para HOJE às {{horario}} com {{profissional}}.

📍 {{servico}}

Aguardamos você! Se precisar remarcar, entre em contato. Tmj 💈

📌 Responda *SIM* para confirmar presença
📌 Responda *NÃO* se não puder comparecer`}
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              className="mt-2 min-h-[140px]"
              disabled={!reminderEnabled}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use: <code className="rounded bg-muted px-1">{"{{nome}}"}</code>, 
              <code className="ml-1 rounded bg-muted px-1">{"{{horario}}"}</code>, 
              <code className="ml-1 rounded bg-muted px-1">{"{{profissional}}"}</code>, 
              <code className="ml-1 rounded bg-muted px-1">{"{{servico}}"}</code>, 
              <code className="ml-1 rounded bg-muted px-1">{"{{data}}"}</code>
            </p>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              💡 <strong>Dica:</strong> Inclua opções de resposta (SIM/NÃO) para que o cliente possa confirmar presença diretamente pelo WhatsApp.
            </p>
          </div>

          <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            <strong>✅ Proteção anti-spam:</strong> Cada cliente recebe apenas 1 lembrete por agendamento, mesmo que o sistema verifique várias vezes.
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg">
          {updateSettings.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}