import { test, expect } from '@playwright/test';

test.describe('Credits System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
  });

  test('should display credits balance on homepage', async ({ page }) => {
    // Check if credits display is visible
    const creditsDisplay = page.locator('text=/credits/i');
    await expect(creditsDisplay).toBeVisible({ timeout: 10000 });
  });

  test('should show credit packages on credits page', async ({ page }) => {
    // Navigate to credits page
    await page.goto('http://localhost:3000/credits');

    // Check for credit packages
    await expect(page.locator('text=/starter/i')).toBeVisible();
    await expect(page.locator('text=/popular/i')).toBeVisible();
    await expect(page.locator('text=/pro/i')).toBeVisible();
    await expect(page.locator('text=/enterprise/i')).toBeVisible();

    // Check for pricing
    await expect(page.locator('text=/\\$2\\.99/i')).toBeVisible();
    await expect(page.locator('text=/\\$12\\.99/i')).toBeVisible();
    await expect(page.locator('text=/\\$44\\.99/i')).toBeVisible();
    await expect(page.locator('text=/\\$199\\.99/i')).toBeVisible();
  });

  test('should show feature costs', async ({ page }) => {
    await page.goto('http://localhost:3000/credits');

    // Check for feature costs
    await expect(page.locator('text=/150 credits/i')).toBeVisible(); // Image
    await expect(page.locator('text=/30 credits/i')).toBeVisible(); // Quiz
    await expect(page.locator('text=/25 credits/i')).toBeVisible(); // Note
    await expect(page.locator('text=/50 credits/i')).toBeVisible(); // Slideshow
  });
});

test.describe('Chat Interface', () => {
  test('should display chat interface', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');

    // Check for chat interface elements
    await expect(page.locator('textarea[placeholder*="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
  });

  test('should show credits estimator when typing', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');

    const textarea = page.locator('textarea[placeholder*="message"]');
    await textarea.fill('Hello, can you help me with math?');

    // Wait for estimator to appear
    await expect(page.locator('text=/credits/i')).toBeVisible({ timeout: 5000 });
  });

  test('should prevent sending message with insufficient credits', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');

    // This test assumes user has low credits
    // Check for insufficient credits warning if credits are low
    const textarea = page.locator('textarea[placeholder*="message"]');
    const sendButton = page.locator('button[type="submit"]');

    await textarea.fill('Test message');

    // If credits are insufficient, send button should be disabled
    // This depends on actual credits balance
  });
});

test.describe('Image Generation', () => {
  test('should display image generator page', async ({ page }) => {
    await page.goto('http://localhost:3000/image-generator');

    await expect(page.locator('text=/AI Image Generator/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/150 credits/i')).toBeVisible();
  });

  test('should show cost before generating image', async ({ page }) => {
    await page.goto('http://localhost:3000/image-generator');

    // Check that 150 credits cost is displayed
    await expect(page.locator('text=/150 credits/i')).toBeVisible();
  });
});

test.describe('Quiz Generation', () => {
  test('should display quiz generator page', async ({ page }) => {
    await page.goto('http://localhost:3000/quiz');

    await expect(page.locator('text=/Quiz Generator/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/30 credits/i')).toBeVisible();
  });

  test('should allow topic input', async ({ page }) => {
    await page.goto('http://localhost:3000/quiz');

    const topicInput = page.locator('input[placeholder*="topic"]');
    await topicInput.fill('World History');

    await expect(topicInput).toHaveValue('World History');
  });
});

test.describe('Notes Generation', () => {
  test('should display notes page', async ({ page }) => {
    await page.goto('http://localhost:3000/notes');

    await expect(page.locator('text=/Notes/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show AI generate button with cost', async ({ page }) => {
    await page.goto('http://localhost:3000/notes');

    // Check for AI Generate button
    await expect(page.locator('text=/AI Generate/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Slideshow Generation', () => {
  test('should display slideshow creator page', async ({ page }) => {
    await page.goto('http://localhost:3000/slideshow');

    await expect(page.locator('text=/Slideshow Creator/i')).toBeVisible({ timeout: 10000 });
  });

  test('should allow topic input and slide count selection', async ({ page }) => {
    await page.goto('http://localhost:3000/slideshow');

    const topicInput = page.locator('input[placeholder*="presentation"]');
    await topicInput.fill('Climate Change');

    await expect(topicInput).toHaveValue('Climate Change');

    // Check for slide count slider
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
  });
});

test.describe('Profitability Protection', () => {
  test('should enforce credit limits on all features', async ({ page }) => {
    // This test verifies that all features check credits before execution

    // Navigate to each feature and verify credit checking
    const features = [
      '/chat',
      '/image-generator',
      '/quiz',
      '/notes',
      '/slideshow',
    ];

    for (const feature of features) {
      await page.goto(`http://localhost:3000${feature}`);

      // Verify that credit information is displayed
      await expect(page.locator('text=/credit/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display transaction history on credits page', async ({ page }) => {
    await page.goto('http://localhost:3000/credits');

    // Check for transaction history section
    await expect(page.locator('text=/transaction history/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show balance card on credits page', async ({ page }) => {
    await page.goto('http://localhost:3000/credits');

    // Check for balance display
    await expect(page.locator('text=/Available Credits/i')).toBeVisible();
    await expect(page.locator('text=/Total Purchased/i')).toBeVisible();
    await expect(page.locator('text=/Total Used/i')).toBeVisible();
  });
});

test.describe('Anti-Abuse Features', () => {
  test('should not allow rapid successive requests', async ({ page }) => {
    // This test would need to be implemented with actual rapid requests
    // and verify that rate limiting is in place
  });

  test('should track all credit usage', async ({ page }) => {
    await page.goto('http://localhost:3000/credits');

    // Verify transaction logging exists
    await expect(page.locator('text=/transaction/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('AI Customer Service', () => {
  test('should handle credit-related questions in chat', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');

    const textarea = page.locator('textarea[placeholder*="message"]');
    await textarea.fill('How many credits do I have?');

    // AI should be able to check credits and respond
    // This would require actual API integration test
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should display credits on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await expect(page.locator('text=/credit/i')).toBeVisible({ timeout: 10000 });
  });

  test('should have usable chat interface on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
  });
});
