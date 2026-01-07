/**
 * Smart Model Router - Automatically selects the cheapest model that can handle the query
 * This dramatically reduces costs while maintaining quality
 */

export function selectOptimalModel(message: string, conversationHistory: any[]): string {
  const lowerMessage = message.toLowerCase();

  // Use GPT-4o-mini (94% cheaper) for simple queries
  const simplePatterns = [
    /^(hi|hello|hey|what's up|sup)/i,
    /^(yes|no|ok|okay|thanks|thank you)/i,
    /summarize|tldr|quick|simple|eli5|explain like/i,
    /^(define|what is|who is|when was)/i,
    /translate/i,
    /(grammar|spell check|proofread)/i,
  ];

  // Use GPT-4o for complex reasoning
  const complexPatterns = [
    /(analyze|critical thinking|reasoning|logic)/i,
    /(code|programming|debug|algorithm)/i,
    /(essay|research paper|thesis)/i,
    /(complex|advanced|detailed analysis)/i,
    /(math|calculus|physics|chemistry)/i,
  ];

  // Check if it's a code/complex query
  const hasCode = /```|function|class|import|def |const |let |var /.test(message);
  const isLongQuery = message.length > 500;
  const hasMultipleSteps = message.includes('step') || message.includes('first') || message.includes('then');

  // Determine model
  if (hasCode || complexPatterns.some((pattern) => pattern.test(lowerMessage))) {
    return 'gpt-4o'; // Use expensive model for complex tasks
  }

  if (conversationHistory.length > 5 && isLongQuery) {
    return 'gpt-4o'; // Use expensive model for long conversations
  }

  // Default to cheap model (94% cost savings!)
  return 'gpt-4o-mini';
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = {
    'gpt-4o': {
      input: 2.5 / 1_000_000, // $2.50 per 1M tokens
      output: 10 / 1_000_000, // $10 per 1M tokens
    },
    'gpt-4o-mini': {
      input: 0.15 / 1_000_000, // $0.15 per 1M tokens
      output: 0.6 / 1_000_000, // $0.60 per 1M tokens
    },
  };

  const modelCosts = costs[model as keyof typeof costs] || costs['gpt-4o-mini'];
  return inputTokens * modelCosts.input + outputTokens * modelCosts.output;
}

/**
 * NEW PROFIT MARGINS with Smart Routing:
 *
 * Assuming 70% of queries use GPT-4o-mini (cheap):
 * - Average cost per message: ~$0.003 (vs $0.0125)
 *
 * FREE Tier (10 messages):
 * - Cost: $0.03/month
 * - Revenue: $0
 * - Acceptable loss leader
 *
 * STARTER ($9.99, 100 messages):
 * - Cost: $0.30/month
 * - Revenue: $9.99
 * - Profit: $9.69 (97% margin!) ✅
 *
 * PREMIUM ($19.99, 500 messages):
 * - Cost: $1.50/month
 * - Revenue: $19.99
 * - Profit: $18.49 (92% margin!) ✅
 *
 * UNLIMITED ($39.99, avg 2000 messages):
 * - Cost: $6/month
 * - Revenue: $39.99
 * - Profit: $33.99 (85% margin!) ✅
 */
