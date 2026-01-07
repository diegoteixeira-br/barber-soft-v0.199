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

// Contador global de mensagens enviadas na execução atual
let globalMessageIndex = 0;
let totalMessagesToSend = 0;

interface BusinessSettings {
  id: string;
  user_id: string;
  birthday_automation_enabled: boolean;
  birthday_message_template: string;
  rescue_automation_enabled: boolean;
  rescue_message_template: string;
  rescue_days_threshold: number;
  automation_send_hour: number;
  automation_send_minute: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  birth_date: string | null;
  last_visit_at: string | null;
  unit_id: string;
  company_id: string;
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

    console.log("=== INICIANDO AUTOMAÇÕES DE MARKETING (NATIVO) ===");
    
    // Horário atual em Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffset = -3 * 60; // minutos
    const localOffset = now.getTimezoneOffset();
    const brasiliaTime = new Date(now.getTime() + (localOffset + brasiliaOffset) * 60 * 1000);
    
    const currentHour = brasiliaTime.getHours();
    const currentMinute = brasiliaTime.getMinutes();
    const today = brasiliaTime.toISOString().split("T")[0];
    const todayMMDD = `${String(brasiliaTime.getMonth() + 1).padStart(2, "0")}-${String(brasiliaTime.getDate()).padStart(2, "0")}`;

    console.log(`Horário Brasília: ${currentHour}:${String(currentMinute).padStart(2, "0")}`);
    console.log(`Data hoje: ${today}, MM-DD: ${todayMMDD}`);

    // Buscar configurações com automações habilitadas
    const { data: settingsList, error: settingsError } = await supabase
      .from("business_settings")
      .select("*")
      .or("birthday_automation_enabled.eq.true,rescue_automation_enabled.eq.true");

    if (settingsError) {
      console.error("Erro ao buscar configurações:", settingsError);
      throw settingsError;
    }

