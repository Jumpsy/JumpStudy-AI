'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Check, Sparkles, Zap, Users, Crown, Loader2 } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'

export default function PricingPage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      router.push('/signup')
      return
    }

    setLoadingPlan(planId)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login?redirect=/pricing')
        return
      }

      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const planIcons = {
    free: Sparkles,
    plus: Zap,
    team: Users,
    pro: Crown,
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              20% cheaper than ChatGPT. All plans include unlimited AI chat, humanizer, and detector.
            </p>
          </div>

          {/* Comparison Banner */}
          <div className="mb-12 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl text-center">
            <p className="text-green-400">
              <span className="font-semibold">Save 20%</span> compared to ChatGPT Plus ($20/mo) -
              Our Plus plan is just <span className="font-bold">$16/mo</span>!
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(PRICING_PLANS).map((plan) => {
              const Icon = planIcons[plan.id as keyof typeof planIcons]
              const isPopular = 'popular' in plan && plan.popular

              return (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-2xl border ${
                    isPopular
                      ? 'bg-gradient-to-b from-purple-900/50 to-gray-900 border-purple-500/50'
                      : 'bg-gray-900 border-gray-800'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 rounded-full text-xs font-medium text-white">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      isPopular
                        ? 'bg-purple-500/20'
                        : 'bg-gray-800'
                    }`}>
                      <Icon className={`w-6 h-6 ${isPopular ? 'text-purple-400' : 'text-gray-400'}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-400">/month</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan === plan.id}
                    className={`w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
                      isPopular
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : plan.price === 0
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-white hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : plan.price === 0 ? (
                      'Get Started Free'
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* FAQ / Info */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <div className="max-w-2xl mx-auto space-y-4">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes! You can cancel your subscription at any time. No questions asked.',
                },
                {
                  q: 'Is the free plan really unlimited?',
                  a: 'Yes! Chat, humanizer, and detector are unlimited. Only image/video generation has daily limits on free.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards through Stripe. Your payment info is never stored on our servers.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="p-4 bg-gray-900 border border-gray-800 rounded-xl text-left">
                  <p className="font-medium text-white mb-1">{q}</p>
                  <p className="text-sm text-gray-400">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
