import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
  });
};

const getOpenAI = () => {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
};

const RefundDecisionSchema = z.object({
  decision: z.enum(['approved', 'partial', 'rejected']),
  percentage: z.number().min(0).max(100), // 100 = full refund, 50 = half, etc.
  reasoning: z.string(),
  userMessage: z.string(), // Message to send to user explaining decision
  riskLevel: z.enum(['low', 'medium', 'high']), // Risk of abuse
});

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const { reason, subscriptionId } = await req.json();

    if (!reason || !subscriptionId) {
      return new Response(
        JSON.stringify({ error: 'Reason and subscription ID required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user data and subscription history
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier, stripe_customer_id, stripe_subscription_id, created_at')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for previous refund requests (anti-abuse)
    const { data: previousRefunds } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const refundHistory = {
      totalRefunds: previousRefunds?.length || 0,
      lastRefundDate: previousRefunds?.[0]?.created_at || null,
      approvedRefunds: previousRefunds?.filter((r) => r.status === 'approved').length || 0,
    };

    // Get Stripe subscription details
    const subscription = await stripe.subscriptions.retrieve(
      userData.stripe_subscription_id
    );

    const subscriptionAge = Math.floor(
      (Date.now() - subscription.created * 1000) / (1000 * 60 * 60 * 24)
    ); // Days

    const amountPaid = subscription.items.data[0]?.price.unit_amount || 0;

    // AI analyzes the refund request
    const openai = getOpenAI();
    const aiDecision = await generateObject({
      model: openai('gpt-4o'),
      schema: RefundDecisionSchema,
      prompt: `Analyze this refund request and make a fair decision:

User's Reason: "${reason}"

Context:
- Subscription tier: ${userData.subscription_tier}
- Amount paid: $${(amountPaid / 100).toFixed(2)}
- Subscription age: ${subscriptionAge} days
- Account created: ${new Date(userData.created_at).toLocaleDateString()}
- Previous refund requests: ${refundHistory.totalRefunds}
- Previous approved refunds: ${refundHistory.approvedRefunds}
- Last refund: ${refundHistory.lastRefundDate ? new Date(refundHistory.lastRefundDate).toLocaleDateString() : 'Never'}

Decision Guidelines:
1. APPROVE (100%) if:
   - Valid technical issues (bugs, features not working)
   - Service not as described
   - Billing errors
   - Early in subscription (< 7 days) with reasonable concern
   - First-time refund request with legitimate reason

2. PARTIAL (30-70%) if:
   - Used service for significant time but dissatisfied
   - Changed mind after trying features
   - Found alternative solution
   - Some value received but not meeting expectations

3. REJECT (0%) if:
   - Abuse pattern (multiple refunds, very recent last refund)
   - Used service extensively (> 20 days)
   - Vague or no real reason
   - Already received value proportional to payment
   - Suspicious timing or behavior

Risk Assessment:
- HIGH risk if: multiple refund history, very new account requesting refund, vague reason
- MEDIUM risk if: some refund history, moderate usage time
- LOW risk if: first refund, clear legitimate issue, early in subscription

Provide a fair, balanced decision that protects both the user and the business. Be customer-friendly for legitimate cases but strict on abuse.`,
    });

    const decision = aiDecision.object as z.infer<typeof RefundDecisionSchema>;

    // Calculate refund amount
    const refundAmount = Math.round((amountPaid * decision.percentage) / 100);

    // Process refund through Stripe if approved or partial
    let stripeRefundId: string | null = null;

    if (decision.decision !== 'rejected' && refundAmount > 0) {
      try {
        // Get the latest invoice for this subscription
        const invoices = await stripe.invoices.list({
          subscription: userData.stripe_subscription_id,
          limit: 1,
        });

        if (invoices.data.length > 0 && invoices.data[0].payment_intent) {
          const refund = await stripe.refunds.create({
            payment_intent: invoices.data[0].payment_intent as string,
            amount: refundAmount,
            reason: 'requested_by_customer',
          });

          stripeRefundId = refund.id;

          // Cancel subscription if full refund
          if (decision.percentage === 100) {
            await stripe.subscriptions.cancel(userData.stripe_subscription_id);

            // Update user's subscription tier to free
            await supabase
              .from('users')
              .update({ subscription_tier: 'free', stripe_subscription_id: null })
              .eq('id', user.id);
          }
        }
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError);
        // Continue anyway and save the decision, admin can process manually
      }
    }

    // Save refund request to database
    const { data: refundRequest } = await supabase
      .from('refund_requests')
      .insert({
        user_id: user.id,
        reason,
        amount: amountPaid / 100,
        status: decision.decision,
        ai_analysis: {
          decision: decision.decision,
          percentage: decision.percentage,
          reasoning: decision.reasoning,
          riskLevel: decision.riskLevel,
        },
        refund_amount: refundAmount / 100,
        stripe_refund_id: stripeRefundId,
        resolved_at: new Date().toISOString(),
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        decision: decision.decision,
        refundAmount: refundAmount / 100,
        percentage: decision.percentage,
        message: decision.userMessage,
        refundRequest,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Refund request error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process refund request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
