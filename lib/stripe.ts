import Stripe from 'stripe'

// Initialize Stripe only if secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  : null

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  })

  return session
}

export async function createCustomer(email: string, name?: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const customer = await stripe.customers.create({
    email,
    name,
  })

  return customer
}

export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}
