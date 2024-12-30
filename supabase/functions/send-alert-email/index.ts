import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailRequest {
  to: string[]
  cryptocurrency: string
  condition: string
  targetPrice: number
  currentPrice: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set")
      throw new Error("RESEND_API_KEY is not configured")
    }

    const emailRequest: EmailRequest = await req.json()
    console.log("Received email request:", emailRequest)

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Crypto Alerts <onboarding@resend.dev>",
        to: emailRequest.to,
        subject: `Price Alert: ${emailRequest.cryptocurrency} ${emailRequest.condition} $${emailRequest.targetPrice}`,
        html: `
          <h2>Your Crypto Price Alert has been triggered!</h2>
          <p>Your alert for ${emailRequest.cryptocurrency} has been triggered:</p>
          <ul>
            <li>Condition: Price goes ${emailRequest.condition} $${emailRequest.targetPrice}</li>
            <li>Current Price: $${emailRequest.currentPrice}</li>
          </ul>
          <p>This alert has now been deactivated. You can create a new alert anytime from your dashboard.</p>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error("Error from Resend API:", error)
      throw new Error(`Failed to send email: ${error}`)
    }

    const data = await res.json()
    console.log("Email sent successfully:", data)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error in send-alert-email function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})