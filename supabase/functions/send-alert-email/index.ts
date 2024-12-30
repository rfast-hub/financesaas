import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string[];
  cryptocurrency: string;
  condition: string;
  targetPrice: number;
  currentPrice: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, cryptocurrency, condition, targetPrice, currentPrice }: EmailRequest = await req.json();

    const subject = `Crypto Alert: ${cryptocurrency} ${condition} ${targetPrice}`;
    const html = `
      <h2>Your Crypto Price Alert has been triggered!</h2>
      <p>Your alert for ${cryptocurrency} has been triggered:</p>
      <ul>
        <li>Condition: Price goes ${condition} $${targetPrice}</li>
        <li>Current Price: $${currentPrice}</li>
      </ul>
      <p>This alert has now been deactivated. You can create a new alert anytime from your dashboard.</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Crypto Alerts <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-alert-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);