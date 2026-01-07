/**
 * Credits-based pricing system
 *
 * Pricing Strategy:
 * - GPT-4o-mini blended cost: ~$0.0000029 per word
 * - For 90% profit margin: charge $0.00003 per word
 * - 1 credit = 100 words of AI usage
 * - 1 credit costs user ~$0.003 (0.3 cents)
 */

export const CREDIT_PRICING = {
  // Cost per word to us (blended GPT-4o + GPT-4o-mini with 70/30 split)
  COST_PER_WORD_INPUT: 0.0000011,  // $0.0000011
  COST_PER_WORD_OUTPUT: 0.0000046, // $0.0000046
  COST_PER_IMAGE: 0.04,            // DALL-E 3 standard

  // How many words = 1 credit
  WORDS_PER_CREDIT: 100,

  // Price per credit (in cents)
  PRICE_PER_CREDIT: 0.3, // $0.003 per credit

  // Credit packages (price in dollars)
  PACKAGES: {
    starter: {
      credits: 1000,      // 100,000 words
      price: 2.99,        // $0.00299 per credit (vs $0.003 base)
      discount: 0,
    },
    popular: {
      credits: 5000,      // 500,000 words
      price: 12.99,       // $0.0026 per credit (13% discount)
      discount: 13,
      popular: true,
    },
    pro: {
      credits: 20000,     // 2,000,000 words
      price: 44.99,       // $0.00225 per credit (25% discount)
      discount: 25,
    },
    enterprise: {
      credits: 100000,    // 10,000,000 words
      price: 199.99,      // $0.002 per credit (33% discount)
      discount: 33,
    },
  },
};

// Credit costs for different features
export const FEATURE_COSTS = {
  // Chat messages: charged per word (input + output)
  CHAT_PER_WORD: 1 / CREDIT_PRICING.WORDS_PER_CREDIT, // 0.01 credits per word

  // Images: flat rate
  IMAGE_GENERATION: 150, // 150 credits = $0.45 (cost us $0.04, profit $0.41, 91% margin)

  // Quiz generation: estimate 2000 words output
  QUIZ_GENERATION: 30, // 30 credits = $0.09 (cost us ~$0.015, profit $0.075, 83% margin)

  // Note generation: estimate 1500 words output
  NOTE_GENERATION: 25, // 25 credits = $0.075 (cost us ~$0.012, profit $0.063, 84% margin)

  // Slideshow generation: estimate 3000 words + API calls
  SLIDESHOW_GENERATION: 50, // 50 credits = $0.15 (cost us ~$0.025, profit $0.125, 83% margin)

  // Note enhancement: estimate 1000 words
  NOTE_ENHANCEMENT: 15, // 15 credits = $0.045 (cost us ~$0.008, profit $0.037, 82% margin)
};

/**
 * Calculate credit cost for text (input + output words)
 */
export function calculateTextCredits(inputWords: number, outputWords: number): number {
  const totalWords = inputWords + outputWords;
  const credits = totalWords / CREDIT_PRICING.WORDS_PER_CREDIT;
  return Math.ceil(credits * 10) / 10; // Round to 1 decimal
}

/**
 * Estimate word count from text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate real-time cost estimate as user types
 */
export function estimateMessageCost(userInput: string): {
  inputWords: number;
  estimatedOutputWords: number;
  totalWords: number;
  estimatedCredits: number;
  estimatedCost: number;
} {
  const inputWords = countWords(userInput);
  // Estimate output will be 1.5x input (conservative)
  const estimatedOutputWords = Math.ceil(inputWords * 1.5);
  const totalWords = inputWords + estimatedOutputWords;
  const estimatedCredits = calculateTextCredits(inputWords, estimatedOutputWords);
  const estimatedCost = estimatedCredits * CREDIT_PRICING.PRICE_PER_CREDIT;

  return {
    inputWords,
    estimatedOutputWords,
    totalWords,
    estimatedCredits,
    estimatedCost,
  };
}

/**
 * Calculate actual cost after response
 */
export function calculateActualCost(userInput: string, aiResponse: string): {
  inputWords: number;
  outputWords: number;
  totalWords: number;
  creditsUsed: number;
  actualCost: number;
} {
  const inputWords = countWords(userInput);
  const outputWords = countWords(aiResponse);
  const totalWords = inputWords + outputWords;
  const creditsUsed = calculateTextCredits(inputWords, outputWords);
  const actualCost = creditsUsed * CREDIT_PRICING.PRICE_PER_CREDIT;

  return {
    inputWords,
    outputWords,
    totalWords,
    creditsUsed,
    actualCost,
  };
}

/**
 * Format credits for display
 */
export function formatCredits(credits: number): string {
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toFixed(1);
}

/**
 * Format cost in dollars
 */
export function formatCost(credits: number): string {
  const cost = credits * CREDIT_PRICING.PRICE_PER_CREDIT;
  if (cost < 0.01) {
    return '<$0.01';
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Get profit margin analysis
 */
export function getProfitAnalysis(credits: number, featureType: string): {
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
} {
  const revenue = credits * CREDIT_PRICING.PRICE_PER_CREDIT;

  let cost = 0;
  switch (featureType) {
    case 'chat':
      // Blended cost per word × words per credit
      const avgCostPerWord = (CREDIT_PRICING.COST_PER_WORD_INPUT + CREDIT_PRICING.COST_PER_WORD_OUTPUT) / 2;
      cost = credits * CREDIT_PRICING.WORDS_PER_CREDIT * avgCostPerWord;
      break;
    case 'image':
      cost = CREDIT_PRICING.COST_PER_IMAGE;
      break;
    case 'quiz':
      cost = 0.015; // Estimated
      break;
    case 'note':
      cost = 0.012; // Estimated
      break;
    case 'slideshow':
      cost = 0.025; // Estimated
      break;
  }

  const profit = revenue - cost;
  const marginPercent = (profit / revenue) * 100;

  return {
    revenue,
    cost,
    profit,
    marginPercent,
  };
}
