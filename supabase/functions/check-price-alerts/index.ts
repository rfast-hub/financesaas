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

    // Fetch active price alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select('*')
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
    alerts?.forEach((alert: PriceAlert) => {
      const currentPrice = prices[alert.cryptocurrency.toLowerCase()]?.usd
      if (!currentPrice) return

      const isTriggered = 
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price)

      if (isTriggered) {
        triggeredAlerts.push(alert)
      }
    })

    // Update triggered alerts
    if (triggeredAlerts.length > 0) {
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({ triggered_at: new Date().toISOString(), is_active: false })
        .in('id', triggeredAlerts.map(alert => alert.id))

      if (updateError) throw updateError

      // Here you would typically send notifications (email, push, etc.)
      // For now, we'll just log the triggered alerts
      console.log('Triggered alerts:', triggeredAlerts)
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