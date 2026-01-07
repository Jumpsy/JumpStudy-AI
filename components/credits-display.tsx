'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingDown, TrendingUp, Zap, AlertCircle, Crown, Gift } from 'lucide-react';
import { estimateMessageCost, formatCredits, formatCost, FEATURE_COSTS } from '@/lib/credits-system';
import { isAdmin, getAdminCredits } from '@/lib/admin-access';
import { isFreePlan, getFreeCreditsLimit } from '@/lib/plan-tiers';

interface CreditsDisplayProps {
  userId: string;
  userEmail?: string;
  userPlan?: string;
  initialBalance: number;
}

export default function CreditsDisplay({ userId, userEmail, userPlan, initialBalance }: CreditsDisplayProps) {
  const adminStatus = isAdmin(userEmail, userId);
  const freeStatus = isFreePlan(userPlan);
  const [balance, setBalance] = useState(adminStatus ? getAdminCredits() : initialBalance);
  const [isLowBalance, setIsLowBalance] = useState(false);

  useEffect(() => {
    if (adminStatus) {
      setBalance(getAdminCredits());
      setIsLowBalance(false);
    } else {
      setBalance(initialBalance);
      setIsLowBalance(balance < 50);
    }
  }, [adminStatus, initialBalance, balance]);

  // Admin badge
  if (adminStatus) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 text-purple-900">
        <Crown className="w-5 h-5 text-purple-600" />
        <div className="flex flex-col">
          <span className="text-xs font-semibold opacity-75">Owner Access</span>
          <span className="text-lg font-bold leading-none">∞ Unlimited</span>
        </div>
      </div>
    );
  }

  // Free plan badge
  if (freeStatus) {
    const freeLimit = getFreeCreditsLimit();
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 text-blue-900">
        <Gift className="w-5 h-5 text-blue-600" />
        <div className="flex flex-col">
          <span className="text-xs font-semibold opacity-75">Free Plan</span>
          <span className="text-lg font-bold leading-none">
            {formatCredits(balance)} / {freeLimit}
          </span>
        </div>
      </div>
    );
  }

  // Regular paid user
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
        isLowBalance
          ? 'bg-red-50 border-red-300 text-red-700'
          : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 text-yellow-900'
      }`}
    >
      <Coins className={`w-5 h-5 ${isLowBalance ? 'text-red-600' : 'text-yellow-600'}`} />
      <div className="flex flex-col">
        <span className="text-xs font-semibold opacity-75">Credits</span>
        <span className="text-lg font-bold leading-none">{formatCredits(balance)}</span>
      </div>
      {isLowBalance && <AlertCircle className="w-4 h-4 text-red-600" />}
    </div>
  );
}

/**
 * Real-time usage estimator for chat input
 */
export function ChatCreditsEstimator({ inputText }: { inputText: string }) {
  const [estimate, setEstimate] = useState({
    inputWords: 0,
    estimatedOutputWords: 0,
    totalWords: 0,
    estimatedCredits: 0,
    estimatedCost: 0,
  });

  useEffect(() => {
    if (inputText.trim()) {
      setEstimate(estimateMessageCost(inputText));
    } else {
      setEstimate({
        inputWords: 0,
        estimatedOutputWords: 0,
        totalWords: 0,
        estimatedCredits: 0,
        estimatedCost: 0,
      });
    }
  }, [inputText]);

  if (estimate.estimatedCredits === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
      <Zap className="w-4 h-4 text-blue-600" />
      <span>
        <strong className="text-blue-700">{formatCredits(estimate.estimatedCredits)}</strong> credits
        (~{estimate.totalWords} words) • {formatCost(estimate.estimatedCredits)}
      </span>
    </div>
  );
}

/**
 * Usage indicator after a message
 */
export function UsageIndicator({
  creditsUsed,
  inputWords,
  outputWords,
}: {
  creditsUsed: number;
  inputWords: number;
  outputWords: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
      <TrendingDown className="w-3 h-3 text-orange-600" />
      <span>
        -{formatCredits(creditsUsed)} credits ({inputWords + outputWords} words)
      </span>
    </div>
  );
}

/**
 * Feature cost display
 */
export function FeatureCostBadge({ feature }: { feature: keyof typeof FEATURE_COSTS }) {
  const cost = FEATURE_COSTS[feature];
  const costInDollars = formatCost(cost);

  const featureNames: Record<string, string> = {
    IMAGE_GENERATION: 'Image',
    QUIZ_GENERATION: 'Quiz',
    NOTE_GENERATION: 'Note',
    SLIDESHOW_GENERATION: 'Slideshow',
    NOTE_ENHANCEMENT: 'Enhancement',
  };

  return (
    <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
      <Coins className="w-3 h-3" />
      <span>
        {formatCredits(cost)} credits • {costInDollars}
      </span>
    </div>
  );
}

/**
 * Credits balance card with detailed info
 */
export function CreditsBalanceCard({
  balance,
  totalPurchased,
  totalUsed,
}: {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
}) {
  return (
    <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-2xl p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Coins className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-semibold opacity-90">Available Credits</div>
            <div className="text-4xl font-bold">{formatCredits(balance)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white border-opacity-30">
        <div>
          <div className="flex items-center gap-1.5 text-sm opacity-90 mb-1">
            <TrendingUp className="w-4 h-4" />
            Total Purchased
          </div>
          <div className="text-2xl font-bold">{formatCredits(totalPurchased)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-sm opacity-90 mb-1">
            <TrendingDown className="w-4 h-4" />
            Total Used
          </div>
          <div className="text-2xl font-bold">{formatCredits(totalUsed)}</div>
        </div>
      </div>

      <button className="mt-6 w-full bg-white text-orange-600 font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg">
        Buy More Credits
      </button>
    </div>
  );
}

/**
 * Transaction history item
 */
export function TransactionItem({
  type,
  amount,
  description,
  timestamp,
  metadata,
}: {
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}) {
  const isPositive = amount > 0;
  const icon = type === 'purchase' || type === 'bonus' ? <TrendingUp /> : <TrendingDown />;
  const color =
    type === 'purchase'
      ? 'text-green-600'
      : type === 'bonus'
      ? 'text-blue-600'
      : type === 'refund'
      ? 'text-purple-600'
      : 'text-orange-600';

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} bg-opacity-10`}>
          {icon}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{description}</div>
          <div className="text-sm text-gray-500">{new Date(timestamp).toLocaleString()}</div>
          {metadata?.inputWords && metadata?.outputWords && (
            <div className="text-xs text-gray-500 mt-1">
              {metadata.inputWords} in + {metadata.outputWords} out = {metadata.totalWords} words
            </div>
          )}
        </div>
      </div>
      <div className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
        {isPositive ? '+' : ''}
        {formatCredits(Math.abs(amount))}
      </div>
    </div>
  );
}
