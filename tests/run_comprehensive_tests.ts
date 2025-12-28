// Comprehensive test runner - runs ALL test files and edge cases
// Tests parsing, semantic analysis, and code generation

import { Parser } from "../src/usdb-compiler/parser";
import { SemanticAnalyzer } from "../src/usdb-compiler/semantic";
import { CodeGenerator } from "../src/usdb-compiler/codegen";
import * as fs from "fs";
import * as path from "path";

interface TestResult {
  file: string;
  category: string;
  parsed: boolean;
  semantic: boolean;
  codeGen: boolean;
  errors: string[];
  warnings: string[];
}

function testFile(filePath: string): TestResult {
  const result: TestResult = {
    file: path.basename(filePath),
    category: path.basename(path.dirname(filePath)),
    parsed: false,
    semantic: false,
    codeGen: false,
    errors: [],
    warnings: [],
  };

  try {
    const source = fs.readFileSync(filePath, "utf-8");

    // Parse
    const parser = new Parser();
    const { ast, errors: parseErrors } = parser.parse(source);

    if (parseErrors.length > 0) {
      result.errors.push(...parseErrors.map((e) => `Parse: ${e.toString()}`));
      return result;
    }
    if (!ast) {
      result.errors.push("Parse: No AST generated");
      return result;
    }
    result.parsed = true;

    // Semantic analysis
    const semanticAnalyzer = new SemanticAnalyzer();
    const { errors: semanticErrors } = semanticAnalyzer.analyze(ast);
    
    const errors = semanticErrors.filter((e: any) => e.severity !== "warning");
    const warnings = semanticErrors.filter((e: any) => e.severity === "warning");
    
    result.warnings.push(...warnings.map((w: any) => `Warning: ${w.toString()}`));

    if (errors.length > 0) {
      result.errors.push(...errors.map((e: any) => `Semantic: ${e.toString()}`));
      return result;
    }
    result.semantic = true;

    // Code generation
    const codeGenerator = new CodeGenerator();
    const { code, errors: codeGenErrors } = codeGenerator.generate(ast);

    if (codeGenErrors.length > 0) {
      result.errors.push(...codeGenErrors.map((e) => `CodeGen: ${e.toString()}`));
      return result;
    }
    result.codeGen = true;

  } catch (e: any) {
    result.errors.push(`Exception: ${e.message}`);
  }

  return result;
}

function findAlgoFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findAlgoFiles(fullPath));
    } else if (entry.name.endsWith(".algo")) {
      files.push(fullPath);
    }
  }
  return files;
}

// Categories of tests
const testCategories = [
  { name: "Original Tests", path: path.join(__dirname) },
  { name: "Algorithm Templates", path: path.join(__dirname, "../src/templates/algorithms") },
  { name: "Edge Cases", path: path.join(__dirname, "edge_cases") },
];

console.log("=".repeat(70));
console.log("  C-STUDIO COMPREHENSIVE TEST SUITE");
console.log("=".repeat(70));
console.log("");

const allResults: TestResult[] = [];
let totalPassed = 0;
let totalFailed = 0;

for (const category of testCategories) {
  const files = findAlgoFiles(category.path);
  if (files.length === 0) continue;
  
  console.log(`\n📁 ${category.name} (${files.length} files)`);
  console.log("-".repeat(50));
  
  let categoryPassed = 0;
  let categoryFailed = 0;
  
  for (const file of files) {
    const result = testFile(file);
    allResults.push(result);
    
    if (result.codeGen) {
      console.log(`  ✅ ${result.file}`);
      categoryPassed++;
      totalPassed++;
    } else {
      console.log(`  ❌ ${result.file}`);
      result.errors.forEach(e => console.log(`     └─ ${e}`));
      categoryFailed++;
      totalFailed++;
    }
  }
  
  console.log(`  📊 ${categoryPassed}/${files.length} passed`);
}

console.log("\n" + "=".repeat(70));
console.log(`  FINAL RESULTS: ${totalPassed} passed, ${totalFailed} failed`);
console.log("=".repeat(70));

// Summary by category
console.log("\n📈 Summary by Category:");
const categories = [...new Set(allResults.map(r => r.category))];
for (const cat of categories) {
  const catResults = allResults.filter(r => r.category === cat);
  const passed = catResults.filter(r => r.codeGen).length;
  const total = catResults.length;
  const status = passed === total ? "✅" : "⚠️";
  console.log(`  ${status} ${cat}: ${passed}/${total}`);
}

// If any failures, show details
if (totalFailed > 0) {
  console.log("\n🔍 Detailed Failures:");
  for (const result of allResults.filter(r => !r.codeGen)) {
    console.log(`\n  ${result.category}/${result.file}:`);
    console.log(`    Parsed: ${result.parsed ? "✓" : "✗"}`);
    console.log(`    Semantic: ${result.semantic ? "✓" : "✗"}`);
    console.log(`    CodeGen: ${result.codeGen ? "✓" : "✗"}`);
    result.errors.forEach(e => console.log(`    Error: ${e}`));
  }
}

process.exit(totalFailed > 0 ? 1 : 0);
