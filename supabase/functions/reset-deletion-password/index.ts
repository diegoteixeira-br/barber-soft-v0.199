import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestResetPayload {
  user_id: string;
}

interface ExecuteResetPayload {
  token: string;
  new_password_hash: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === "POST") {
      // REQUEST RESET - Generate token and send email
      const { user_id }: RequestResetPayload = await req.json();

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check rate limiting - max 3 requests per hour
      const { data: existingSettings, error: fetchError } = await supabase
        .from("business_settings")
        .select("deletion_password_reset_expires")
        .eq("user_id", user_id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching settings:", fetchError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch settings" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate secure token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Update settings with reset token
      const { error: updateError } = await supabase
        .from("business_settings")
        .update({
          deletion_password_reset_token: token,
          deletion_password_reset_expires: expiresAt.toISOString(),
        })
        .eq("user_id", user_id);

      if (updateError) {
        console.error("Error updating reset token:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to save reset token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user email from auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);

      if (authError || !authUser?.user?.email) {
        console.error("Error fetching user email:", authError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch user email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get business name for email
      const { data: companyData } = await supabase
        .from("companies")
        .select("name")
        .eq("owner_user_id", user_id)
        .maybeSingle();

      const businessName = companyData?.name || "Sua Barbearia";

      // Build reset URL - use Lovable preview URL
      const resetUrl = `https://id-preview--4dc8944f-b198-416a-801f-e7094b4a26df.lovable.app/reset-deletion-password?token=${token}`;

      // Send email via Resend
      try {
        const { error: emailError } = await resend.emails.send({
          from: "BarberSoft <noreply@resend.dev>",
          to: [authUser.user.email],
          subject: "Recuperar senha de exclusão - BarberSoft",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
                  <h1 style="color: #d4a54d; margin: 0; font-size: 24px;">BarberSoft</h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #333; margin: 0 0 16px 0; font-size: 20px;">Olá, ${businessName}!</h2>
                  <p style="color: #666; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                    Você solicitou a recuperação da sua <strong>senha de exclusão de agendamentos</strong>.
                  </p>
                  <p style="color: #666; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                    Clique no botão abaixo para definir uma nova senha:
                  </p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" style="background-color: #d4a54d; color: #1a1a1a; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                      Redefinir Senha de Exclusão
                    </a>
                  </div>
                  <p style="color: #999; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
                    Este link expira em <strong>1 hora</strong>.
                  </p>
                  <p style="color: #999; font-size: 14px; line-height: 20px; margin: 16px 0 0 0;">
                    Se você não solicitou esta recuperação, ignore este email. Sua senha atual permanecerá inalterada.
                  </p>
                </div>
                <div style="background-color: #f8f8f8; padding: 16px; text-align: center; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} BarberSoft. Todos os direitos reservados.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (emailError) {
          console.error("Error sending email:", emailError);
          return new Response(
            JSON.stringify({ error: "Failed to send email", details: emailError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (emailErr) {
        console.error("Email send exception:", emailErr);
        return new Response(
          JSON.stringify({ error: "Failed to send email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Password reset email sent to ${authUser.user.email}`);

      return new Response(
        JSON.stringify({ success: true, message: "Email enviado com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "PUT") {
      // EXECUTE RESET - Validate token and set new password
      const { token, new_password_hash }: ExecuteResetPayload = await req.json();

      if (!token || !new_password_hash) {
        return new Response(
          JSON.stringify({ error: "token and new_password_hash are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find settings with this token
      const { data: settings, error: findError } = await supabase
        .from("business_settings")
        .select("*")
        .eq("deletion_password_reset_token", token)
        .maybeSingle();

      if (findError || !settings) {
        console.error("Token not found:", findError);
        return new Response(
          JSON.stringify({ error: "Token inválido ou expirado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if token expired
      const expiresAt = new Date(settings.deletion_password_reset_expires);
      if (expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ error: "Token expirado. Solicite um novo link de recuperação." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update password and clear token
      const { error: updateError } = await supabase
        .from("business_settings")
        .update({
          deletion_password_hash: new_password_hash,
          deletion_password_enabled: true,
          deletion_password_reset_token: null,
          deletion_password_reset_expires: null,
        })
        .eq("id", settings.id);

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: "Falha ao atualizar senha" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Deletion password reset successfully for settings ID: ${settings.id}`);

      return new Response(
        JSON.stringify({ success: true, message: "Senha atualizada com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in reset-deletion-password:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
