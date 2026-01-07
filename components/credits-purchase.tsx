'use client';

import { useState } from 'react';
import { Coins, Zap, Check, TrendingUp, Star, Sparkles } from 'lucide-react';
import { CREDIT_PRICING, formatCredits } from '@/lib/credits-system';
import { CreditsBalanceCard, TransactionItem } from './credits-display';

interface CreditsPurchaseProps {
  userId: string;
  currentBalance: number;
  totalPurchased: number;
  totalUsed: number;
  transactions: any[];
}

export default function CreditsPurchase({
  userId,
  currentBalance,
  totalPurchased,
  totalUsed,
  transactions,
}: CreditsPurchaseProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>('popular');

  const packages = Object.entries(CREDIT_PRICING.PACKAGES).map(([key, pkg]) => ({
    id: key,
    ...pkg,
  }));

  async function handlePurchase(packageId: string) {
    const pkg = CREDIT_PRICING.PACKAGES[packageId as keyof typeof CREDIT_PRICING.PACKAGES];

    // TODO: Integrate with Stripe for actual payment
    alert(`Purchase ${formatCredits(pkg.credits)} credits for $${pkg.price.toFixed(2)}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
              <Coins className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Credits</h1>
              <p className="text-gray-600">Pay only for what you use - no subscriptions!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Balance & Info */}
          <div className="lg:col-span-1 space-y-6">
            <CreditsBalanceCard
              balance={currentBalance}
              totalPurchased={totalPurchased}
              totalUsed={totalUsed}
            />

            {/* How Credits Work */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                How Credits Work
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">1 credit = 100 words</div>
                    <div className="text-sm text-gray-600">
                      You're charged for both input and output
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">No expiration</div>
                    <div className="text-sm text-gray-600">Credits never expire</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Real-time tracking</div>
                    <div className="text-sm text-gray-600">
                      See exactly how many credits each action uses
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Costs */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Feature Costs</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Chat (per 100 words)</span>
                  <span className="font-bold text-orange-600">1 credit</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Image Generation</span>
                  <span className="font-bold text-orange-600">150 credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Quiz Generation</span>
                  <span className="font-bold text-orange-600">30 credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Note Generation</span>
                  <span className="font-bold text-orange-600">25 credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Slideshow Creation</span>
                  <span className="font-bold text-orange-600">50 credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Note Enhancement</span>
                  <span className="font-bold text-orange-600">15 credits</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Packages & History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Credit Packages */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Buy Credits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative bg-white rounded-2xl shadow-lg p-6 border-2 transition-all cursor-pointer ${
                      'popular' in pkg && pkg.popular
                        ? 'border-orange-500 shadow-2xl scale-105'
                        : selectedPackage === pkg.id
                        ? 'border-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {'popular' in pkg && pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          MOST POPULAR
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-600 uppercase mb-2">
                        {pkg.id}
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-bold text-gray-900">
                          {formatCredits(pkg.credits)}
                        </span>
                        <span className="text-gray-600">credits</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        = {(pkg.credits * 100).toLocaleString()} words
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">${pkg.price}</div>
                      <div className="text-sm text-gray-600">
                        ${(pkg.price / pkg.credits).toFixed(4)} per credit
                      </div>
                      {pkg.discount > 0 && (
                        <div className="mt-2 inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Save {pkg.discount}%
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        'popular' in pkg && pkg.popular
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Purchase Credits
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h2>
              {transactions.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      type={transaction.type}
                      amount={transaction.amount}
                      description={transaction.description}
                      timestamp={transaction.created_at}
                      metadata={transaction.metadata}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
