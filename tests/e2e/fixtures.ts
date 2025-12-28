/**
 * Electron Test Fixtures for Playwright
 * Provides utilities to launch and interact with the C-Studio Electron app
 */

import { test as base, ElectronApplication, Page } from '@playwright/test';
import { _electron as electron } from 'playwright';
import * as path from 'path';

// Extended test fixture with Electron app
export const test = base.extend<{
  electronApp: ElectronApplication;
  mainWindow: Page;
}>({
  electronApp: async ({}, use) => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../.vite/build/main.js')],
      cwd: path.join(__dirname, '../..'),
    });

    // Use the app in tests
    await use(electronApp);

    // Close the app after tests
    await electronApp.close();
  },

  mainWindow: async ({ electronApp }, use) => {
    // Wait for the first window to open
    const window = await electronApp.firstWindow();
    
    // Wait for the app to be ready
    await window.waitForLoadState('domcontentloaded');
    
    // Wait longer for React and Monaco to fully render
    await window.waitForTimeout(3000);
    
    await use(window);
  },
});

export { expect } from '@playwright/test';

// Helper utilities
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the editor to be ready
   */
  async waitForEditor(): Promise<void> {
    await this.page.waitForSelector('.monaco-editor', { timeout: 10000 });
  }

  /**
   * Type code into the Monaco editor
   */
  async typeInEditor(code: string): Promise<void> {
    await this.waitForEditor();
    const editor = this.page.locator('.monaco-editor textarea');
    await editor.focus();
    await editor.fill(code);
  }

  /**
   * Get the current editor content
   */
  async getEditorContent(): Promise<string> {
    await this.waitForEditor();
    // Monaco stores content in a hidden textarea
    return await this.page.evaluate(() => {
      const monaco = (window as any).monaco;
      if (monaco) {
        const editors = monaco.editor.getEditors();
        if (editors.length > 0) {
          return editors[0].getValue();
        }
      }
      return '';
    });
  }

  /**
   * Click a toolbar button by its tooltip text
   */
  async clickToolbarButton(tooltip: string): Promise<void> {
    await this.page.click(`button[title*="${tooltip}"]`);
  }

  /**
   * Press a keyboard shortcut
   */
  async pressShortcut(shortcut: string): Promise<void> {
    await this.page.keyboard.press(shortcut);
  }

  /**
   * Wait for the flowchart panel to render
   */
  async waitForFlowchart(): Promise<void> {
    await this.page.waitForSelector('svg', { timeout: 10000 });
  }

  /**
   * Check if sidebar is visible
   */
  async isSidebarVisible(): Promise<boolean> {
    const sidebar = this.page.locator('[data-testid="sidebar"]');
    return await sidebar.isVisible();
  }

  /**
   * Create a new file via keyboard shortcut
   */
  async createNewFile(): Promise<void> {
    await this.pressShortcut('Control+n');
    await this.page.waitForTimeout(500);
  }

  /**
   * Save the current file
   */
  async saveFile(): Promise<void> {
    await this.pressShortcut('Control+s');
    await this.page.waitForTimeout(500);
  }

  /**
   * Run the current code
   */
  async runCode(): Promise<void> {
    await this.pressShortcut('F5');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for terminal output
   */
  async waitForTerminalOutput(text: string, timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      (t) => document.body.innerText.includes(t),
      text,
      { timeout }
    );
  }
}
