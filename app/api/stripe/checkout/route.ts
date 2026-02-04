import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, createCustomer, createCheckoutSession } from '@/lib/stripe'
import { PRICING_PLANS } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to subscribe' },
        { status: 401 }
      )
    }

    const { planId, billingPeriod = 'monthly' } = await request.json()
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS]

    if (!plan || plan.price === 0) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await createCustomer(user.email!, user.user_metadata?.full_name)
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          stripe_customer_id: customerId,
          email: user.email,
        })
    }

    // Create checkout session - use annual price if selected
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''
    const priceId = billingPeriod === 'annual' && plan.annualPriceId
      ? plan.annualPriceId
      : plan.priceId

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured for this plan. Please set up Stripe products first.' },
        { status: 400 }
      )
    }

    const session = await createCheckoutSession(
      customerId,
      priceId,
      `${origin}/dashboard?success=true`,
      `${origin}/pricing?canceled=true`
    )

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
