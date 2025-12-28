// Comprehensive test script for all algorithm templates
// Run with: npx ts-node tests/test_algorithms.ts

import { Parser } from "../src/usdb-compiler/parser";
import { SemanticAnalyzer } from "../src/usdb-compiler/semantic";
import { CodeGenerator } from "../src/usdb-compiler/codegen";
import * as fs from "fs";
import * as path from "path";

interface TestResult {
  file: string;
  parsed: boolean;
  semantic: boolean;
  codeGen: boolean;
  errors: string[];
  warnings: string[];
  cCode?: string;
}

function testFile(filePath: string): TestResult {
  const result: TestResult = {
    file: path.basename(filePath),
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
    result.cCode = code;

  } catch (e: any) {
    result.errors.push(`Exception: ${e.message}`);
  }

  return result;
}

function findAlgoFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

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

// Main test execution
console.log("=".repeat(60));
console.log("  C-Studio Algorithm Template Test Suite");
console.log("=".repeat(60));
console.log("");

// Find all template files
const templatesDir = path.join(__dirname, "../src/templates/algorithms");
const testFilesDir = path.join(__dirname);
const algoFiles = [
  ...findAlgoFiles(templatesDir),
  ...findAlgoFiles(testFilesDir).filter(f => f.includes("test")),
];

console.log(`Found ${algoFiles.length} algorithm files to test\n`);

let passed = 0;
let failed = 0;
const results: TestResult[] = [];

for (const file of algoFiles) {
  const result = testFile(file);
  results.push(result);
  
  const relPath = path.relative(path.join(__dirname, ".."), file);
  
  if (result.codeGen) {
    console.log(`✅ PASS: ${relPath}`);
    passed++;
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.log(`   ⚠️ ${w}`));
    }
  } else {
    console.log(`❌ FAIL: ${relPath}`);
    result.errors.forEach(e => console.log(`   ❌ ${e}`));
    failed++;
  }
}

console.log("\n" + "=".repeat(60));
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60));

// Detailed report for failures
if (failed > 0) {
  console.log("\n--- Detailed Failure Report ---\n");
  for (const result of results.filter(r => !r.codeGen)) {
    console.log(`File: ${result.file}`);
    console.log(`  Parsed: ${result.parsed ? "✓" : "✗"}`);
    console.log(`  Semantic: ${result.semantic ? "✓" : "✗"}`);
    console.log(`  CodeGen: ${result.codeGen ? "✓" : "✗"}`);
    console.log(`  Errors:`);
    result.errors.forEach(e => console.log(`    - ${e}`));
    console.log("");
  }
}

// Show sample generated C code
console.log("\n--- Sample Generated C Code ---\n");
const sampleResult = results.find(r => r.codeGen && r.file.includes("factorial"));
if (sampleResult && sampleResult.cCode) {
  console.log(`From: ${sampleResult.file}`);
  console.log("-".repeat(40));
  console.log(sampleResult.cCode.substring(0, 1500));
  console.log("...");
}

process.exit(failed > 0 ? 1 : 0);
