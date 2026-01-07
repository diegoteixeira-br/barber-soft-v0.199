import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para calcular delay humanizado anti-bloqueio
function getHumanizedDelay(totalMessages: number, currentIndex: number): number {
  let baseMin: number, baseMax: number;
  
  if (totalMessages <= 3) {
    baseMin = 3000; baseMax = 8000; // 3-8 segundos
  } else if (totalMessages <= 10) {
    baseMin = 8000; baseMax = 20000; // 8-20 segundos
  } else {
    baseMin = 15000; baseMax = 45000; // 15-45 segundos
  }
  
  // Adicionar variação aleatória
  const randomFactor = Math.random();
  const delay = Math.floor(baseMin + (baseMax - baseMin) * randomFactor);
  
  console.log(`Delay humanizado para mensagem ${currentIndex + 1}/${totalMessages}: ${delay}ms`);
  return delay;
}

// Função para delay assíncrono
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface BusinessSettings {
  id: string;
  user_id: string;
  appointment_reminder_enabled: boolean;
  appointment_reminder_minutes: number;
  appointment_reminder_template: string;
}

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  start_time: string;
  end_time: string;
  status: string;
  barber_id: string;
  service_id: string;
  unit_id: string;
  company_id: string;
}

interface Barber {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  evolution_instance_name: string | null;
  evolution_api_key: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");

