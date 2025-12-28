
import { translateCToAlgo } from "../src/usdb-compiler/c-to-algo";

const sampleC = `
#include <stdio.h>

int main() {
    int x = 10;
    int y = 20;
    if (x < y) {
        printf("x is smaller");
    }
    return 0;
}
`;

console.log("Testing C to Algo Translation...");

const result = translateCToAlgo(sampleC);

if (result.success) {
    console.log("✅ Translation Successful");
    console.log("Generated Algo Code:\n" + result.algoCode);
    console.log("Source Map (Algo Line -> C Line):");
    result.sourceMap?.forEach((cLine, algoLine) => {
        console.log(`  Algo ${algoLine} -> C ${cLine}`);
    });
    
    // Simple assertions
    if (!result.algoCode.includes("ALGORITHM TranslatedProgram")) throw new Error("Missing Algorithm header");
    if (!result.algoCode.includes("BEGIN")) throw new Error("Missing BEGIN");
    if (!result.sourceMap || result.sourceMap.length === 0) throw new Error("Empty Source Map");
    
    console.log("✅ All checks passed");
} else {
    console.error("❌ Translation Failed:", result.errors);
    process.exit(1);
}
