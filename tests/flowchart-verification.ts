
import { generateAllFlowcharts } from "../src/usdb-compiler/flowchart-generator";

const sampleAlgo = `
ALGORITHM Test
VAR
    x : INTEGER
BEGIN
    x <- 10
    PRINT(x)
END.
`;

console.log("Testing Flowchart Generation...");

const result = generateAllFlowcharts(sampleAlgo, "algo");

if (result.success) {
    console.log("✅ Algo Flowchart Generation Successful");
    if (!result.main) throw new Error("No main flowchart");
    // Check if nodes have spans
    const processNode = result.main.nodes.find(n => n.type === 'process');
    if (processNode && processNode.span) {
        console.log("✅ Node has span info:", processNode.span);
    } else if (processNode) {
        console.warn("⚠️ Node missing span info");
    }
} else {
    console.error("❌ Algo Flowchart Generation Failed:", result.error);
    process.exit(1);
}

// Test with C code (implies c-to-algo)
const sampleC = `
#include <stdio.h>
int main() {
    printf("Hello");
    return 0;
}
`;

console.log("Testing C -> Flowchart Generation...");
const cResult = generateAllFlowcharts(sampleC, "c");
if (cResult.success) {
    console.log("✅ C Flowchart Generation Successful");
    if (cResult.sourceMap && cResult.sourceMap.length > 0) {
        console.log("✅ Source Map present");
    } else {
        console.error("❌ Link to Source Map missing or empty");
    }
} else {
    console.error("❌ C Flowchart Generation Failed:", cResult.error);
    process.exit(1);
}
