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
    console.log('Starting price alerts check...')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch active price alerts
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

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError)
      throw alertsError
    }

    console.log(`Found ${alerts?.length || 0} active alerts`)

    if (!alerts?.length) {
      return new Response(
        JSON.stringify({ message: 'No active alerts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get unique cryptocurrencies to fetch
    const cryptos = [...new Set(alerts.map(alert => alert.cryptocurrency.toLowerCase()))]
    
    // Fetch current prices from CoinGecko
    const pricesResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptos.join(',')}&vs_currencies=usd`
    )
    
    if (!pricesResponse.ok) {
      console.error('Error fetching prices:', await pricesResponse.text())
      throw new Error('Failed to fetch current prices')
    }

    const prices = await pricesResponse.json()
    console.log('Current prices:', prices)

    // Check alerts against current prices
    const triggeredAlerts: PriceAlert[] = []
    
    for (const alert of alerts) {
      const currentPrice = prices[alert.cryptocurrency.toLowerCase()]?.usd
      
      if (!currentPrice) {
        console.log(`No price found for ${alert.cryptocurrency}`)
        continue
      }

      console.log(`Checking alert for ${alert.cryptocurrency}:`, {
        currentPrice,
        targetPrice: alert.target_price,
        condition: alert.condition
      })

      const isTriggered = 
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price)

      if (isTriggered) {
        console.log(`Alert triggered for ${alert.cryptocurrency}`)
        triggeredAlerts.push(alert)
        
        // Send email notification
        if (alert.email_notification && alert.users?.email) {
          try {
            const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-alert-email`, {
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
            })

            if (!emailResponse.ok) {
              console.error('Error sending email:', await emailResponse.text())
            } else {
              console.log('Email notification sent successfully')
            }
          } catch (error) {
            console.error('Error sending email notification:', error)
          }
        }
      }
    }

    // Update triggered alerts in database
    if (triggeredAlerts.length > 0) {
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({ 
          triggered_at: new Date().toISOString(), 
          is_active: false 
        })
        .in('id', triggeredAlerts.map(alert => alert.id))

      if (updateError) {
        console.error('Error updating triggered alerts:', updateError)
        throw updateError
      }

      console.log(`Updated ${triggeredAlerts.length} triggered alerts`)
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${alerts.length} alerts, ${triggeredAlerts.length} triggered`,
        triggeredAlerts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in check-price-alerts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})