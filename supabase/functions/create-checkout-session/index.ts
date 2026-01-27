import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs for each plan
const PRICES = {
  inicial: {
    monthly: "price_1SuD9cPFVcRfSdEa1OzhUHXb",
    annual: "price_1SuDAAPFVcRfSdEalIMHeTTG"
  },
  profissional: {
    monthly: "price_1SuDBHPFVcRfSdEav7E0VdLu",
    annual: "price_1SuDBrPFVcRfSdEaVEj4XviB"
  },
  franquias: {
    monthly: "price_1SuDCKPFVcRfSdEaAVkfM9dA",
    annual: "price_1SuDDBPFVcRfSdEazhidc1RM"
  }
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { plan, billing } = await req.json();
    logStep("Request params", { plan, billing });

    if (!plan || !billing) {
      throw new Error("Missing plan or billing parameter");
    }

    if (!PRICES[plan as keyof typeof PRICES]) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    if (billing !== 'monthly' && billing !== 'annual') {
      throw new Error(`Invalid billing: ${billing}`);
    }

    const priceId = PRICES[plan as keyof typeof PRICES][billing as 'monthly' | 'annual'];
    logStep("Selected price", { priceId });

    // Get company info
    const { data: company, error: companyError } = await supabaseClient
      .from("companies")
      .select("id, name, stripe_customer_id")
      .eq("owner_user_id", user.id)
      .single();

    if (companyError) throw new Error(`Company error: ${companyError.message}`);
    logStep("Company found", { companyId: company.id, name: company.name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists in Stripe
    let customerId = company.stripe_customer_id;
    
    if (!customerId) {
      // Check by email
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      } else {
        // Create new customer
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: company.name,
          metadata: {
            company_id: company.id,
            user_id: user.id
          }
        });
        customerId = newCustomer.id;
        logStep("Created new Stripe customer", { customerId });
      }

      // Update company with stripe_customer_id
      await supabaseClient
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company.id);
      logStep("Updated company with customer ID");
    }

    const origin = req.headers.get("origin") || "https://barbersoft.lovable.app";

    // Create checkout session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/escolher-plano?checkout=cancelled`,
      metadata: {
        company_id: company.id,
        plan: plan,
        billing: billing
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          company_id: company.id,
          plan: plan,
          billing: billing
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
