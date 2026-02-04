/**
 * Jump Code - Module Load Test
 * Verifies all modules can be loaded correctly
 */

import chalk from 'chalk';

async function testLoad() {
  console.log(chalk.cyan.bold('\n🧪 Testing Jump Code modules...\n'));

  const tests = [
    { name: 'Config', path: './src/utils/config.js' },
    { name: 'FileSystem', path: './src/core/filesystem.js' },
    { name: 'ComputerControl', path: './src/core/computer-control.js' },
    { name: 'ProjectAnalyzer', path: './src/core/project-analyzer.js' },
    { name: 'AIEngine', path: './src/core/ai-engine.js' },
    { name: 'JumpStudyAPI', path: './src/core/jumpstudy-api.js' },
    { name: 'CommandHandler', path: './src/commands/handler.js' },
    { name: 'TerminalUI', path: './src/ui/terminal.js' },
    { name: 'JumpCode Main', path: './src/index.js' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await import(test.path);
      console.log(chalk.green(`  ✓ ${test.name}`));
      passed++;
    } catch (error) {
      console.log(chalk.red(`  ✗ ${test.name}: ${error.message}`));
      failed++;
    }
  }

  console.log('');
  console.log(chalk.cyan(`Results: ${passed} passed, ${failed} failed`));
  console.log('');

  if (failed === 0) {
    console.log(chalk.green.bold('✅ All modules loaded successfully!'));
    console.log(chalk.gray('   Jump Code is ready to use.\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('❌ Some modules failed to load.'));
    process.exit(1);
  }
}

testLoad().catch((err) => {
  console.error(chalk.red('Test failed:'), err);
  process.exit(1);
});
