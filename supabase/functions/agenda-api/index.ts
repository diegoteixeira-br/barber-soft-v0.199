import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Converte uma data local (sem timezone) para UTC baseado no timezone da unidade
function convertLocalToUTC(dateTimeStr: string, timezone: string): Date {
  // Se já tem timezone info (Z ou +/-), usar direto
  if (dateTimeStr.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateTimeStr)) {
    return new Date(dateTimeStr);
  }
  
  // Caso contrário, interpretar como horário local da unidade
  const offset = getTimezoneOffset(timezone);
  const localDateTime = `${dateTimeStr}${offset}`;
  console.log(`Converting local time: ${dateTimeStr} with offset ${offset} -> ${localDateTime}`);
  return new Date(localDateTime);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API Key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('BARBERSOFT_API_KEY');
    
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, instance_name } = body;

    console.log('Agenda API called with action:', action);
    console.log('Request body:', JSON.stringify(body));

    // Se instance_name for fornecido, buscar a unidade diretamente por ele
    let resolvedUnitId = body.unit_id;
    let companyId = null;
    
    if (instance_name && !resolvedUnitId) {
      console.log(`Looking up unit by instance_name: ${instance_name}`);
      
      // Busca direto na tabela units pelo evolution_instance_name
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id, company_id')
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
      
      resolvedUnitId = unit.id;
      companyId = unit.company_id;
      console.log(`Resolved unit_id: ${resolvedUnitId}, company_id: ${companyId}`);
    }

    // Passar o unit_id resolvido para os handlers
    const enrichedBody = { ...body, unit_id: resolvedUnitId, company_id: companyId };

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
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida. Actions válidas: check, check_availability, create, schedule_appointment, cancel, cancel_appointment, check_client, register_client' }),
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

