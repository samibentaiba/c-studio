/**
 * Comprehensive Menu Tests
 * Tests all menu items in File, Edit, View, and Help menus
 */

import { test, expect, TestHelpers } from './fixtures';

test.describe('File Menu', () => {
  test('should open File menu', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    const fileMenu = mainWindow.locator('[data-testid="menu-file"]');
    await expect(fileMenu).toBeVisible();
    await fileMenu.click();
    await mainWindow.waitForTimeout(300);
    
    // Menu should be open - check for menu items
    const newFileItem = mainWindow.locator('[data-testid="menu-file-item-new-file"]');
    await expect(newFileItem).toBeVisible();
  });

  test('should have New File option', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const fileMenu = mainWindow.locator('[data-testid="menu-file"]');
    await fileMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const newFileItem = mainWindow.locator('[data-testid="menu-file-item-new-file"]');
    await expect(newFileItem).toBeVisible();
  });

  test('should have Open File option', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const fileMenu = mainWindow.locator('[data-testid="menu-file"]');
    await fileMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const openFileItem = mainWindow.locator('[data-testid="menu-file-item-open-file---"]');
    await expect(openFileItem).toBeVisible();
  });

  test('should have Save option', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const fileMenu = mainWindow.locator('[data-testid="menu-file"]');
    await fileMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const saveItem = mainWindow.locator('[data-testid="menu-file-item-save"]');
    await expect(saveItem).toBeVisible();
  });

  test('should have Export/Import options', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const fileMenu = mainWindow.locator('[data-testid="menu-file"]');
    await fileMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const exportItem = mainWindow.locator('[data-testid="menu-file-item-export-workspace---"]');
    const importItem = mainWindow.locator('[data-testid="menu-file-item-import-workspace---"]');
    
    await expect(exportItem).toBeVisible();
    await expect(importItem).toBeVisible();
  });
});

test.describe('Edit Menu', () => {
  test('should open Edit menu', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const editMenu = mainWindow.locator('[data-testid="menu-edit"]');
    await expect(editMenu).toBeVisible();
    await editMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const undoItem = mainWindow.locator('[data-testid="menu-edit-item-undo"]');
    await expect(undoItem).toBeVisible();
  });

  test('should have Undo/Redo options', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const editMenu = mainWindow.locator('[data-testid="menu-edit"]');
    await editMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const undoItem = mainWindow.locator('[data-testid="menu-edit-item-undo"]');
    const redoItem = mainWindow.locator('[data-testid="menu-edit-item-redo"]');
    
    await expect(undoItem).toBeVisible();
    await expect(redoItem).toBeVisible();
  });

  test('should have Cut/Copy/Paste options', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const editMenu = mainWindow.locator('[data-testid="menu-edit"]');
    await editMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const cutItem = mainWindow.locator('[data-testid="menu-edit-item-cut"]');
    const copyItem = mainWindow.locator('[data-testid="menu-edit-item-copy"]');
    const pasteItem = mainWindow.locator('[data-testid="menu-edit-item-paste"]');
    
    await expect(cutItem).toBeVisible();
    await expect(copyItem).toBeVisible();
    await expect(pasteItem).toBeVisible();
  });
});

test.describe('View Menu', () => {
  test('should open View menu', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const viewMenu = mainWindow.locator('[data-testid="menu-view"]');
    await expect(viewMenu).toBeVisible();
    await viewMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const terminalItem = mainWindow.locator('[data-testid="menu-view-item-toggle-terminal"]');
    await expect(terminalItem).toBeVisible();
  });

  test('should have Toggle Terminal option', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const viewMenu = mainWindow.locator('[data-testid="menu-view"]');
    await viewMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const terminalItem = mainWindow.locator('[data-testid="menu-view-item-toggle-terminal"]');
    await expect(terminalItem).toBeVisible();
  });

  test('should have Toggle Sidebar option', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const viewMenu = mainWindow.locator('[data-testid="menu-view"]');
    await viewMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const sidebarItem = mainWindow.locator('[data-testid="menu-view-item-toggle-sidebar"]');
    await expect(sidebarItem).toBeVisible();
  });
});

test.describe('Help Menu', () => {
  test('should open Help menu', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const helpMenu = mainWindow.locator('[data-testid="menu-help"]');
    await expect(helpMenu).toBeVisible();
    await helpMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const aboutItem = mainWindow.locator('[data-testid="menu-help-item-about-c-studio"]');
    await expect(aboutItem).toBeVisible();
  });

  test('should have About option', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const helpMenu = mainWindow.locator('[data-testid="menu-help"]');
    await helpMenu.click();
    await mainWindow.waitForTimeout(300);
    
    const aboutItem = mainWindow.locator('[data-testid="menu-help-item-about-c-studio"]');
    const docsItem = mainWindow.locator('[data-testid="menu-help-item-documentation"]');
    
    await expect(aboutItem).toBeVisible();
    await expect(docsItem).toBeVisible();
  });
});
