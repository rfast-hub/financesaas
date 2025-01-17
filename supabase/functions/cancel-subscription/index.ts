import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';

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
    console.log('Starting subscription cancellation in edge function...');

    // Initialize Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    console.log('Verifying user authentication...');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error('User not authenticated');
    }

    console.log('User authenticated:', user.id);

    // Get request body
    const { subscription_id } = await req.json();
    console.log('Received cancellation request for subscription:', subscription_id);

    // For paid subscription cancellation
    if (subscription_id) {
      console.log('Processing paid subscription cancellation...');
      
      // Initialize Stripe
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16',
      });

      try {
        // Cancel the subscription in Stripe immediately with immediate effect
        console.log('Cancelling Stripe subscription:', subscription_id);
        await stripe.subscriptions.cancel(subscription_id, {
          prorate: true, // This will prorate the cancellation
          invoice_now: true // This will generate a final invoice immediately
        });
        console.log('Stripe subscription cancelled:', subscription_id);
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
        throw new Error('Failed to cancel Stripe subscription');
      }
    }

    // Update subscription status in database immediately
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        is_active: false,
        current_period_end: new Date().toISOString() // Set period end to now
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      throw new Error('Failed to update subscription status');
    }

    console.log('Successfully cancelled subscription for user:', user.id);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cancel-subscription function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to cancel subscription',
        details: error
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});