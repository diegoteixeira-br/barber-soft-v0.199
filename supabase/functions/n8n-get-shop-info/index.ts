import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    const expectedApiKey = Deno.env.get("BARBERSOFT_API_KEY");

    if (!apiKey || apiKey !== expectedApiKey) {
      console.error("Invalid or missing API key");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only accept POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { whatsapp_instance_id } = body;

    if (!whatsapp_instance_id) {
      console.error("Missing whatsapp_instance_id in request");
      return new Response(
        JSON.stringify({ success: false, error: "Missing whatsapp_instance_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation for whatsapp_instance_id
    const instanceId = String(whatsapp_instance_id).trim();
    
    // Length validation (max 100 characters)
    if (instanceId.length > 100) {
      console.error("whatsapp_instance_id too long");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid whatsapp_instance_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format validation: only alphanumeric, underscores, and hyphens allowed
    const validInstanceIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validInstanceIdPattern.test(instanceId)) {
      console.error("whatsapp_instance_id contains invalid characters");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid whatsapp_instance_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Looking up shop info for instance: ${instanceId}`);

    // Initialize Supabase client with service role key for RLS bypass
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find unit by evolution_instance_name (using validated instanceId)
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("id, name, address, phone, manager_name")
      .eq("evolution_instance_name", instanceId)
      .maybeSingle();

    if (unitError) {
      console.error("Error fetching unit:", unitError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error fetching unit" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!unit) {
      console.log(`No unit found for instance: ${instanceId}`);
      return new Response(
        JSON.stringify({ success: false, error: "Unit not found for this WhatsApp instance" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found unit: ${unit.name} (${unit.id})`);

    // Fetch active barbers for this unit
    const { data: barbers, error: barbersError } = await supabase
      .from("barbers")
      .select("id, name, commission_rate, phone, photo_url")
      .eq("unit_id", unit.id)
      .eq("is_active", true);

    if (barbersError) {
      console.error("Error fetching barbers:", barbersError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error fetching barbers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch active services for this unit
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, name, price, duration_minutes")
      .eq("unit_id", unit.id)
      .eq("is_active", true);

    if (servicesError) {
      console.error("Error fetching services:", servicesError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error fetching services" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${barbers?.length || 0} barbers and ${services?.length || 0} services`);

    // Return consolidated response
    const response = {
      success: true,
      unit: {
        id: unit.id,
        name: unit.name,
        address: unit.address,
        phone: unit.phone,
        manager_name: unit.manager_name,
      },
      barbers: barbers || [],
      services: services || [],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
