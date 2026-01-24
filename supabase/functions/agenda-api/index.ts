import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// === INPUT VALIDATION UTILITIES ===
// Maximum length constraints to prevent DoS via oversized inputs
const MAX_NAME_LENGTH = 200;
const MAX_PHONE_LENGTH = 20;
const MAX_NOTES_LENGTH = 1000;
const MAX_TAGS_COUNT = 10;
const MAX_TAG_LENGTH = 50;

// Validation helper functions
function validateStringLength(value: string | null | undefined, maxLength: number, fieldName: string): { valid: boolean; error?: string } {
  if (!value) return { valid: true };
  if (typeof value !== 'string') return { valid: false, error: `${fieldName} deve ser texto` };
  if (value.length > maxLength) return { valid: false, error: `${fieldName} excede o limite de ${maxLength} caracteres` };
  return { valid: true };
}

function validatePhone(phone: string | null | undefined): { valid: boolean; normalized?: string; error?: string } {
  if (!phone) return { valid: true };
  // Remove non-digits
  const normalized = phone.replace(/\D/g, '');
  // Brazilian phone: 10-11 digits (with area code), allow 12-13 with country code
  if (normalized.length < 10 || normalized.length > 13) {
    return { valid: false, error: 'Telefone deve ter entre 10 e 13 dígitos' };
  }
  return { valid: true, normalized };
}

function validateTags(tags: any): { valid: boolean; sanitized?: string[]; error?: string } {
  if (!tags) return { valid: true, sanitized: [] };
  if (!Array.isArray(tags)) return { valid: false, error: 'Tags deve ser um array' };
  if (tags.length > MAX_TAGS_COUNT) return { valid: false, error: `Máximo de ${MAX_TAGS_COUNT} tags permitidas` };
  
  const sanitized: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const trimmed = tag.trim().substring(0, MAX_TAG_LENGTH);
    if (trimmed) sanitized.push(trimmed);
  }
  return { valid: true, sanitized };
}

function validateDate(dateStr: string | null | undefined): { valid: boolean; error?: string } {
  if (!dateStr) return { valid: true };
  // Basic date format validation
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/;
  if (!dateRegex.test(dateStr)) {
    return { valid: false, error: 'Formato de data inválido. Use YYYY-MM-DD ou YYYY-MM-DDTHH:MM' };
  }
  return { valid: true };
}

// Sanitize text input - remove potentially dangerous characters
function sanitizeText(text: string): string {
  if (!text) return text;
  // Remove null bytes and trim
  return text.replace(/\0/g, '').trim();
}

