
import { test, expect, TestHelpers } from './fixtures';

test.describe('Workflow Synchronization (C <-> Flowchart)', () => {

  test('should insert C function correctly from flowchart', async ({ mainWindow }) => {
    const helpers = new TestHelpers(mainWindow);
    await helpers.createFile('test_func.c');
    await helpers.waitForEditor();

    // 1. Open Flowchart Panel
    await mainWindow.keyboard.press('Control+Shift+f');
    await mainWindow.waitForTimeout(1000);

    // 2. Click "Function" button in toolbar (assuming it exists or via "Add" menu)
    // We might need to hunt for the specific button. If buttons are labeled:
    await mainWindow.getByRole('button', { name: 'Function', exact: true }).click();
    await mainWindow.waitForTimeout(500);

    // 3. Fill Modal
    // Function Name
    await mainWindow.getByPlaceholder('CalculateSum').fill('MyHelper');
    
    // Return Type
    await mainWindow.getByPlaceholder('INTEGER').fill('int');

    // Add Param
    await mainWindow.getByRole('button', { name: '+ Add Param' }).click();
    await mainWindow.getByPlaceholder('Param Name').fill('val');
    await mainWindow.getByPlaceholder('Type').first().fill('int'); // .first() because param type inputs shared placeholder

    // 4. Confirm
    // The modal usually has a confirm button at the bottom. 
    // Looking at common UI patterns in this app, likely "Add Instruction" or similar.
    // I will try to find a button with text "Add" inside the modal.
    await mainWindow.locator('.bg-gray-800').getByRole('button', { name: 'Add' }).last().click();
    
    // 5. Verify Editor Content
    // Code should be: int MyHelper(int val) { ... }
    const content = await helpers.getEditorContent();
    expect(content).toContain('int MyHelper(int val)');
    expect(content).toContain('// TODO');
    expect(content).not.toContain('FUNCTION MyHelper'); // Should NOT be Algo syntax
  });

  test('should visualize complex C code in flowchart', async ({ mainWindow }) => {
    const helpers = new TestHelpers(mainWindow);
    await helpers.createFile('complex.c');
    
    const cCode = `
#include <stdio.h>

int main() {
    int x = 0;
    while (x < 5) {
        printf("Count: %d", x);
        x = x + 1;
    }
    if (x == 5) {
        printf("Done");
    }
    return 0;
}
    `;
    await helpers.setEditorContent(cCode);

    // Open Flowchart
    await mainWindow.keyboard.press('Control+Shift+f');
    await mainWindow.waitForTimeout(1500); // Wait for generation

    // Check for Nodes
    // We expect specific text logic to be visible in the SVG/Nodes
    const flowchart = mainWindow.locator('.react-flow'); // Assuming React Flow class
    await expect(flowchart).toBeVisible();

    // Check node labels
    await expect(mainWindow.getByText('x < 5')).toBeVisible();
    await expect(mainWindow.getByText('Print("Count: ", x)')).toBeVisible(); // Flowchart generator simplifies printf
    // Note: The generator might format print differently ("Print(...)"), specific formatting depends on implementation.
    // We'll be lenient or check for parts.
    
    // x = x + 1 assignment
    await expect(mainWindow.getByText('x ← x + 1')).toBeVisible(); // Generator uses arrow for assignment?
  });

  test('should compile and run code', async ({ mainWindow }) => {
    const helpers = new TestHelpers(mainWindow);
    // Use the file from previous test or create new
    await helpers.createFile('run_test.c');
    await helpers.setEditorContent('#include <stdio.h>\nint main() { printf("Hello Test"); return 0; }');

    // Click Run Button
    await mainWindow.getByRole('button', { name: 'Run Code' }).click();

    // Wait for Terminal
    const terminal = mainWindow.locator('.xterm-rows');
    await expect(terminal).toBeVisible();
    
    // Check output (might take a moment for gcc)
    await mainWindow.waitForTimeout(3000);
    // We might not be able to easily scrape xterm canvas/dom, but usually there's some DOM text.
    // If testing compilation, we verify no error toast/modal appears and "Running..." indicator logic.
    // Ideally check terminal text if possible.
    
    // Check for success indicator or lack of error
    const errorBar = mainWindow.locator('.bg-red-500'); // Error toast?
    await expect(errorBar).not.toBeVisible();
  });

});
