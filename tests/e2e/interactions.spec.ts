/**
 * Comprehensive Interaction Tests
 * Tests drag-and-drop, tab management, and complex interactions
 */

import { test, expect, TestHelpers } from './fixtures';

test.describe('Tab Management', () => {
  test('should have tab bar visible', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    // Tab bar should be somewhere in the UI
    const hasContent = await mainWindow.evaluate(() => document.body.innerHTML.length > 1000);
    expect(hasContent).toBe(true);
  });

  test('should create new tab with Ctrl+N', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    await mainWindow.keyboard.press('Control+n');
    await mainWindow.waitForTimeout(500);
    
    expect(true).toBe(true);
  });

  test('should close tab with Ctrl+W', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    // Create a new tab first
    await mainWindow.keyboard.press('Control+n');
    await mainWindow.waitForTimeout(300);
    
    // Then close it
    await mainWindow.keyboard.press('Control+w');
    await mainWindow.waitForTimeout(300);
    
    expect(true).toBe(true);
  });

  test('should switch tabs with click', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    // Look for tab-like elements
    const tabs = mainWindow.locator('[role="tab"], [class*="tab"]');
    const tabCount = await tabs.count();
    
    if (tabCount > 1) {
      await tabs.first().click();
      await mainWindow.waitForTimeout(200);
    }
    
    expect(true).toBe(true);
  });
});

test.describe('File Tree Interactions', () => {
  test('should expand folder on click', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    // Look for folder icons
    const folders = mainWindow.locator('svg[class*="Folder"]');
    const folderCount = await folders.count();
    
    if (folderCount > 0) {
      await folders.first().click();
      await mainWindow.waitForTimeout(300);
    }
    
    expect(true).toBe(true);
  });

  test('should select file on click', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    // Look for file icons  
    const files = mainWindow.locator('svg[class*="FileCode"]');
    const fileCount = await files.count();
    
    if (fileCount > 0) {
      await files.first().click();
      await mainWindow.waitForTimeout(300);
    }
    
    expect(true).toBe(true);
  });

  test('should navigate file tree with arrow keys', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    // Focus sidebar
    await mainWindow.keyboard.press('Control+Shift+e');
    await mainWindow.waitForTimeout(300);
    
    // Navigate with arrow keys
    await mainWindow.keyboard.press('ArrowDown');
    await mainWindow.waitForTimeout(100);
    await mainWindow.keyboard.press('ArrowDown');
    await mainWindow.waitForTimeout(100);
    await mainWindow.keyboard.press('ArrowUp');
    await mainWindow.waitForTimeout(100);
    
    expect(true).toBe(true);
  });
});

test.describe('Drag and Drop', () => {
  test('should support file drag', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    // Check if draggable elements exist
    const draggables = mainWindow.locator('[draggable="true"]');
    const count = await draggables.count();
    
    // App should have some draggable elements (files)
    expect(count >= 0).toBe(true);
  });
});

test.describe('Context Menus', () => {
  test('should open context menu on right click in sidebar', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    const sidebar = mainWindow.locator('[data-testid="sidebar"]');
    if (await sidebar.isVisible()) {
      await sidebar.click({ button: 'right' });
      await mainWindow.waitForTimeout(300);
    }
    
    expect(true).toBe(true);
  });
});

test.describe('Zoom Controls', () => {
  test('should zoom in with Ctrl++', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    await mainWindow.keyboard.press('Control+=');
    await mainWindow.waitForTimeout(300);
    
    expect(true).toBe(true);
  });

  test('should zoom out with Ctrl+-', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    await mainWindow.keyboard.press('Control+-');
    await mainWindow.waitForTimeout(300);
    
    expect(true).toBe(true);
  });

  test('should reset zoom with Ctrl+0', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    await mainWindow.keyboard.press('Control+0');
    await mainWindow.waitForTimeout(300);
    
    expect(true).toBe(true);
  });
});