// Generic error messages - never expose internal details
const GENERIC_ERRORS = {
  database: 'Erro ao processar solicitação',
  notFound: 'Recurso não encontrado',
  unauthorized: 'Não autorizado',
  validation: 'Dados inválidos',
  conflict: 'Conflito de dados',
  internal: 'Erro interno',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Mapeamento de fusos horários brasileiros para offsets
function getTimezoneOffset(timezone: string): string {
  const offsets: Record<string, string> = {
    'America/Sao_Paulo': '-03:00',
    'America/Cuiaba': '-04:00',
    'America/Manaus': '-04:00',
    'America/Fortaleza': '-03:00',
    'America/Recife': '-03:00',
    'America/Belem': '-03:00',
    'America/Rio_Branco': '-05:00',
    'America/Noronha': '-02:00',
    'America/Porto_Velho': '-04:00',
    'America/Boa_Vista': '-04:00',
  };
  return offsets[timezone] || '-03:00'; // Default: Brasília
}

// Normaliza input de datetime - SEMPRE trata como horário LOCAL (remove qualquer timezone)
function normalizeLocalDateTimeInput(dateTimeStr: string): string {
  if (!dateTimeStr) return dateTimeStr;
  
  // Remover timezone info (Z, +00:00, -03:00, etc.) para tratar como local
  let normalized = dateTimeStr
    .replace(/Z$/, '')
    .replace(/[+-]\d{2}:\d{2}$/, '')
    .replace(/\.\d{3}$/, ''); // Remover milissegundos
  
  console.log(`normalizeLocalDateTimeInput: "${dateTimeStr}" -> "${normalized}"`);
  return normalized;
}

// Converte uma data local (sem timezone) para UTC baseado no timezone da unidade
function convertLocalToUTC(dateTimeStr: string, timezone: string): Date {
  // Primeiro normalizar para remover qualquer timezone
  const normalizedDateTime = normalizeLocalDateTimeInput(dateTimeStr);
  
  // Adicionar o offset do timezone da unidade
  const offset = getTimezoneOffset(timezone);
  const localDateTime = `${normalizedDateTime}${offset}`;
  
  console.log(`convertLocalToUTC: "${dateTimeStr}" -> normalized: "${normalizedDateTime}" -> with offset ${offset}: "${localDateTime}"`);
  
  const result = new Date(localDateTime);
  console.log(`convertLocalToUTC result: ${result.toISOString()}`);
  
  return result;
}

// Calcula início e fim do dia em UTC baseado no timezone local
function getDayBoundsInUTC(dateStr: string, timezone: string): { startUTC: string; endUTC: string } {
  // dateStr pode ser "2026-01-05" ou "2026-01-05T10:00:00Z" etc.
  const dateOnly = dateStr.split('T')[0]; // Pegar apenas YYYY-MM-DD
  
  const startLocal = `${dateOnly}T00:00:00`;
  const endLocal = `${dateOnly}T23:59:59`;
  
  const startUTC = convertLocalToUTC(startLocal, timezone);
  const endUTC = convertLocalToUTC(endLocal, timezone);
  
  console.log(`getDayBoundsInUTC: ${dateOnly} (${timezone}) -> ${startUTC.toISOString()} to ${endUTC.toISOString()}`);
  
  return {
    startUTC: startUTC.toISOString(),
    endUTC: endUTC.toISOString()
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get API key from header and validate against universal N8N_SECRET_KEY
    const apiKey = req.headers.get('x-api-key');
    const n8nSecretKey = Deno.env.get('N8N_SECRET_KEY');
    
    if (!apiKey || apiKey !== n8nSecretKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ success: false, error: 'Chave de API inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, instance_name } = body;

    console.log('Agenda API called with action:', action);
    console.log('Request body:', JSON.stringify(body));

    // Resolve unit from instance_name or unit_id (authentication already done via N8N_SECRET_KEY)
    let resolvedUnitId = body.unit_id;
    let companyId = null;
    let unitTimezone = 'America/Sao_Paulo'; // default
    let validatedUnit = null;

    if (instance_name) {
      console.log(`Looking up unit by instance_name: ${instance_name}`);
      
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id, company_id, timezone, evolution_instance_name, evolution_api_key')
        .eq('evolution_instance_name', instance_name)
        .maybeSingle();
      
      if (unitError) {
        console.error('Error looking up unit:', unitError);
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao buscar unidade' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!unit) {
        console.error(`Unit not found for instance: ${instance_name}`);
        return new Response(
          JSON.stringify({ success: false, error: `Unidade não encontrada para a instância "${instance_name}"` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      validatedUnit = unit;
      resolvedUnitId = unit.id;
      companyId = unit.company_id;
      unitTimezone = unit.timezone || 'America/Sao_Paulo';
      console.log(`Resolved unit_id: ${resolvedUnitId}, company_id: ${companyId}, timezone: ${unitTimezone}`);
    } else if (resolvedUnitId) {
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id, company_id, timezone, evolution_instance_name, evolution_api_key')
        .eq('id', resolvedUnitId)
        .maybeSingle();

      if (unitError || !unit) {
        console.error('Unit not found for id:', resolvedUnitId);
        return new Response(
          JSON.stringify({ success: false, error: 'Unidade não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      validatedUnit = unit;
      companyId = unit.company_id;
      unitTimezone = unit.timezone || 'America/Sao_Paulo';
      console.log(`Resolved unit_id: ${resolvedUnitId}, company_id: ${companyId}, timezone: ${unitTimezone}`);
    } else {
      console.error('No instance_name or unit_id provided');
      return new Response(
        JSON.stringify({ success: false, error: 'É necessário fornecer instance_name ou unit_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Passar o unit_id resolvido para os handlers (inclui credenciais Evolution da unidade validada)
    const enrichedBody = { 
      ...body, 
      unit_id: resolvedUnitId, 
      company_id: companyId, 
      unit_timezone: unitTimezone,
      evolution_instance_name: validatedUnit?.evolution_instance_name || body.evolution_instance_name || null,
      evolution_api_key: validatedUnit?.evolution_api_key || body.evolution_api_key || null
    };

    switch (action) {
      // Consultar disponibilidade (alias: check_availability)
      case 'check':
      case 'check_availability':
        return await handleCheck(supabase, enrichedBody, corsHeaders);
      
      // Criar agendamento (alias: schedule_appointment)
      case 'create':
      case 'schedule_appointment':
        return await handleCreate(supabase, enrichedBody, corsHeaders);
      
      // Cancelar agendamento (alias: cancel_appointment)
      case 'cancel':
      case 'cancel_appointment':
        return await handleCancel(supabase, enrichedBody, corsHeaders);
      
      // Consultar cliente pelo telefone
      case 'check_client':
        return await handleCheckClient(supabase, enrichedBody, corsHeaders);
      
      // Cadastrar novo cliente (sem agendamento)
      case 'register_client':
        return await handleRegisterClient(supabase, enrichedBody, corsHeaders);
      
      // Atualizar dados de cliente existente
      case 'update_client':
        return await handleUpdateClient(supabase, enrichedBody, corsHeaders);
      
      // Verificar slot específico (profissional + horário)
      case 'check_slot':
        return await handleCheckSlot(supabase, enrichedBody, corsHeaders);
      
      // Confirmar ou cancelar agendamento via resposta do cliente
      case 'confirm_appointment':
        return await handleConfirmAppointment(supabase, enrichedBody, corsHeaders);
      
      // Adicionar dependente a um cliente
      case 'add_dependent':
        return await handleAddDependent(supabase, enrichedBody, corsHeaders);
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida. Actions válidas: check, check_availability, create, schedule_appointment, cancel, cancel_appointment, check_client, register_client, update_client, check_slot, confirm_appointment, add_dependent' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Error in agenda-api:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper para verificar se um horário está dentro do intervalo do barbeiro
function isWithinLunchBreak(barber: any, hour: number, minute: number): boolean {
  if (!barber.lunch_break_enabled || !barber.lunch_break_start || !barber.lunch_break_end) {
    return false;
  }
  
  const slotMinutes = hour * 60 + minute;
  const [startHour, startMin] = barber.lunch_break_start.split(":").map(Number);
  const [endHour, endMin] = barber.lunch_break_end.split(":").map(Number);
  const lunchStartMinutes = startHour * 60 + (startMin || 0);
  const lunchEndMinutes = endHour * 60 + (endMin || 0);
  
  return slotMinutes >= lunchStartMinutes && slotMinutes < lunchEndMinutes;
}

// Handler para consultar disponibilidade
async function handleCheck(supabase: any, body: any, corsHeaders: any) {
  const { date, professional, unit_id, unit_timezone } = body;
  const timezone = unit_timezone || 'America/Sao_Paulo';

  if (!date) {
    return new Response(
      JSON.stringify({ success: false, error: 'Data é obrigatória' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'unit_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Checking availability for date: ${date}, professional: ${professional || 'any'}, unit: ${unit_id}, timezone: ${timezone}`);

  // Buscar user_id da unidade para obter configurações de expediente
  const { data: unitData, error: unitError } = await supabase
    .from('units')
    .select('user_id')
    .eq('id', unit_id)
    .single();

  if (unitError) {
    console.error('Error fetching unit:', unitError);
  }

  // Buscar horário de expediente configurado
  let openingHour = 8;  // default
  let closingHour = 21; // default

  if (unitData?.user_id) {
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('opening_time, closing_time')
      .eq('user_id', unitData.user_id)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching business settings:', settingsError);
    }

    if (settings) {
      if (settings.opening_time) {
        openingHour = parseInt(settings.opening_time.split(':')[0]);
      }
      if (settings.closing_time) {
        closingHour = parseInt(settings.closing_time.split(':')[0]);
      }
      console.log(`Using configured hours: ${openingHour}:00 - ${closingHour}:00`);
    }
  }

  // Calcular hora atual no timezone da unidade
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const todayDate = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
  const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

  const dateOnly = date.split('T')[0];
  const isToday = dateOnly === todayDate;

  console.log(`Today in timezone ${timezone}: ${todayDate}, current time: ${currentHour}:${currentMinute}, requested date: ${dateOnly}, isToday: ${isToday}`);

  // Buscar barbeiros ativos da unidade (incluindo config de intervalo)
  let barbersQuery = supabase
    .from('barbers')
    .select('id, name, calendar_color, lunch_break_enabled, lunch_break_start, lunch_break_end')
    .eq('unit_id', unit_id)
    .eq('is_active', true);

  if (professional && professional.trim() !== '') {
    barbersQuery = barbersQuery.ilike('name', `%${professional}%`);
  }

  const { data: barbers, error: barbersError } = await barbersQuery;

  if (barbersError) {
    console.error('Error fetching barbers:', barbersError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar barbeiros' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!barbers || barbers.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        date,
        available_slots: [],
        message: professional ? `Nenhum barbeiro encontrado com o nome "${professional}"` : 'Nenhum barbeiro ativo encontrado'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Found ${barbers.length} barbers`);

  // Buscar serviços ativos da unidade
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('unit_id', unit_id)
    .eq('is_active', true);

  if (servicesError) {
    console.error('Error fetching services:', servicesError);
  }

  // Buscar agendamentos do dia (exceto cancelados) - usar timezone correto
  const { startUTC, endUTC } = getDayBoundsInUTC(date, timezone);

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id, barber_id, start_time, end_time, status')
    .eq('unit_id', unit_id)
    .gte('start_time', startUTC)
    .lte('start_time', endUTC)
    .neq('status', 'cancelled');

  if (appointmentsError) {
    console.error('Error fetching appointments:', appointmentsError);
  }

  console.log(`Found ${appointments?.length || 0} existing appointments`);

  // Gerar slots disponíveis (usando horário de expediente configurado)
  const availableSlots: any[] = [];

  for (let hour = openingHour; hour < closingHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      // Filtrar horários passados se for hoje
      if (isToday) {
        if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
          continue; // Pula este slot pois já passou
        }
      }

      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const slotLocalStr = `${dateOnly}T${timeStr}:00`;
      const slotStart = convertLocalToUTC(slotLocalStr, timezone);

      for (const barber of barbers) {
        // Verificar se está no intervalo do barbeiro
        const isLunchBreak = isWithinLunchBreak(barber, hour, minute);
        
        // Verificar se o barbeiro está ocupado neste horário
        const isOccupied = appointments?.some((apt: any) => {
          if (apt.barber_id !== barber.id) return false;
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          return slotStart >= aptStart && slotStart < aptEnd;
        });

        // Só adiciona slot se não estiver ocupado E não for intervalo
        if (!isOccupied && !isLunchBreak) {
          availableSlots.push({
            time: timeStr,
            datetime: slotStart.toISOString(),
            barber_id: barber.id,
            barber_name: barber.name,
            status: "vago"
          });
        }
      }
    }
  }

  console.log(`Generated ${availableSlots.length} available slots`);

  return new Response(
    JSON.stringify({
      success: true,
      date,
      available_slots: availableSlots,
      services: services || []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para criar agendamento
async function handleCreate(supabase: any, body: any, corsHeaders: any) {
  // Normalizar campos (aceitar ambos formatos)
  const clientName = body.nome || body.client_name;
  const rawPhone = body.telefone || body.client_phone;
  // Normalizar telefone - remover caracteres especiais para consistência
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const dateTime = body.data || body.datetime || body.date;
  const barberName = body.barbeiro_nome || body.professional;
  const serviceName = body.servico || body.service;
  const { unit_id, company_id, unit_timezone } = body;
  const timezone = unit_timezone || 'America/Sao_Paulo';

  // NOVOS CAMPOS para cadastro completo do cliente
  const clientBirthDate = body.data_nascimento || body.birth_date || null;
  const clientNotes = body.observacoes || body.notes || null;
  const clientTags = body.tags || ['Novo'];

  // Validações
  // Validate required fields
  if (!clientName || !barberName || !serviceName || !dateTime || !unit_id) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Campos obrigatórios: nome/client_name, barbeiro_nome/professional, servico/service, data/datetime' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // === INPUT VALIDATION ===
  // Validate client name length
  const nameValidation = validateStringLength(clientName, MAX_NAME_LENGTH, 'Nome');
  if (!nameValidation.valid) {
    return new Response(
      JSON.stringify({ success: false, error: nameValidation.error }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate and normalize phone
  const phoneValidation = validatePhone(rawPhone);
  if (!phoneValidation.valid) {
    return new Response(
      JSON.stringify({ success: false, error: phoneValidation.error }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate date format
  const dateValidation = validateDate(dateTime);
  if (!dateValidation.valid) {
    return new Response(
      JSON.stringify({ success: false, error: dateValidation.error }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate notes length
  const notesValidation = validateStringLength(clientNotes, MAX_NOTES_LENGTH, 'Observações');
  if (!notesValidation.valid) {
    return new Response(
      JSON.stringify({ success: false, error: notesValidation.error }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate and sanitize tags
  const tagsValidation = validateTags(clientTags);
  if (!tagsValidation.valid) {
    return new Response(
      JSON.stringify({ success: false, error: tagsValidation.error }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const sanitizedTags = tagsValidation.sanitized || ['Novo'];

  // Sanitize text inputs
  const sanitizedClientName = sanitizeText(clientName);
  const sanitizedBarberName = sanitizeText(barberName);
  const sanitizedServiceName = sanitizeText(serviceName);
  const sanitizedNotes = clientNotes ? sanitizeText(clientNotes) : null;

  // Se unit_timezone não veio do enrichedBody, buscar da unidade
  let finalTimezone = timezone;
  if (!unit_timezone) {
    const { data: unitData, error: unitTimezoneError } = await supabase
      .from('units')
      .select('timezone')
      .eq('id', unit_id)
      .single();

    if (unitTimezoneError) {
      console.error('Error fetching unit timezone:', unitTimezoneError);
    }
    finalTimezone = unitData?.timezone || 'America/Sao_Paulo';
  }

  console.log(`Creating appointment: ${clientName} with ${barberName} for ${serviceName} at ${dateTime}`);
  console.log(`Unit timezone: ${finalTimezone}`);
  console.log(`Normalized phone: ${clientPhone}`);
  console.log(`Extra client data - birth_date: ${clientBirthDate}, notes: ${clientNotes}, tags: ${JSON.stringify(clientTags)}`);

  // === VERIFICAR/CRIAR CLIENTE ===
  let clientCreated = false;
  let clientData = null;

  if (clientPhone) {
    // Buscar cliente existente pelo telefone normalizado
    const { data: existingClient, error: clientFetchError } = await supabase
      .from('clients')
      .select('id, name, phone, birth_date, notes, tags, total_visits')
      .eq('unit_id', unit_id)
      .eq('phone', clientPhone)
      .maybeSingle();

    if (clientFetchError) {
      console.error('Error fetching client:', clientFetchError);
    }

    if (existingClient) {
      console.log('Cliente existente encontrado:', existingClient);
      
      // Verificar se temos novos dados para atualizar
      const updateData: any = {};
      if (clientBirthDate && !existingClient.birth_date) {
        updateData.birth_date = clientBirthDate;
      }
      if (clientNotes && clientNotes !== existingClient.notes) {
        updateData.notes = clientNotes;
      }
      if (clientTags && clientTags.length > 0) {
        // Merge tags existentes com novas (sem duplicatas)
        const existingTags = existingClient.tags || [];
        const mergedTags = [...new Set([...existingTags, ...clientTags])];
        if (JSON.stringify(mergedTags) !== JSON.stringify(existingTags)) {
          updateData.tags = mergedTags;
        }
      }

      // Atualizar cliente se houver novos dados
      if (Object.keys(updateData).length > 0) {
        console.log('Atualizando cliente existente com novos dados:', updateData);
        const { data: updatedClient, error: updateError } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', existingClient.id)
          .select('id, name, phone, birth_date, notes, tags, total_visits')
          .single();

        if (updateError) {
          console.error('Erro ao atualizar cliente:', updateError);
          clientData = existingClient;
        } else {
          console.log('Cliente atualizado com sucesso:', updatedClient);
          clientData = updatedClient;
        }
      } else {
        clientData = existingClient;
      }
    } else {
      // Criar novo cliente com telefone
      console.log(`Criando novo cliente: ${clientName} - ${clientPhone}`);
      const { data: newClient, error: clientCreateError } = await supabase
        .from('clients')
        .insert({
          unit_id,
          company_id: company_id || null,
          name: clientName,
          phone: clientPhone,
          birth_date: clientBirthDate,
          notes: clientNotes,
          tags: clientTags,
          total_visits: 0
        })
        .select('id, name, phone, birth_date, notes, tags, total_visits')
        .single();

      if (clientCreateError) {
        console.error('ERRO ao criar cliente:', clientCreateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: GENERIC_ERRORS.database
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Novo cliente criado com sucesso:', newClient);
      clientData = newClient;
      clientCreated = true;
    }
  } else if (clientName) {
    // === SEM TELEFONE: Buscar por nome + data nascimento ===
    console.log(`Cliente sem telefone, buscando por nome: ${clientName}`);
    
    let clientQuery = supabase
      .from('clients')
      .select('id, name, phone, birth_date, notes, tags, total_visits')
      .eq('unit_id', unit_id)
      .ilike('name', clientName);
    
    if (clientBirthDate) {
      clientQuery = clientQuery.eq('birth_date', clientBirthDate);
    }
    
    const { data: existingClient, error: clientFetchError } = await clientQuery.maybeSingle();

    if (clientFetchError) {
      console.error('Error fetching client by name:', clientFetchError);
    }

    if (existingClient) {
      console.log('Cliente encontrado por nome:', existingClient);
      clientData = existingClient;
    } else {
      // Criar cliente SEM telefone
      console.log(`Criando novo cliente sem telefone: ${clientName}`);
      const { data: newClient, error: clientCreateError } = await supabase
        .from('clients')
        .insert({
          unit_id,
          company_id: company_id || null,
          name: clientName,
          phone: null,
          birth_date: clientBirthDate,
          notes: clientNotes,
          tags: clientTags,
          total_visits: 0
        })
        .select('id, name, phone, birth_date, notes, tags, total_visits')
        .single();

      if (clientCreateError) {
        console.error('Erro ao criar cliente sem telefone:', clientCreateError);
        // Não bloquear agendamento se falhar cadastro sem telefone
      } else {
        console.log('Novo cliente (sem telefone) criado:', newClient);
        clientData = newClient;
        clientCreated = true;
      }
    }
  }

  // Buscar o barbeiro pelo nome
  const { data: barbers, error: barberError } = await supabase
    .from('barbers')
    .select('id, name, company_id')
    .eq('unit_id', unit_id)
    .eq('is_active', true)
    .ilike('name', `%${barberName}%`)
    .limit(1);

  if (barberError || !barbers || barbers.length === 0) {
    console.error('Barber not found:', barberError);
    return new Response(
      JSON.stringify({ success: false, error: `Barbeiro "${barberName}" não encontrado` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const barber = barbers[0];
  console.log('Found barber:', barber);

  // Buscar o serviço pelo nome
  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('unit_id', unit_id)
    .eq('is_active', true)
    .ilike('name', `%${serviceName}%`)
    .limit(1);

  if (serviceError || !services || services.length === 0) {
    console.error('Service not found:', serviceError);
    return new Response(
      JSON.stringify({ success: false, error: `Serviço "${serviceName}" não encontrado` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const selectedService = services[0];
  console.log('Found service:', selectedService);

  // Calcular end_time - converter para UTC baseado no timezone da unidade
  // IMPORTANTE: Sempre tratar dateTime como horário LOCAL
  const startTime = convertLocalToUTC(dateTime, finalTimezone);
  const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);
  
  console.log(`Input datetime: ${dateTime}`);
  console.log(`Converted start_time (UTC): ${startTime.toISOString()}`);
  console.log(`Calculated end_time (UTC): ${endTime.toISOString()}`);

  // Verificar se o horário está disponível
  const { data: conflictingApts, error: conflictError } = await supabase
    .from('appointments')
    .select('id')
    .eq('unit_id', unit_id)
    .eq('barber_id', barber.id)
    .neq('status', 'cancelled')
    .lt('start_time', endTime.toISOString())
    .gt('end_time', startTime.toISOString());

  if (conflictError) {
    console.error('Error checking conflicts:', conflictError);
  }

  if (conflictingApts && conflictingApts.length > 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Horário não disponível. ${barber.name} já tem agendamento neste horário.` 
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // === SUPORTE A DEPENDENTES ===
  // Se is_dependent = true e dependent_name fornecido, buscar ou criar dependente
  const isDependent = body.is_dependent === true || body.is_dependent === 'true';
  const dependentName = sanitizeText(body.dependent_name || '');
  const dependentRelationship = sanitizeText(body.dependent_relationship || body.relationship || '');
  const dependentBirthDate = body.dependent_birth_date || null;
  
  let dependentId: string | null = null;
  let appointmentClientName = clientName; // Nome que vai aparecer no agendamento
  
  if (isDependent && dependentName && clientData?.id) {
    console.log(`Agendamento para dependente: "${dependentName}" (Titular: ${clientName})`);
    
    // Buscar dependente existente pelo nome (vinculado ao cliente titular)
    const { data: existingDependents, error: depSearchError } = await supabase
      .from('client_dependents')
      .select('id, name, relationship, birth_date')
      .eq('client_id', clientData.id)
      .eq('unit_id', unit_id)
      .ilike('name', dependentName);
    
    if (depSearchError) {
      console.error('Erro ao buscar dependente:', depSearchError);
    }
    
    if (existingDependents && existingDependents.length > 0) {
      // Dependente já existe
      dependentId = existingDependents[0].id;
      appointmentClientName = existingDependents[0].name;
      console.log(`Dependente encontrado: ${existingDependents[0].name} (ID: ${dependentId})`);
    } else {
      // Criar novo dependente
      console.log(`Criando novo dependente: "${dependentName}" para cliente ${clientData.id}`);
      const { data: newDependent, error: depCreateError } = await supabase
        .from('client_dependents')
        .insert({
          client_id: clientData.id,
          unit_id,
          company_id: company_id || null,
          name: dependentName,
          relationship: dependentRelationship || null,
          birth_date: dependentBirthDate || null,
          notes: null
        })
        .select('id, name')
        .single();
      
      if (depCreateError) {
        console.error('Erro ao criar dependente:', depCreateError);
        // Continuar mesmo se falhar - usar nome informado
        appointmentClientName = dependentName;
      } else {
        dependentId = newDependent.id;
        appointmentClientName = newDependent.name;
        console.log(`Novo dependente criado: ${newDependent.name} (ID: ${dependentId})`);
      }
    }
  } else if (isDependent && dependentName) {
    // is_dependent = true mas não temos clientData.id (cliente não cadastrado)
    // Usar o nome do dependente no agendamento sem vincular
    appointmentClientName = dependentName;
    console.log(`Dependente informado mas titular não cadastrado. Usando nome: ${dependentName}`);
  }

  // Criar o agendamento (source = 'whatsapp' pois veio pela API)
  const { data: appointment, error: createError } = await supabase
    .from('appointments')
    .insert({
      unit_id,
      company_id: company_id || barber.company_id,
      barber_id: barber.id,
      service_id: selectedService.id,
      client_name: appointmentClientName, // Nome do dependente ou titular
      client_phone: clientPhone || null, // Sempre telefone do titular (responsável)
      client_birth_date: isDependent ? (dependentBirthDate || null) : (clientBirthDate || null),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_price: selectedService.price,
      status: 'pending',
      source: 'whatsapp',
      is_dependent: isDependent,
      dependent_id: dependentId
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating appointment:', createError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao criar agendamento' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Appointment created:', appointment);

  // === ENVIO DE CONFIRMAÇÃO VIA WHATSAPP (não-bloqueante) ===
  const { evolution_instance_name, evolution_api_key } = body;

  if (clientPhone && evolution_instance_name && evolution_api_key) {
    try {
      // Formatar telefone: adicionar 55 se necessário (apenas para envio)
      let phoneForMessage = clientPhone.replace(/\D/g, '');
      if (!phoneForMessage.startsWith('55') && phoneForMessage.length <= 11) {
        phoneForMessage = '55' + phoneForMessage;
      }
      
      console.log(`Tentando enviar confirmação para ${phoneForMessage}...`);
      
      const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.evolution.barbersoft.com.br';
      const evolutionUrl = `${evolutionApiUrl}/message/sendText/${evolution_instance_name}`;
      
      // Formatar data/hora para exibição
      const startDate = new Date(startTime);
      const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: finalTimezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const formattedDateTime = dateFormatter.format(startDate);
      
      const confirmationMessage = `✅ *Agendamento Confirmado!*\n\n` +
        `Olá ${clientName}!\n\n` +
        `Seu agendamento foi realizado com sucesso:\n\n` +
        `📅 *Data/Hora:* ${formattedDateTime}\n` +
        `✂️ *Serviço:* ${selectedService.name}\n` +
        `💈 *Profissional:* ${barber.name}\n` +
        `💰 *Valor:* R$ ${selectedService.price.toFixed(2)}\n\n` +
        `Até lá! 💈`;
      
      // Enviar sem await (fire-and-forget) - não bloquear resposta
      fetch(evolutionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolution_api_key,
        },
        body: JSON.stringify({
          number: phoneForMessage,
          text: confirmationMessage,
        }),
      }).then(res => {
        console.log(`Mensagem de confirmação enviada: ${res.status}`);
      }).catch(err => {
        console.error('Erro ao enviar mensagem (não-crítico):', err.message);
      });
      
      console.log('Envio de confirmação disparado (fire-and-forget)');
    } catch (msgError) {
      // Log do erro mas NÃO falhar o agendamento
      console.error('Erro ao preparar mensagem de confirmação:', msgError);
    }
  } else {
    console.log('Confirmação WhatsApp não enviada - credenciais ou telefone ausentes');
  }

  // Retornar sucesso IMEDIATAMENTE (não espera a mensagem)
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Agendamento criado com sucesso!',
      client_created: clientCreated,
      client: clientData ? {
        id: clientData.id,
        name: clientData.name,
        phone: clientData.phone,
        birth_date: clientData.birth_date,
        notes: clientData.notes,
        tags: clientData.tags,
        is_new: clientCreated
      } : null,
      dependent: dependentId ? {
        id: dependentId,
        name: appointmentClientName,
        relationship: dependentRelationship || null
      } : null,
      appointment: {
        id: appointment.id,
        client_name: appointment.client_name,
        is_dependent: isDependent,
        dependent_id: dependentId,
        responsible_name: isDependent ? clientName : null,
        responsible_phone: clientPhone,
        barber: barber.name,
        service: selectedService.name,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        total_price: appointment.total_price,
        status: appointment.status
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper to record cancellation in history
async function recordCancellationHistory(
  supabase: any,
  appointment: any,
  barberName: string,
  serviceName: string,
  source: string = "whatsapp"
) {
  const now = new Date();
  const scheduledTime = new Date(appointment.start_time);
  const minutesBefore = Math.round((scheduledTime.getTime() - now.getTime()) / 60000);
  const isLateCancellation = minutesBefore < 10;

  const { error } = await supabase
    .from("cancellation_history")
    .insert({
      unit_id: appointment.unit_id,
      company_id: appointment.company_id || null,
      appointment_id: appointment.id,
      client_name: appointment.client_name,
      client_phone: appointment.client_phone,
      barber_name: barberName,
      service_name: serviceName,
      scheduled_time: appointment.start_time,
      cancelled_at: now.toISOString(),
      minutes_before: minutesBefore,
      is_late_cancellation: isLateCancellation,
      is_no_show: false,
      total_price: appointment.total_price || 0,
      cancellation_source: source,
    });

  if (error) {
    console.error("Error recording cancellation history:", error);
  } else {
    console.log(`Cancellation recorded in history: ${appointment.client_name}, ${minutesBefore} min before, late: ${isLateCancellation}`);
  }
}

// Handler para cancelar agendamento
async function handleCancel(supabase: any, body: any, corsHeaders: any) {
  // Normalizar campos
  const appointmentId = body.appointment_id;
  const rawPhone = body.telefone || body.client_phone;
  // Normalizar telefone - remover caracteres especiais para consistência
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const targetDate = body.data || body.datetime;
  const { unit_id, company_id, unit_timezone } = body;
  const timezone = unit_timezone || 'America/Sao_Paulo';

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'unit_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!appointmentId && !clientPhone) {
    return new Response(
      JSON.stringify({ success: false, error: 'Informe appointment_id ou telefone/client_phone' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Cancelling appointment: id=${appointmentId}, phone=${clientPhone}, date=${targetDate}, unit=${unit_id}, timezone=${timezone}`);

  // Se temos appointment_id, cancelar diretamente
  if (appointmentId) {
    // First fetch full appointment data for history
    const { data: fullAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        barber:barbers(name),
        service:services(name)
      `)
      .eq('id', appointmentId)
      .eq('unit_id', unit_id)
      .in('status', ['pending', 'confirmed'])
      .single();

    if (fetchError || !fullAppointment) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agendamento não encontrado ou já cancelado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cancel the appointment
    const { data: cancelled, error: cancelError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)
      .select();

    if (cancelError) {
      console.error('Error cancelling appointment:', cancelError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao cancelar agendamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record in cancellation history
    await recordCancellationHistory(
      supabase,
      { ...fullAppointment, company_id: company_id || fullAppointment.company_id },
      fullAppointment.barber?.name || 'Desconhecido',
      fullAppointment.service?.name || 'Serviço',
      'whatsapp'
    );

    console.log('Appointment cancelled by ID:', cancelled[0]);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Agendamento cancelado com sucesso!',
        cancelled_appointment: cancelled[0]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Se temos telefone, buscar agendamento com dados completos
  let query = supabase
    .from('appointments')
    .select(`
      id, client_name, client_phone, start_time, end_time, status, created_at, total_price, unit_id, company_id,
      barber:barbers(name),
      service:services(name)
    `)
    .eq('unit_id', unit_id)
    .eq('client_phone', clientPhone)
    .in('status', ['pending', 'confirmed']);

  // Se data específica foi fornecida, filtrar por ela usando timezone correto
  if (targetDate) {
    const { startUTC, endUTC } = getDayBoundsInUTC(targetDate, timezone);
    query = query.gte('start_time', startUTC).lte('start_time', endUTC);
    console.log(`Filtering by date range (UTC): ${startUTC} to ${endUTC}`);
  } else {
    // Comportamento original: próximo agendamento futuro
    query = query.gte('start_time', new Date().toISOString());
  }

  // Ordenar pelo start_time mais antigo E criado há mais tempo (para não cancelar agendamentos recém-criados)
  query = query.order('start_time', { ascending: true }).order('created_at', { ascending: true }).limit(1);

  const { data: foundAppointment, error: findError } = await query;

  if (findError || !foundAppointment || foundAppointment.length === 0) {
    const dateMsg = targetDate ? ` na data ${targetDate}` : ' futuro';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Nenhum agendamento${dateMsg} encontrado para este telefone` 
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const appointmentToCancel = foundAppointment[0];
  
  // Proteção contra cancelar agendamentos recém-criados (menos de 5 segundos)
  const createdAt = new Date(appointmentToCancel.created_at);
  const now = new Date();
  const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000;
  
  if (secondsSinceCreation < 5) {
    console.log(`Skipping recently created appointment (${secondsSinceCreation}s ago):`, appointmentToCancel.id);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Agendamento muito recente, aguarde alguns segundos e tente novamente' 
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Found appointment to cancel:', appointmentToCancel);

  // Cancelar o agendamento encontrado
  const { data: cancelled, error: cancelError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentToCancel.id)
    .select();

  if (cancelError) {
    console.error('Error cancelling appointment:', cancelError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao cancelar agendamento' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Record in cancellation history
  await recordCancellationHistory(
    supabase,
    { ...appointmentToCancel, company_id: company_id || appointmentToCancel.company_id },
    appointmentToCancel.barber?.name || 'Desconhecido',
    appointmentToCancel.service?.name || 'Serviço',
    'whatsapp'
  );

  console.log('Appointment cancelled:', cancelled[0]);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Agendamento cancelado com sucesso!',
      cancelled_appointment: cancelled[0]
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para consultar cliente pelo telefone
async function handleCheckClient(supabase: any, body: any, corsHeaders: any) {
  const rawPhone = body.telefone || body.client_phone;
  // Normalizar telefone - remover caracteres especiais
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const { unit_id } = body;

  if (!clientPhone) {
    return new Response(
      JSON.stringify({ success: false, error: 'Telefone é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'unit_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Checking client with phone: ${clientPhone}, unit: ${unit_id}`);

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, phone, birth_date, notes, tags, total_visits, last_visit_at, created_at')
    .eq('unit_id', unit_id)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (clientError) {
    console.error('Error fetching client:', clientError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao consultar cliente' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!client) {
    console.log(`Cliente não encontrado para telefone: ${clientPhone}`);
    return new Response(
      JSON.stringify({
        status: "nao_encontrado",
        cliente: null,
        dependentes: [],
        mensagem: "Cliente não cadastrado. Iniciar cadastro obrigatório.",
        proxima_acao: "cadastrar_cliente"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Client found:', client);

  // Buscar dependentes do cliente
  const { data: dependents, error: dependentsError } = await supabase
    .from('client_dependents')
    .select('id, name, birth_date, relationship')
    .eq('client_id', client.id)
    .order('name', { ascending: true });

  if (dependentsError) {
    console.error('Error fetching dependents:', dependentsError);
  }

  console.log(`Found ${dependents?.length || 0} dependents`);

  // Buscar último agendamento completado do cliente
  const { data: lastAppointment, error: lastAppError } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      service_id,
      barber_id,
      services:service_id (name),
      barbers:barber_id (name)
    `)
    .eq('unit_id', unit_id)
    .eq('client_phone', clientPhone)
    .eq('status', 'completed')
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastAppError) {
    console.error('Error fetching last appointment:', lastAppError);
  }

  const ultimoServico = lastAppointment?.services?.name || null;
  const ultimoProfissional = lastAppointment?.barbers?.name || null;

  console.log(`Último serviço: ${ultimoServico}, Último profissional: ${ultimoProfissional}`);

  return new Response(
    JSON.stringify({
      status: "encontrado",
      cliente: client.name,
      ultimo_servico: ultimoServico,
      ultimo_profissional: ultimoProfissional,
      cliente_completo: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        birth_date: client.birth_date,
        notes: client.notes,
        tags: client.tags,
        total_visits: client.total_visits,
        last_visit_at: client.last_visit_at,
        created_at: client.created_at
      },
      dependentes: dependents || [],
      proxima_acao: "oferecer_agendamento"
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para cadastrar novo cliente (sem criar agendamento)
async function handleRegisterClient(supabase: any, body: any, corsHeaders: any) {
  // Normalizar campos
  const clientName = body.nome || body.client_name;
  const rawPhone = body.telefone || body.client_phone;
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const clientBirthDate = body.data_nascimento || body.birth_date || null;
  const clientNotes = body.observacoes || body.notes || null;
  const clientTags = body.tags || ['Novo'];
  const { unit_id, company_id } = body;

  // Validações
  if (!clientName) {
    return new Response(
      JSON.stringify({ success: false, error: 'Nome é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'unit_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Registering client: ${clientName}, phone: ${clientPhone}, unit: ${unit_id}`);

  // Verificar se cliente já existe (se tiver telefone)
  if (clientPhone) {
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id, name, phone')
      .eq('unit_id', unit_id)
      .eq('phone', clientPhone)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing client:', checkError);
    }

    if (existingClient) {
      console.log('Client already exists:', existingClient);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cliente já cadastrado com este telefone',
          existing_client: {
            id: existingClient.id,
            name: existingClient.name,
            phone: existingClient.phone
          }
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Criar o cliente
  const { data: newClient, error: createError } = await supabase
    .from('clients')
    .insert({
      unit_id,
      company_id: company_id || null,
      name: clientName,
      phone: clientPhone,
      birth_date: clientBirthDate,
      notes: clientNotes,
      tags: clientTags,
      total_visits: 0
    })
    .select('id, name, phone, birth_date, notes, tags, total_visits, created_at')
    .single();

  if (createError) {
    console.error('Error creating client:', createError);
    return new Response(
      JSON.stringify({ success: false, error: GENERIC_ERRORS.database }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Client registered:', newClient);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Cliente cadastrado com sucesso!',
      client: {
        id: newClient.id,
        name: newClient.name,
        phone: newClient.phone,
        birth_date: newClient.birth_date,
        notes: newClient.notes,
        tags: newClient.tags,
        total_visits: newClient.total_visits,
        created_at: newClient.created_at
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para atualizar dados de cliente existente
async function handleUpdateClient(supabase: any, body: any, corsHeaders: any) {
  // Parâmetros aceitos (português e inglês)
  const rawPhone = body.telefone || body.client_phone;
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const { unit_id } = body;

  // Campos opcionais para atualização
  const newName = body.nome || body.name || null;
  const newBirthDate = body.data_nascimento || body.birth_date || null;
  const newNotes = body.observacoes || body.observations || body.notes;
  
  // Novo telefone (opcional) - permite alterar o próprio telefone do cliente
  const rawNewPhone = body.novo_telefone || body.new_phone;
  const newPhone = rawNewPhone?.replace(/\D/g, '') || null;

  // Validações obrigatórias
  if (!clientPhone) {
    return new Response(
      JSON.stringify({ success: false, error: 'Telefone é obrigatório para localizar o cliente' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'unit_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verificar se pelo menos um campo foi enviado para atualização
  // Nota: newNotes pode ser string vazia (para limpar), então verificamos undefined
  const hasNameToUpdate = newName !== null;
  const hasBirthDateToUpdate = newBirthDate !== null;
  const hasNotesToUpdate = newNotes !== undefined;
  const hasPhoneToUpdate = newPhone !== null;

  if (!hasNameToUpdate && !hasBirthDateToUpdate && !hasNotesToUpdate && !hasPhoneToUpdate) {
    return new Response(
      JSON.stringify({ success: false, error: 'Envie pelo menos um campo para atualizar (name, birth_date, observations, new_phone)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Updating client with phone: ${clientPhone}, unit: ${unit_id}`);
  console.log(`Fields to update - name: ${newName}, birth_date: ${newBirthDate}, notes: ${newNotes}, new_phone: ${newPhone}`);

  // Buscar cliente pelo telefone
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, phone, birth_date, notes')
    .eq('unit_id', unit_id)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (clientError) {
    console.error('Error fetching client:', clientError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar cliente' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!client) {
    return new Response(
      JSON.stringify({ success: false, error: 'Cliente não encontrado' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Client found:', client);

  // Montar objeto de atualização APENAS com campos preenchidos
  const updateData: Record<string, any> = {};
  const updatedFields: string[] = [];

  if (hasNameToUpdate) {
    updateData.name = newName;
    updatedFields.push('name');
  }
  if (hasBirthDateToUpdate) {
    updateData.birth_date = newBirthDate;
    updatedFields.push('birth_date');
  }
  if (hasNotesToUpdate) {
    updateData.notes = newNotes || null; // Permite limpar as observações
    updatedFields.push('notes');
  }
  if (hasPhoneToUpdate) {
    updateData.phone = newPhone;
    updatedFields.push('phone');
  }
  updateData.updated_at = new Date().toISOString();

  console.log('Update data:', updateData);

  // Executar atualização
  const { data: updatedClient, error: updateError } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', client.id)
    .select('id, name, phone, birth_date, notes, updated_at')
    .single();

  if (updateError) {
    console.error('Error updating client:', updateError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao atualizar dados do cliente' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Client updated:', updatedClient);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Dados atualizados com sucesso',
      updated_fields: updatedFields,
      client: {
        id: updatedClient.id,
        name: updatedClient.name,
        phone: updatedClient.phone,
        birth_date: updatedClient.birth_date,
        notes: updatedClient.notes
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para verificar slot específico (profissional + horário)
async function handleCheckSlot(supabase: any, body: any, corsHeaders: any) {
  const { date, time, professional, unit_id, unit_timezone } = body;
  const timezone = unit_timezone || 'America/Sao_Paulo';

  console.log('=== CHECK_SLOT REQUEST ===');
  console.log(`Date: ${date}, Time: ${time}, Professional: ${professional}, Unit: ${unit_id}`);

  // Validações
  if (!date) {
    return new Response(
      JSON.stringify({ success: false, available: false, error: 'Campo obrigatório: date' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!time) {
    return new Response(
      JSON.stringify({ success: false, available: false, error: 'Campo obrigatório: time' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!professional) {
    return new Response(
      JSON.stringify({ success: false, available: false, error: 'Campo obrigatório: professional' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, available: false, error: 'Campo obrigatório: unit_id ou instance_name' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Construir datetime completo
  const dateOnly = date.split('T')[0];
  const timeOnly = time.includes(':') ? time : `${time}:00`;
  const localDateTime = `${dateOnly}T${timeOnly}:00`;

  console.log(`Checking specific slot: ${localDateTime} with ${professional}`);

  // Buscar barbeiro específico pelo nome (case-insensitive)
  const { data: barbers, error: barberError } = await supabase
    .from('barbers')
    .select('id, name')
    .eq('unit_id', unit_id)
    .eq('is_active', true)
    .ilike('name', `%${professional}%`);

  if (barberError) {
    console.error('Error fetching barber:', barberError);
    return new Response(
      JSON.stringify({ success: false, available: false, error: 'Erro ao buscar profissional' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!barbers || barbers.length === 0) {
    console.log(`Profissional "${professional}" não encontrado na unidade ${unit_id}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        available: false, 
        professional: professional,
        datetime: localDateTime,
        reason: `Profissional "${professional}" não encontrado ou inativo`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const barber = barbers[0];
  console.log(`Barbeiro encontrado: ${barber.name} (ID: ${barber.id})`);

  // Converter horário local para UTC
  const slotStart = convertLocalToUTC(localDateTime, timezone);
  const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000); // 30 min padrão

  console.log(`Verificando conflitos: ${slotStart.toISOString()} - ${slotEnd.toISOString()}`);

  // Verificar conflitos APENAS para este barbeiro específico
  const { data: conflicts, error: conflictError } = await supabase
    .from('appointments')
    .select('id, client_name, start_time, end_time')
    .eq('unit_id', unit_id)
    .eq('barber_id', barber.id)
    .neq('status', 'cancelled')
    .lt('start_time', slotEnd.toISOString())
    .gt('end_time', slotStart.toISOString());

  if (conflictError) {
    console.error('Error checking conflicts:', conflictError);
    return new Response(
      JSON.stringify({ success: false, available: false, error: 'Erro ao verificar conflitos' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (conflicts && conflicts.length > 0) {
    console.log(`SLOT OCUPADO: ${barber.name} já tem ${conflicts.length} agendamento(s) neste horário`);
    console.log('Conflitos encontrados:', JSON.stringify(conflicts, null, 2));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        available: false, 
        professional: barber.name,
        datetime: localDateTime,
        reason: `${barber.name} já tem agendamento neste horário`,
        conflicts: conflicts.map((c: any) => ({
          client: c.client_name,
          start: c.start_time,
          end: c.end_time
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`SLOT DISPONÍVEL: ${barber.name} está livre às ${timeOnly}`);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      available: true, 
      professional: barber.name,
      professional_id: barber.id,
      datetime: localDateTime,
      reason: null
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para confirmar/cancelar agendamento via resposta do cliente
async function handleConfirmAppointment(supabase: any, body: any, corsHeaders: any) {
  const { phone, response, instance_name } = body;

  if (!phone || !response) {
    return new Response(
      JSON.stringify({ success: false, error: 'phone e response são obrigatórios' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`=== CONFIRM_APPOINTMENT: phone=${phone}, response="${response}", instance=${instance_name} ===`);

  // Normalizar telefone (remover formatação e código do país se presente)
  let normalizedPhone = phone.replace(/\D/g, "");
  // Remover código do país (55) se presente
  if (normalizedPhone.startsWith("55") && normalizedPhone.length > 11) {
    normalizedPhone = normalizedPhone.substring(2);
  }
  // Também testar com o código do país
  const phoneVariants = [normalizedPhone];
  if (!normalizedPhone.startsWith("55")) {
    phoneVariants.push("55" + normalizedPhone);
  }

  console.log(`Buscando agendamento para telefones: ${phoneVariants.join(", ")}`);

  // Buscar agendamento pendente mais próximo deste telefone
  const now = new Date().toISOString();
  
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("*")
    .or(phoneVariants.map(p => `client_phone.eq.${p}`).join(","))
    .eq("status", "pending")
    .gte("start_time", now)
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (appointmentError) {
    console.error("Erro ao buscar agendamento:", appointmentError);
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao buscar agendamento" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!appointment) {
    console.log("Nenhum agendamento pendente encontrado para este telefone");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Nenhum agendamento pendente encontrado para este número" 
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Agendamento encontrado: ${appointment.id} - ${appointment.client_name} às ${appointment.start_time}`);

  // Normalizar resposta do cliente
  const normalizedResponse = response.toLowerCase().trim();
  
  // Verificar se é confirmação
  const isConfirm = normalizedResponse.includes("sim") || 
                    normalizedResponse === "1" || 
                    normalizedResponse === "s" ||
                    normalizedResponse === "confirmo" ||
                    normalizedResponse === "confirmado";
  
  // Verificar se é cancelamento
  const isCancel = normalizedResponse.includes("nao") || 
                   normalizedResponse.includes("não") || 
                   normalizedResponse === "2" || 
                   normalizedResponse === "n" ||
                   normalizedResponse === "cancela" ||
                   normalizedResponse === "cancelar";

  if (isConfirm) {
    console.log(`✅ Confirmando agendamento ${appointment.id}`);
    
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", appointment.id);

    if (updateError) {
      console.error("Erro ao confirmar agendamento:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao confirmar agendamento" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: "confirmed",
        appointment_id: appointment.id,
        client_name: appointment.client_name,
        start_time: appointment.start_time,
        message: `Agendamento de ${appointment.client_name} confirmado com sucesso`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } else if (isCancel) {
    console.log(`❌ Cancelando agendamento ${appointment.id}`);
    
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id);

    if (updateError) {
      console.error("Erro ao cancelar agendamento:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao cancelar agendamento" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: "cancelled",
        appointment_id: appointment.id,
        client_name: appointment.client_name,
        start_time: appointment.start_time,
        message: `Agendamento de ${appointment.client_name} cancelado`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Resposta não reconhecida
  console.log(`⚠️ Resposta não reconhecida: "${response}"`);
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: "Resposta não reconhecida. Responda SIM para confirmar ou NÃO para cancelar.",
      received_response: response
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para adicionar dependente a um cliente
async function handleAddDependent(supabase: any, body: any, corsHeaders: any) {
  const rawPhone = body.phone || body.telefone || body.client_phone;
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const dependentName = body.dependent_name || body.nome_dependente;
  const dependentRelationship = body.relationship || body.parentesco || null;
  const dependentBirthDate = body.dependent_birth_date || body.data_nascimento || null;
  const { unit_id, company_id } = body;

  // Validações
  if (!clientPhone) {
    return new Response(
      JSON.stringify({ success: false, error: 'Telefone do responsável é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!dependentName) {
    return new Response(
      JSON.stringify({ success: false, error: 'Nome do dependente é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'unit_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Adding dependent "${dependentName}" to client with phone: ${clientPhone}`);

  // Buscar cliente pelo telefone
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, unit_id, company_id')
    .eq('unit_id', unit_id)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (clientError) {
    console.error('Error fetching client:', clientError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar cliente' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!client) {
    return new Response(
      JSON.stringify({ success: false, error: 'Cliente não encontrado. Cadastre o cliente primeiro.' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Found client: ${client.name} (${client.id})`);

  // Verificar se dependente já existe (mesmo nome)
  const { data: existingDependent, error: checkError } = await supabase
    .from('client_dependents')
    .select('id, name')
    .eq('client_id', client.id)
    .ilike('name', dependentName)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking existing dependent:', checkError);
  }

  if (existingDependent) {
    console.log(`Dependent already exists: ${existingDependent.name}`);
    return new Response(
      JSON.stringify({
        success: true,
        already_exists: true,
        dependent: {
          id: existingDependent.id,
          name: existingDependent.name,
          client_id: client.id,
          client_name: client.name
        },
        message: `Dependente "${existingDependent.name}" já está cadastrado`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Criar o dependente
  const { data: newDependent, error: createError } = await supabase
    .from('client_dependents')
    .insert({
      client_id: client.id,
      unit_id: client.unit_id,
      company_id: client.company_id || company_id,
      name: dependentName,
      birth_date: dependentBirthDate,
      relationship: dependentRelationship,
    })
    .select('id, name, birth_date, relationship')
    .single();

  if (createError) {
    console.error('Error creating dependent:', createError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao cadastrar dependente' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Dependent created: ${newDependent.name} (${newDependent.id})`);

  return new Response(
    JSON.stringify({
      success: true,
      already_exists: false,
      dependent: {
        id: newDependent.id,
        name: newDependent.name,
        birth_date: newDependent.birth_date,
        relationship: newDependent.relationship,
        client_id: client.id,
        client_name: client.name
      },
      message: `Dependente "${newDependent.name}" cadastrado com sucesso`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
