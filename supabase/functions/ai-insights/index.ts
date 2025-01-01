import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request for AI insights');
    
    if (!perplexityApiKey) {
      console.error('Missing PERPLEXITY_API_KEY');
      throw new Error('API key not configured');
    }

    const { analysisType } = await req.json();
    if (!analysisType) {
      throw new Error('Analysis type is required');
    }

    const prompt = getPromptForAnalysisType(analysisType);
    console.log('Calling Perplexity API with analysis type:', analysisType);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency market analysis expert. Provide detailed, data-driven analysis with specific numbers and clear recommendations. Be concise but thorough.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully generated AI insights');
    
    return new Response(
      JSON.stringify({ content: data.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-insights function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getPromptForAnalysisType(type: string) {
  switch (type) {
    case 'prediction':
      return 'Analyze current market conditions and provide a detailed price prediction for Bitcoin over the next 24-48 hours. Include key support and resistance levels.';
    case 'strategy':
      return 'Based on current market conditions, suggest specific trading strategies for Bitcoin. Include entry points, exit targets, and stop-loss levels.';
    case 'risk':
      return 'Provide a comprehensive risk assessment for Bitcoin trading in the current market. Include volatility analysis and potential market risks.';
    case 'trend':
      return 'Analyze current market trends for Bitcoin, including technical indicators, market sentiment, and potential trend reversals.';
    default:
      return 'Analyze the current Bitcoin market conditions and provide insights.';
  }
}