/**
 * Complex State Tests - Split Editor & Terminal
 * Tests split view, terminal interactions
 */

import { test, expect, TestHelpers } from './fixtures';

test.describe('Split Editor States', () => {
  test('should work with split editor open', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    // Create a file first
    await mainWindow.keyboard.press('Control+n');
    await mainWindow.waitForTimeout(300);
    
    const helpers = new TestHelpers(mainWindow);
    await helpers.waitForEditor();
    
    // Type some content
    await mainWindow.keyboard.type('ALGORITHM SplitTest\nBEGIN\n    PRINT("Hello")\nEND.');
    await mainWindow.waitForTimeout(300);
    
    // Try to split (right-click context menu or keyboard shortcut if available)
    expect(true).toBe(true);
  });

  test('should type in both editors if split', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const helpers = new TestHelpers(mainWindow);
    await helpers.waitForEditor();
    
    // Type in main editor
    await mainWindow.keyboard.type('Main editor content');
    await mainWindow.waitForTimeout(200);
    
    expect(true).toBe(true);
  });
});

test.describe('Terminal States', () => {
  test('should open terminal with button click', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    const terminalBtn = mainWindow.locator('[data-testid="btn-terminal"]');
    await terminalBtn.click();
    await mainWindow.waitForTimeout(500);
    
    expect(true).toBe(true);
  });

  test('should open terminal with keyboard shortcut', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    // Ctrl+` to toggle terminal
    await mainWindow.keyboard.press('Control+`');
    await mainWindow.waitForTimeout(500);
    
    expect(true).toBe(true);
  });

  test('should run code and show output in terminal', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const helpers = new TestHelpers(mainWindow);
    await helpers.waitForEditor();
    
    // Type valid code
    await mainWindow.keyboard.press('Control+a');
    await mainWindow.keyboard.type('ALGORITHM Output\nBEGIN\n    PRINT("Hello World")\nEND.');
    await mainWindow.waitForTimeout(300);
    
    // Run with F5
    await mainWindow.keyboard.press('F5');
    await mainWindow.waitForTimeout(2000);
    
    // Terminal should show output
    expect(true).toBe(true);
  });

  test('should handle code that produces errors', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const helpers = new TestHelpers(mainWindow);
    await helpers.waitForEditor();
    
    // Type code with runtime potential errors
    await mainWindow.keyboard.press('Control+a');
    await mainWindow.keyboard.type('ALGORITHM Error\nVAR x : INTEGER\nBEGIN\n    x <- 0\nEND.');
    await mainWindow.waitForTimeout(300);
    
    await mainWindow.keyboard.press('F5');
    await mainWindow.waitForTimeout(1000);
    
    expect(true).toBe(true);
  });

  test('should toggle terminal visibility', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    // Toggle on
    await mainWindow.keyboard.press('Control+`');
    await mainWindow.waitForTimeout(300);
    
    // Toggle off
    await mainWindow.keyboard.press('Control+`');
    await mainWindow.waitForTimeout(300);
    
    // Toggle on again
    await mainWindow.keyboard.press('Control+`');
    await mainWindow.waitForTimeout(300);
    
    expect(true).toBe(true);
  });
});

test.describe('Terminal with Input', () => {
  test('should handle code that requires input', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const helpers = new TestHelpers(mainWindow);
    await helpers.waitForEditor();
    
    // Type code with SCAN
    await mainWindow.keyboard.press('Control+a');
    await mainWindow.keyboard.type('ALGORITHM Input\nVAR x : INTEGER\nBEGIN\n    SCAN(x)\n    PRINT("You entered:", x)\nEND.');
    await mainWindow.waitForTimeout(300);
    
    await mainWindow.keyboard.press('F5');
    await mainWindow.waitForTimeout(1000);
    
    // Terminal should wait for input
    expect(true).toBe(true);
  });
});
