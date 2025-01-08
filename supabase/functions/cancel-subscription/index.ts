import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      console.error('User authentication error:', userError);
      throw new Error('User not authenticated');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get request body
    const { subscription_id } = await req.json();
    console.log('Received request to cancel subscription:', { subscription_id, userId: user.id });

    // For trial cancellation (no Stripe subscription)
    if (!subscription_id) {
      console.log('Processing trial cancellation for user:', user.id);
      
      const { data: subscription, error: fetchError } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching subscription:', fetchError);
        throw new Error('Failed to fetch subscription details');
      }

      if (!subscription) {
        throw new Error('No subscription found');
      }

      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating trial subscription:', updateError);
        throw new Error('Failed to cancel trial subscription');
      }

      console.log('Trial successfully cancelled for user:', user.id);
      return new Response(
        JSON.stringify({ success: true, message: 'Trial cancelled successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For paid subscription cancellation
    console.log('Processing paid subscription cancellation:', subscription_id);
    
    // Get customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      console.error('No Stripe customer found for email:', user.email);
      throw new Error('No customer found');
    }

    try {
      // Cancel the subscription in Stripe
      const subscription = await stripe.subscriptions.cancel(subscription_id);
      console.log('Stripe subscription cancelled:', subscription.id);

      // Update subscription status in database
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          status: subscription.status,
          canceled_at: new Date().toISOString(),
        })
        .eq('subscription_id', subscription_id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating subscription in database:', updateError);
        throw new Error('Failed to update subscription status');
      }

      console.log('Successfully cancelled subscription for user:', user.id);
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription cancelled successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
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
        message: error instanceof Error ? error.message : 'Failed to cancel subscription'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});