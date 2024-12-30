import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PriceAlert {
  id: string
  user_id: string
  cryptocurrency: string
  target_price: number
  condition: 'above' | 'below'
  is_active: boolean
  email_notification: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch active price alerts and user emails
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select(`
        *,
        users:user_id (
          email
        )
      `)
      .eq('is_active', true)
      .is('triggered_at', null)

    if (alertsError) throw alertsError

    // Fetch current prices from CoinGecko
    const symbols = [...new Set(alerts?.map((alert: PriceAlert) => alert.cryptocurrency.toLowerCase()))]
    if (symbols.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active alerts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pricesResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(',')}&vs_currencies=usd`
    )
    const prices = await pricesResponse.json()

    // Check alerts against current prices
    const triggeredAlerts: PriceAlert[] = []
    for (const alert of alerts || []) {
      const currentPrice = prices[alert.cryptocurrency.toLowerCase()]?.usd
      if (!currentPrice) continue

      const isTriggered = 
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price)

      if (isTriggered) {
        triggeredAlerts.push(alert)
        
        // Send email notification
        if (alert.email_notification && alert.users?.email) {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-alert-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify({
                to: [alert.users.email],
                cryptocurrency: alert.cryptocurrency,
                condition: alert.condition,
                targetPrice: alert.target_price,
                currentPrice,
              }),
            });
          } catch (error) {
            console.error('Error sending email notification:', error);
          }
        }
      }
    }

    // Update triggered alerts
    if (triggeredAlerts.length > 0) {
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({ triggered_at: new Date().toISOString(), is_active: false })
        .in('id', triggeredAlerts.map(alert => alert.id))

      if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${alerts?.length} alerts, ${triggeredAlerts.length} triggered`,
        triggeredAlerts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})