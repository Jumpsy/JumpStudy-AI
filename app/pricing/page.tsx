import { Check } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for trying out JumpStudyAI',
      features: [
        '10 messages per month',
        'GPT-4o-mini access',
        'Basic chat features',
        '7-day conversation history',
      ],
      limitations: ['No image generation', 'No file uploads', 'Limited history'],
      cta: 'Start Free',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Starter',
      price: 9.99,
      period: 'month',
      description: 'Great for students and learners',
      features: [
        '100 messages per month',
        'Full GPT-4o access',
        '10 AI images per month',
        'Upload PDFs & documents',
        '30-day conversation history',
        'Priority support',
      ],
      cta: 'Get Started',
      href: '/signup?plan=starter',
      highlighted: false,
    },
    {
      name: 'Premium',
      price: 19.99,
      period: 'month',
      badge: 'Most Popular',
      description: 'Best for power users',
      features: [
        '500 messages per month',
        'Full GPT-4o access',
        '50 AI images per month',
        'Unlimited file uploads',
        'Permanent conversation history',
        'Priority support',
        'Advanced features',
      ],
      cta: 'Go Premium',
      href: '/signup?plan=premium',
      highlighted: true,
    },
    {
      name: 'Unlimited',
      price: 39.99,
      period: 'month',
      description: 'For professionals & teams',
      features: [
        'Unlimited messages',
        'Full GPT-4o access',
        '200 AI images per month',
        'Unlimited file uploads',
        'Permanent history',
        'API access',
        'Priority support',
        'Early feature access',
        'Custom integrations',
      ],
      cta: 'Get Unlimited',
      href: '/signup?plan=unlimited',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get unlimited access to AI-powered learning. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                plan.highlighted ? 'ring-4 ring-blue-600 relative' : ''
              }`}
            >
              {plan.badge && (
                <div className="bg-blue-600 text-white text-center py-2 px-4 text-sm font-semibold">
                  {plan.badge}
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>

                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors mb-6 ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.limitations && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Not included:</p>
                    <div className="space-y-2">
                      {plan.limitations.map((limitation) => (
                        <div key={limitation} className="flex items-start gap-2">
                          <span className="text-gray-400 text-sm">• {limitation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            All plans include access to GPT-4o, conversation history, and our beautiful interface
          </p>
          <p className="text-sm text-gray-500">
            Need a custom plan for your school or organization?{' '}
            <a href="mailto:sales@jumpstudyai.com" className="text-blue-600 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
