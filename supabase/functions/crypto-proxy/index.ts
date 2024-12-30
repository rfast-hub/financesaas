import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { endpoint } = await req.json()
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle Alpha Vantage news endpoint
    if (endpoint === '/news') {
      const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
      console.log('Fetching news from Alpha Vantage')
      
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=NEWS_SENTIMENT&topics=cryptocurrency&apikey=${ALPHA_VANTAGE_API_KEY}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      )

      if (!response.ok) {
        console.error('Alpha Vantage API error:', response.status)
        throw new Error(`Alpha Vantage API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Alpha Vantage raw response:', data)

      // Check if we have the expected feed property
      if (!data || typeof data !== 'object') {
        console.error('Unexpected response format:', data)
        throw new Error('Invalid response format from Alpha Vantage')
      }

      // Extract items from either feed or items property
      const newsItems = data.feed || data.items || []
      
      if (!Array.isArray(newsItems)) {
        console.error('News items is not an array:', newsItems)
        throw new Error('Invalid news items format from Alpha Vantage')
      }

      // Transform and clean up the news items
      const processedNews = newsItems.slice(0, 5).map(item => ({
        title: item.title || '',
        url: item.url || '',
        time_published: item.time_published || new Date().toISOString(),
        authors: Array.isArray(item.authors) ? item.authors : [item.authors || 'Unknown'],
        summary: item.summary || ''
      }))

      return new Response(
        JSON.stringify(processedNews),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          } 
        }
      )
    }

    // Handle CoinGecko endpoints
    console.log(`Proxying request to: ${COINGECKO_BASE_URL}${endpoint}`)
    const response = await fetch(`${COINGECKO_BASE_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'max-age=30'
      }
    })

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    )
  } catch (error) {
    console.error('Error in crypto-proxy:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})