// Handler para consultar disponibilidade
async function handleCheck(supabase: any, body: any, corsHeaders: any) {
  const { date, professional, unit_id } = body;

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

  console.log(`Checking availability for date: ${date}, professional: ${professional || 'any'}, unit: ${unit_id}`);

  // Buscar barbeiros ativos da unidade
  let barbersQuery = supabase
    .from('barbers')
    .select('id, name, calendar_color')
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

  // Buscar agendamentos do dia (exceto cancelados)
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id, barber_id, start_time, end_time, status')
    .eq('unit_id', unit_id)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .neq('status', 'cancelled');

  if (appointmentsError) {
    console.error('Error fetching appointments:', appointmentsError);
  }

  console.log(`Found ${appointments?.length || 0} existing appointments`);

  // Gerar slots disponíveis (08:00 às 21:00, intervalos de 30 min)
  const availableSlots: any[] = [];
  const openingHour = 8;
  const closingHour = 21;

  for (let hour = openingHour; hour < closingHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const slotStart = new Date(`${date}T${timeStr}:00`);

      for (const barber of barbers) {
        // Verificar se o barbeiro está ocupado neste horário
        const isOccupied = appointments?.some((apt: any) => {
          if (apt.barber_id !== barber.id) return false;
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          return slotStart >= aptStart && slotStart < aptEnd;
        });

        if (!isOccupied) {
          availableSlots.push({
            time: timeStr,
            datetime: slotStart.toISOString(),
            barber_id: barber.id,
            barber_name: barber.name
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
  const { unit_id, company_id } = body;

  // NOVOS CAMPOS para cadastro completo do cliente
  const clientBirthDate = body.data_nascimento || body.birth_date || null;
  const clientNotes = body.observacoes || body.notes || null;
  const clientTags = body.tags || ['Novo'];

  // Validações
  if (!clientName || !barberName || !serviceName || !dateTime || !unit_id) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Campos obrigatórios: nome/client_name, barbeiro_nome/professional, servico/service, data/datetime' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Buscar timezone da unidade
  const { data: unitData, error: unitTimezoneError } = await supabase
    .from('units')
    .select('timezone')
    .eq('id', unit_id)
    .single();

  if (unitTimezoneError) {
    console.error('Error fetching unit timezone:', unitTimezoneError);
  }

  const unitTimezone = unitData?.timezone || 'America/Sao_Paulo';
  console.log(`Unit timezone: ${unitTimezone}`);

  console.log(`Creating appointment: ${clientName} with ${barberName} for ${serviceName} at ${dateTime}`);
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
            error: `Erro ao criar cliente: ${clientCreateError.message}` 
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
  const startTime = convertLocalToUTC(dateTime, unitTimezone);
  const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);
  
  console.log(`Converted start_time: ${dateTime} -> ${startTime.toISOString()} (UTC)`);
  console.log(`Calculated end_time: ${endTime.toISOString()} (UTC)`);

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

  // Criar o agendamento
  const { data: appointment, error: createError } = await supabase
    .from('appointments')
    .insert({
      unit_id,
      company_id: company_id || barber.company_id,
      barber_id: barber.id,
      service_id: selectedService.id,
      client_name: clientName,
      client_phone: clientPhone || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_price: selectedService.price,
      status: 'pending'
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
      appointment: {
        id: appointment.id,
        client_name: appointment.client_name,
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

// Handler para cancelar agendamento
async function handleCancel(supabase: any, body: any, corsHeaders: any) {
  // Normalizar campos
  const appointmentId = body.appointment_id;
  const rawPhone = body.telefone || body.client_phone;
  // Normalizar telefone - remover caracteres especiais para consistência
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const targetDate = body.data || body.datetime;
  const { unit_id } = body;

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

  console.log(`Cancelling appointment: id=${appointmentId}, phone=${clientPhone}, date=${targetDate}, unit=${unit_id}`);

  // Se temos appointment_id, cancelar diretamente
  if (appointmentId) {
    const { data: cancelled, error: cancelError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)
      .eq('unit_id', unit_id)
      .in('status', ['pending', 'confirmed'])
      .select();

    if (cancelError) {
      console.error('Error cancelling appointment:', cancelError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao cancelar agendamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!cancelled || cancelled.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agendamento não encontrado ou já cancelado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

  // Se temos telefone, buscar agendamento
  let query = supabase
    .from('appointments')
    .select('id, client_name, start_time, status')
    .eq('unit_id', unit_id)
    .eq('client_phone', clientPhone)
    .in('status', ['pending', 'confirmed']);

  // Se data específica foi fornecida, filtrar por ela
  if (targetDate) {
    const dateOnly = targetDate.split('T')[0]; // Pegar apenas YYYY-MM-DD
    const startOfDay = `${dateOnly}T00:00:00`;
    const endOfDay = `${dateOnly}T23:59:59`;
    query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    console.log(`Filtering by date range: ${startOfDay} to ${endOfDay}`);
  } else {
    // Comportamento original: próximo agendamento futuro
    query = query.gte('start_time', new Date().toISOString());
  }

  query = query.order('start_time', { ascending: true }).limit(1);

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

  console.log('Found appointment to cancel:', foundAppointment[0]);

  // Cancelar o agendamento encontrado
  const { data: cancelled, error: cancelError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', foundAppointment[0].id)
    .select();

  if (cancelError) {
    console.error('Error cancelling appointment:', cancelError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao cancelar agendamento' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

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
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const { unit_id } = body;

  console.log(`Checking client: phone=${clientPhone}, unit=${unit_id}`);

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

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name, phone, birth_date, notes, tags, total_visits, last_visit_at')
    .eq('unit_id', unit_id)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (error) {
    console.error('Error checking client:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar cliente' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!client) {
    console.log('Cliente não encontrado para o telefone:', clientPhone);
    return new Response(
      JSON.stringify({ 
        success: true, 
        found: false,
        message: 'Cliente não encontrado' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Cliente encontrado:', client);

  return new Response(
    JSON.stringify({
      success: true,
      found: true,
      message: 'Cliente encontrado',
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        birth_date: client.birth_date,
        notes: client.notes,
        tags: client.tags,
        total_visits: client.total_visits,
        last_visit_at: client.last_visit_at
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para cadastrar novo cliente (sem agendamento)
async function handleRegisterClient(supabase: any, body: any, corsHeaders: any) {
  const clientName = body.nome || body.client_name;
  const rawPhone = body.telefone || body.client_phone;
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const clientBirthDate = body.data_nascimento || body.birth_date || null;
  const clientNotes = body.observacoes || body.notes || null;
  const clientTags = body.tags || ['Novo'];
  const { unit_id, company_id } = body;

  console.log(`Registering client: name=${clientName}, phone=${clientPhone}, unit=${unit_id}`);
  console.log(`Client details - birth_date: ${clientBirthDate}, notes: ${clientNotes}, tags: ${JSON.stringify(clientTags)}`);

  if (!clientName || !clientPhone) {
    return new Response(
      JSON.stringify({ success: false, error: 'Nome e telefone são obrigatórios' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'unit_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verificar se cliente já existe
  const { data: existingClient, error: checkError } = await supabase
    .from('clients')
    .select('id, name, phone, birth_date, notes, tags')
    .eq('unit_id', unit_id)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking existing client:', checkError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao verificar cliente' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (existingClient) {
    console.log('Cliente já existe:', existingClient);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Cliente já cadastrado com este telefone',
        existing_client: {
          id: existingClient.id,
          name: existingClient.name,
          phone: existingClient.phone,
          birth_date: existingClient.birth_date,
          notes: existingClient.notes,
          tags: existingClient.tags
        }
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Criar novo cliente
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
    .select('id, name, phone, birth_date, notes, tags, total_visits')
    .single();

  if (createError) {
    console.error('Error creating client:', createError);
    return new Response(
      JSON.stringify({ success: false, error: `Erro ao cadastrar cliente: ${createError.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Novo cliente cadastrado com sucesso:', newClient);

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
        total_visits: newClient.total_visits
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
