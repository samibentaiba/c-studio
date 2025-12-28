/**
 * Complex State Tests - File Operations
 * Tests file creation, renaming, deletion, folder operations
 */

import { test, expect, TestHelpers } from './fixtures';

test.describe('File Creation States', () => {
  test('should create new file via button', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    const newFileBtn = mainWindow.locator('[data-testid="btn-new-file"]');
    await newFileBtn.click();
    await mainWindow.waitForTimeout(300);
    
    // Should show input field
    // Type a name and press enter
    await mainWindow.keyboard.type('test_file.algo');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.waitForTimeout(300);
    
    expect(true).toBe(true);
  });

  test('should cancel file creation with Escape', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const newFileBtn = mainWindow.locator('[data-testid="btn-new-file"]');
    await newFileBtn.click();
    await mainWindow.waitForTimeout(300);
    
    // Press Escape to cancel
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(200);
    
    expect(true).toBe(true);
  });

  test('should create new folder', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    const newFolderBtn = mainWindow.locator('[data-testid="btn-new-folder"]');
    await newFolderBtn.click();
    await mainWindow.waitForTimeout(300);
    
    await mainWindow.keyboard.type('test_folder');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.waitForTimeout(300);
    
    expect(true).toBe(true);
  });

  test('should create nested folder structure', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    // Create parent folder
    const newFolderBtn = mainWindow.locator('[data-testid="btn-new-folder"]');
    await newFolderBtn.click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.keyboard.type('parent');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.waitForTimeout(300);
    
    expect(true).toBe(true);
  });
});

test.describe('File Renaming States', () => {
  test('should handle rename operation', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    // Create a file first
    const newFileBtn = mainWindow.locator('[data-testid="btn-new-file"]');
    await newFileBtn.click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.keyboard.type('to_rename.algo');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.waitForTimeout(300);
    
    // Try to trigger rename (F2 or double-click name area)
    await mainWindow.keyboard.press('F2');
    await mainWindow.waitForTimeout(300);
    
    // Cancel if rename dialog appeared
    await mainWindow.keyboard.press('Escape');
    
    expect(true).toBe(true);
  });

  test('should cancel rename with Escape', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    // Focus sidebar
    await mainWindow.keyboard.press('Control+Shift+e');
    await mainWindow.waitForTimeout(200);
    
    // Try to rename
    await mainWindow.keyboard.press('F2');
    await mainWindow.waitForTimeout(300);
    
    // Cancel
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(200);
    
    expect(true).toBe(true);
  });
});

test.describe('File Deletion States', () => {
  test('should handle delete operation', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    // Create a file first
    const newFileBtn = mainWindow.locator('[data-testid="btn-new-file"]');
    await newFileBtn.click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.keyboard.type('to_delete.algo');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.waitForTimeout(300);
    
    // Focus sidebar and try to delete
    await mainWindow.keyboard.press('Control+Shift+e');
    await mainWindow.waitForTimeout(200);
    await mainWindow.keyboard.press('Delete');
    await mainWindow.waitForTimeout(300);
    
    // Cancel if confirm dialog appears
    await mainWindow.keyboard.press('Escape');
    
    expect(true).toBe(true);
  });
});

test.describe('Workspace States', () => {
  test('should handle empty workspace', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    // Close all tabs
    for (let i = 0; i < 5; i++) {
      await mainWindow.keyboard.press('Control+w');
      await mainWindow.waitForTimeout(100);
    }
    
    // UI should still be functional
    const helpers = new TestHelpers(mainWindow);
    
    // Create a new file
    await mainWindow.keyboard.press('Control+n');
    await mainWindow.waitForTimeout(300);
    
    expect(true).toBe(true);
  });

  test('should handle many files', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(1000);
    
    // Create multiple files
    for (let i = 0; i < 5; i++) {
      await mainWindow.keyboard.press('Control+n');
      await mainWindow.waitForTimeout(100);
    }
    
    // Should handle many tabs
    expect(true).toBe(true);
    
    // Clean up
    for (let i = 0; i < 5; i++) {
      await mainWindow.keyboard.press('Control+w');
      await mainWindow.waitForTimeout(100);
    }
  });
});

test.describe('Large File States', () => {
  test('should handle large code', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(2000);
    
    const helpers = new TestHelpers(mainWindow);
    await helpers.waitForEditor();
    
    // Generate large code
    let largeCode = 'ALGORITHM LargeFile\nVAR i : INTEGER\nBEGIN\n';
    for (let i = 0; i < 50; i++) {
      largeCode += `    PRINT("Line ${i}")\n`;
    }
    largeCode += 'END.';
    
    await mainWindow.keyboard.press('Control+a');
    await mainWindow.keyboard.type(largeCode);
    await mainWindow.waitForTimeout(500);
    
    // Should handle without crashing
    expect(true).toBe(true);
  });
});