    if (!settingsList || settingsList.length === 0) {
      console.log("Nenhuma empresa com automações habilitadas");
      return new Response(
        JSON.stringify({ message: "Nenhuma empresa com automações habilitadas", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Encontradas ${settingsList.length} empresas com automações`);

    let totalSent = 0;
    let totalSkipped = 0;
    const results: { client: string; type: string; status: string; error?: string }[] = [];

    for (const settings of settingsList as BusinessSettings[]) {
      const sendHour = settings.automation_send_hour ?? 10;
      const sendMinute = settings.automation_send_minute ?? 0;

      console.log(`\n--- Empresa user_id=${settings.user_id}, horário config=${sendHour}:${String(sendMinute).padStart(2, "0")} ---`);

      // Verificar se está dentro da janela de envio (±3 minutos)
      const configuredMinutes = sendHour * 60 + sendMinute;
      const currentMinutes = currentHour * 60 + currentMinute;
      const diffMinutes = Math.abs(configuredMinutes - currentMinutes);

      if (diffMinutes > 3) {
        console.log(`Fora da janela de envio (diff=${diffMinutes}min), pulando`);
        continue;
      }

      console.log(`Dentro da janela de envio (diff=${diffMinutes}min)`);

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

      // Buscar clientes da empresa
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("company_id", company.id);

      if (clientsError) {
        console.error("Erro ao buscar clientes:", clientsError);
        continue;
      }

      if (!clients || clients.length === 0) {
        console.log("Nenhum cliente encontrado");
        continue;
      }

      console.log(`Encontrados ${clients.length} clientes`);

      // Buscar unidades com WhatsApp (incluindo evolution_api_key)
      const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("id, name, evolution_instance_name, evolution_api_key")
        .eq("company_id", company.id)
        .not("evolution_instance_name", "is", null)
        .not("evolution_api_key", "is", null);

      if (unitsError || !units || units.length === 0) {
        console.log("Nenhuma unidade com WhatsApp configurado");
        continue;
      }

      const unitMap = new Map(units.map((u: Unit) => [u.id, u]));
      console.log(`Unidades com WhatsApp: ${units.map((u: Unit) => u.name).join(", ")}`);

      // Contar mensagens que serão enviadas para calcular delays adequados
      const clientsWithAutomations = (clients as Client[]).filter(c => c.phone && unitMap.get(c.unit_id));
      totalMessagesToSend = clientsWithAutomations.length;
      globalMessageIndex = 0;

      // Processar automações
      for (const client of clients as Client[]) {
        if (!client.phone) continue;

        const unit = unitMap.get(client.unit_id) as Unit | undefined;
        if (!unit) {
          console.log(`Cliente ${client.name} sem unidade com WhatsApp`);
          continue;
        }

        // === ANIVERSÁRIO ===
        if (settings.birthday_automation_enabled && client.birth_date) {
          const birthMMDD = client.birth_date.substring(5, 10); // "YYYY-MM-DD" -> "MM-DD"
          
          if (birthMMDD === todayMMDD) {
            // Verificar se já enviou hoje
            const { data: existingLog } = await supabase
              .from("automation_logs")
              .select("id")
              .eq("client_id", client.id)
              .eq("automation_type", "birthday")
              .gte("sent_at", today + "T00:00:00")
              .maybeSingle();

            if (existingLog) {
              console.log(`Aniversário já enviado para ${client.name} hoje`);
              totalSkipped++;
            } else {
              console.log(`🎂 Enviando aniversário para ${client.name}`);
              
              const message = (settings.birthday_message_template || "Feliz aniversário, {{nome}}! 🎂")
                .replace(/\{\{nome\}\}/gi, client.name)
                .replace(/\{\{name\}\}/gi, client.name);

              const sent = await sendWhatsAppMessage(
                evolutionApiUrl,
                unit,
                client,
                message,
                "birthday",
                company.id,
                supabase
              );

              if (sent) {
                totalSent++;
                results.push({ client: client.name, type: "birthday", status: "sent" });
              } else {
                results.push({ client: client.name, type: "birthday", status: "failed" });
              }
            }
          }
        }

        // === RESGATE ===
        if (settings.rescue_automation_enabled && client.last_visit_at) {
          const rescueDays = settings.rescue_days_threshold || 30;
          const lastVisit = new Date(client.last_visit_at);
          const daysSinceVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSinceVisit >= rescueDays) {
            // Verificar se já enviou este resgate (nos últimos 30 dias para não spammar)
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            const { data: existingLog } = await supabase
              .from("automation_logs")
              .select("id")
              .eq("client_id", client.id)
              .eq("automation_type", "rescue")
              .gte("sent_at", thirtyDaysAgo.toISOString())
              .maybeSingle();

            if (existingLog) {
              console.log(`Resgate já enviado para ${client.name} nos últimos 30 dias`);
              totalSkipped++;
            } else {
              console.log(`🔄 Enviando resgate para ${client.name} (${daysSinceVisit} dias sem visita)`);
              
              const message = (settings.rescue_message_template || "Olá {{nome}}! Sentimos sua falta. Que tal agendar uma visita?")
                .replace(/\{\{nome\}\}/gi, client.name)
                .replace(/\{\{name\}\}/gi, client.name)
                .replace(/\{\{dias\}\}/gi, String(daysSinceVisit));

              const sent = await sendWhatsAppMessage(
                evolutionApiUrl,
                unit,
                client,
                message,
                "rescue",
                company.id,
                supabase
              );

              if (sent) {
                totalSent++;
                results.push({ client: client.name, type: "rescue", status: "sent" });
              } else {
                results.push({ client: client.name, type: "rescue", status: "failed" });
              }
            }
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

async function sendWhatsAppMessage(
  evolutionApiUrl: string,
  unit: Unit,
  client: Client,
  message: string,
  automationType: string,
  companyId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<boolean> {
  try {
    // Delay humanizado antes de enviar (exceto para o primeiro)
    if (globalMessageIndex > 0) {
      const humanDelay = getHumanizedDelay(totalMessagesToSend, globalMessageIndex);
      console.log(`⏳ Aguardando ${humanDelay}ms antes de enviar para ${client.name}...`);
      await sleep(humanDelay);
    }
    globalMessageIndex++;

    // Formatar telefone
    let phone = client.phone.replace(/\D/g, "");
    if (phone.length <= 11) {
      phone = "55" + phone;
    }

    const evolutionUrl = `${evolutionApiUrl}/message/sendText/${unit.evolution_instance_name}`;
    
    // Calcular delay de presença (simulando digitação) - 1.5 a 3.5 segundos
    const presenceDelay = Math.floor(1500 + Math.random() * 2000);
    
    console.log(`Enviando para ${phone} via ${unit.evolution_instance_name} (presenceDelay: ${presenceDelay}ms)`);

    const response = await fetch(evolutionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": unit.evolution_api_key!,
      },
      body: JSON.stringify({
        number: phone,
        delay: presenceDelay,
        text: message,
      }),
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log(`✅ Mensagem enviada para ${client.name}`);

      await supabase.from("automation_logs").insert({
        company_id: companyId,
        client_id: client.id,
        automation_type: automationType,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      return true;
    } else {
      console.error(`❌ Erro ao enviar para ${client.name}:`, responseData);

      await supabase.from("automation_logs").insert({
        company_id: companyId,
        client_id: client.id,
        automation_type: automationType,
        status: "failed",
        error_message: JSON.stringify(responseData),
        sent_at: new Date().toISOString(),
      });

      return false;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro de conexão:`, error);

    await supabase.from("automation_logs").insert({
      company_id: companyId,
      client_id: client.id,
      automation_type: automationType,
      status: "failed",
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    });

    return false;
  }
}
