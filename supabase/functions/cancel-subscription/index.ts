import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
    console.log('Starting subscription cancellation process...');

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

    // Fetch subscription details from database
    console.log('Fetching subscription details from database...');
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
      throw new Error('Failed to fetch subscription details');
    }

    if (!subscription) {
      console.error('No subscription found for user:', user.id);
      throw new Error('No subscription found');
    }

    console.log('Found subscription:', subscription);

    // For trial cancellation (no Stripe subscription)
    if (!subscription_id) {
      console.log('Processing trial cancellation...');
      
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Error updating trial subscription:', updateError);
        throw new Error('Failed to cancel trial subscription');
      }

      console.log('Trial successfully cancelled');
      return new Response(
        JSON.stringify({ success: true, message: 'Trial cancelled successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For paid subscription cancellation
    console.log('Processing paid subscription cancellation...');
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    try {
      // Cancel the subscription in Stripe
      console.log('Cancelling Stripe subscription:', subscription_id);
      const stripeSubscription = await stripe.subscriptions.cancel(subscription_id);
      console.log('Stripe subscription cancelled:', stripeSubscription.id);

      // Update subscription status in database
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: stripeSubscription.status,
          canceled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Error updating subscription in database:', updateError);
        throw new Error('Failed to update subscription status');
      }

      console.log('Successfully cancelled subscription for user:', user.id);
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription cancelled successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (stripeError) {
      console.error('Stripe cancellation error:', stripeError);
      throw new Error(stripeError instanceof Error ? stripeError.message : 'Failed to cancel Stripe subscription');
    }

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