    if (!evolutionApiUrl) {
      console.error("❌ EVOLUTION_API_URL não configurada");
      return new Response(
        JSON.stringify({ error: "EVOLUTION_API_URL não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== INICIANDO LEMBRETES DE AGENDAMENTO (NATIVO) ===");
    console.log(`Horário atual: ${new Date().toISOString()}`);

    // Buscar empresas com lembrete habilitado
    const { data: settingsList, error: settingsError } = await supabase
      .from("business_settings")
      .select("*")
      .eq("appointment_reminder_enabled", true);

    if (settingsError) {
      console.error("Erro ao buscar configurações:", settingsError);
      throw settingsError;
    }

    if (!settingsList || settingsList.length === 0) {
      console.log("Nenhuma empresa com lembrete habilitado");
      return new Response(
        JSON.stringify({ message: "Nenhuma empresa com lembrete habilitado", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Encontradas ${settingsList.length} empresas com lembrete habilitado`);

    let totalSent = 0;
    let totalSkipped = 0;
    const results: { appointment_id: string; client_name: string; status: string; error?: string }[] = [];

    for (const settings of settingsList as BusinessSettings[]) {
      const reminderMinutes = settings.appointment_reminder_minutes || 30;
      console.log(`\n--- Processando empresa user_id=${settings.user_id}, lembrete=${reminderMinutes}min ---`);

      // Buscar company_id
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("owner_user_id", settings.user_id)
        .single();

      if (companyError || !company) {
        console.log(`Empresa não encontrada para user_id=${settings.user_id}`);
        continue;
      }

      console.log(`Empresa: ${company.name} (${company.id})`);

      // Calcular janela de tempo
      const now = new Date();
      const targetTime = new Date(now.getTime() + reminderMinutes * 60 * 1000);
      const windowStart = new Date(targetTime.getTime() - 3 * 60 * 1000);
      const windowEnd = new Date(targetTime.getTime() + 3 * 60 * 1000);

      console.log(`Janela de busca: ${windowStart.toISOString()} até ${windowEnd.toISOString()}`);

      // Buscar agendamentos na janela (APENAS status válidos: pending e confirmed)
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("company_id", company.id)
        .in("status", ["pending", "confirmed"])
        .gte("start_time", windowStart.toISOString())
        .lte("start_time", windowEnd.toISOString());

      if (appointmentsError) {
        console.error("Erro ao buscar agendamentos:", appointmentsError);
        continue;
      }

      if (!appointments || appointments.length === 0) {
        console.log("Nenhum agendamento encontrado na janela");
        continue;
      }

      console.log(`Encontrados ${appointments.length} agendamentos na janela`);

      // Agrupar por unit_id
      const appointmentsByUnit: Record<string, Appointment[]> = {};
      for (const apt of appointments as Appointment[]) {
        if (!apt.client_phone) {
          console.log(`Agendamento ${apt.id} sem telefone, pulando`);
          continue;
        }
        if (!appointmentsByUnit[apt.unit_id]) {
          appointmentsByUnit[apt.unit_id] = [];
        }
        appointmentsByUnit[apt.unit_id].push(apt);
      }

      // Processar cada unidade
      for (const [unitId, unitAppointments] of Object.entries(appointmentsByUnit)) {
        // Buscar dados da unidade (incluindo WhatsApp)
        const { data: unit, error: unitError } = await supabase
          .from("units")
          .select("id, name, evolution_instance_name, evolution_api_key")
          .eq("id", unitId)
          .single();

        if (unitError || !unit) {
          console.log(`Unidade ${unitId} não encontrada`);
          continue;
        }

        if (!unit.evolution_instance_name || !unit.evolution_api_key) {
          console.log(`Unidade ${unit.name} sem WhatsApp configurado`);
          continue;
        }

        console.log(`Processando unidade: ${unit.name} (instância: ${unit.evolution_instance_name})`);

        // Buscar barbeiros e serviços necessários
        const barberIds = [...new Set(unitAppointments.map(a => a.barber_id).filter(Boolean))];
        const serviceIds = [...new Set(unitAppointments.map(a => a.service_id).filter(Boolean))];

        const { data: barbers } = await supabase
          .from("barbers")
          .select("id, name")
          .in("id", barberIds.length > 0 ? barberIds : ['00000000-0000-0000-0000-000000000000']);

        const { data: services } = await supabase
          .from("services")
          .select("id, name")
          .in("id", serviceIds.length > 0 ? serviceIds : ['00000000-0000-0000-0000-000000000000']);

        const barberMap = new Map((barbers || []).map((b: Barber) => [b.id, b.name]));
        const serviceMap = new Map((services || []).map((s: Service) => [s.id, s.name]));

        // Processar cada agendamento com delay humanizado
        const totalAppointments = unitAppointments.length;
        let appointmentIndex = 0;
        
        for (const appointment of unitAppointments) {
          // Verificar se já enviou lembrete para este agendamento
          const { data: existingLog } = await supabase
            .from("automation_logs")
            .select("id")
            .eq("appointment_id", appointment.id)
            .eq("automation_type", "appointment_reminder")
            .maybeSingle();

          if (existingLog) {
            console.log(`Lembrete já enviado para agendamento ${appointment.id}`);
            totalSkipped++;
            continue;
          }

          // Buscar client_id se existir
          let clientId: string | null = null;
          if (appointment.client_phone) {
            const normalizedPhone = appointment.client_phone.replace(/\D/g, "");
            const { data: client } = await supabase
              .from("clients")
              .select("id")
              .eq("company_id", company.id)
              .eq("unit_id", unitId)
              .or(`phone.eq.${normalizedPhone},phone.eq.${appointment.client_phone}`)
              .maybeSingle();

            if (client) {
              clientId = client.id;
            }
          }

          // Formatar mensagem
          const startTime = new Date(appointment.start_time);
          const barberName = barberMap.get(appointment.barber_id) || "Profissional";
          const serviceName = serviceMap.get(appointment.service_id) || "Serviço";

          let message = settings.appointment_reminder_template || 
            "Olá {{nome}}! Lembrete: você tem um agendamento às {{horario}} com {{profissional}}. Serviço: {{servico}}. Te esperamos!";

          message = message
            .replace(/\{\{nome\}\}/gi, appointment.client_name || "Cliente")
            .replace(/\{\{name\}\}/gi, appointment.client_name || "Cliente")
            .replace(/\{\{data\}\}/gi, startTime.toLocaleDateString("pt-BR"))
            .replace(/\{\{date\}\}/gi, startTime.toLocaleDateString("pt-BR"))
            .replace(/\{\{horario\}\}/gi, startTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
            .replace(/\{\{hora\}\}/gi, startTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
            .replace(/\{\{profissional\}\}/gi, barberName)
            .replace(/\{\{barber\}\}/gi, barberName)
            .replace(/\{\{servico\}\}/gi, serviceName)
            .replace(/\{\{service\}\}/gi, serviceName)
            .replace(/\{\{unidade\}\}/gi, unit.name);

          // Formatar telefone
          let phone = appointment.client_phone.replace(/\D/g, "");
          if (phone.length <= 11) {
            phone = "55" + phone;
          }

          console.log(`Enviando lembrete para ${appointment.client_name} (${phone})`);

          // Delay humanizado antes de enviar (exceto para o primeiro)
          if (appointmentIndex > 0) {
            const humanDelay = getHumanizedDelay(totalAppointments, appointmentIndex);
            console.log(`⏳ Aguardando ${humanDelay}ms antes de enviar para ${appointment.client_name}...`);
            await sleep(humanDelay);
          }
          appointmentIndex++;

          // Enviar via Evolution API (DIRETO, sem n8n)
          try {
            const evolutionUrl = `${evolutionApiUrl}/message/sendText/${unit.evolution_instance_name}`;
            
            // Calcular delay de presença (simulando digitação) - 1.5 a 3.5 segundos
            const presenceDelay = Math.floor(1500 + Math.random() * 2000);
            
            const response = await fetch(evolutionUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": unit.evolution_api_key,
              },
              body: JSON.stringify({
                number: phone,
                delay: presenceDelay,
                text: message,
              }),
            });

            const responseData = await response.json();

            if (response.ok) {
              console.log(`✅ Lembrete enviado para ${appointment.client_name}`);

              // Gravar log de sucesso
              await supabase.from("automation_logs").insert({
                company_id: company.id,
                client_id: clientId,
                appointment_id: appointment.id,
                automation_type: "appointment_reminder",
                status: "sent",
                sent_at: new Date().toISOString(),
              });

              totalSent++;
              results.push({
                appointment_id: appointment.id,
                client_name: appointment.client_name,
                status: "sent",
              });
            } else {
              console.error(`❌ Erro ao enviar para ${appointment.client_name}:`, responseData);

              // Gravar log de falha
              await supabase.from("automation_logs").insert({
                company_id: company.id,
                client_id: clientId,
                appointment_id: appointment.id,
                automation_type: "appointment_reminder",
                status: "failed",
                error_message: JSON.stringify(responseData),
                sent_at: new Date().toISOString(),
              });

              results.push({
                appointment_id: appointment.id,
                client_name: appointment.client_name,
                status: "failed",
                error: JSON.stringify(responseData),
              });
            }
          } catch (sendError: unknown) {
            const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
            console.error(`❌ Erro de conexão ao enviar para ${appointment.client_name}:`, sendError);

            await supabase.from("automation_logs").insert({
              company_id: company.id,
              client_id: clientId,
              appointment_id: appointment.id,
              automation_type: "appointment_reminder",
              status: "failed",
              error_message: errorMessage,
              sent_at: new Date().toISOString(),
            });

            results.push({
              appointment_id: appointment.id,
              client_name: appointment.client_name,
              status: "failed",
              error: errorMessage,
            });
          }
        }
      }
    }

    console.log(`\n=== RESUMO: ${totalSent} enviados, ${totalSkipped} já enviados anteriormente ===`);

    return new Response(
      JSON.stringify({
        message: "Processamento concluído",
        sent: totalSent,
        skipped: totalSkipped,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
