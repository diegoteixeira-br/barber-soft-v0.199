import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the requesting user is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is super admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Super admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company ID from request body
    const { companyId } = await req.json();
    
    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "Company ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the company to find owner_user_id
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("owner_user_id, plan_status")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow deletion of cancelled accounts
    if (company.plan_status !== "cancelled") {
      return new Response(
        JSON.stringify({ error: "Only cancelled accounts can be deleted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ownerUserId = company.owner_user_id;

    console.log(`Deleting company ${companyId} and user ${ownerUserId}`);

    // Delete related data in order (respecting foreign keys)
    // 1. Get all units for this company
    const { data: units } = await supabaseAdmin
      .from("units")
      .select("id")
      .eq("company_id", companyId);

    const unitIds = units?.map(u => u.id) || [];

    if (unitIds.length > 0) {
      // Delete appointments
      await supabaseAdmin.from("appointments").delete().in("unit_id", unitIds);
      
      // Delete appointment_deletions
      await supabaseAdmin.from("appointment_deletions").delete().in("unit_id", unitIds);
      
      // Delete cancellation_history
      await supabaseAdmin.from("cancellation_history").delete().in("unit_id", unitIds);
      
      // Delete client_dependents
      await supabaseAdmin.from("client_dependents").delete().in("unit_id", unitIds);
      
      // Delete clients
      await supabaseAdmin.from("clients").delete().in("unit_id", unitIds);
      
      // Delete product_sales
      await supabaseAdmin.from("product_sales").delete().in("unit_id", unitIds);
      
      // Delete products
      await supabaseAdmin.from("products").delete().in("unit_id", unitIds);
      
      // Delete expenses
      await supabaseAdmin.from("expenses").delete().in("unit_id", unitIds);
      
      // Delete services
      await supabaseAdmin.from("services").delete().in("unit_id", unitIds);
      
      // Delete barbers
      await supabaseAdmin.from("barbers").delete().in("unit_id", unitIds);
      
      // Delete units
      await supabaseAdmin.from("units").delete().in("id", unitIds);
    }

    // Delete company-level data
    // Delete automation_logs
    await supabaseAdmin.from("automation_logs").delete().eq("company_id", companyId);
    
    // Delete marketing campaigns and logs
    const { data: campaigns } = await supabaseAdmin
      .from("marketing_campaigns")
      .select("id")
      .eq("company_id", companyId);
    
    if (campaigns && campaigns.length > 0) {
      const campaignIds = campaigns.map(c => c.id);
      await supabaseAdmin.from("campaign_message_logs").delete().in("campaign_id", campaignIds);
      await supabaseAdmin.from("marketing_campaigns").delete().in("id", campaignIds);
    }
    
    // Delete partnership_terms and term_acceptances
    const { data: terms } = await supabaseAdmin
      .from("partnership_terms")
      .select("id")
      .eq("company_id", companyId);
    
    if (terms && terms.length > 0) {
      const termIds = terms.map(t => t.id);
      await supabaseAdmin.from("term_acceptances").delete().in("term_id", termIds);
      await supabaseAdmin.from("partnership_terms").delete().in("id", termIds);
    }
    
    // Delete feedbacks
    await supabaseAdmin.from("feedbacks").delete().eq("company_id", companyId);

    // Delete user-level data
    // Delete business_settings
    await supabaseAdmin.from("business_settings").delete().eq("user_id", ownerUserId);
    
    // Delete business_hours
    await supabaseAdmin.from("business_hours").delete().eq("user_id", ownerUserId);
    
    // Delete holidays
    await supabaseAdmin.from("holidays").delete().eq("user_id", ownerUserId);
    
    // Delete message_templates
    await supabaseAdmin.from("message_templates").delete().eq("user_id", ownerUserId);
    
    // Delete user_roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", ownerUserId);

    // Delete the company
    const { error: deleteCompanyError } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (deleteCompanyError) {
      console.error("Error deleting company:", deleteCompanyError);
      throw deleteCompanyError;
    }

    // Finally, delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(ownerUserId);
    
    if (deleteUserError) {
      console.error("Error deleting user:", deleteUserError);
      // Company already deleted, log but don't fail
    }

    console.log(`Successfully deleted company ${companyId} and user ${ownerUserId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Company and user deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
