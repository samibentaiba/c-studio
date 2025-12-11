// Simple test script for USDB Algo compiler
// Run with: npx ts-node tests/run_tests.ts

import { Parser } from "../src/usdb-compiler/parser";
import { SemanticAnalyzer } from "../src/usdb-compiler/semantic";
import { CodeGenerator } from "../src/usdb-compiler/codegen";
import * as fs from "fs";
import * as path from "path";

const testFiles = [
  "test1_hello.algo",
  "test2_variables.algo",
  "test3_arithmetic.algo",
  "test4_loops.algo",
  "test5_structures.algo",
  "test6_functions.algo",
];

function compile(source: string): {
  success: boolean;
  cCode?: string;
  errors: string[];
} {
  const parser = new Parser();
  const { ast, errors: parseErrors } = parser.parse(source);

  if (parseErrors.length > 0 || !ast) {
    return { success: false, errors: parseErrors.map((e) => e.toString()) };
  }

  const semanticAnalyzer = new SemanticAnalyzer();
  const { errors: semanticErrors } = semanticAnalyzer.analyze(ast);
  const errors = semanticErrors.filter((e: any) => e.severity !== "warning");

  if (errors.length > 0) {
    return { success: false, errors: errors.map((e: any) => e.toString()) };
  }

  const codeGenerator = new CodeGenerator();
  const { code, errors: codeGenErrors } = codeGenerator.generate(ast);

  if (codeGenErrors.length > 0) {
    return { success: false, errors: codeGenErrors.map((e) => e.toString()) };
  }

  return { success: true, cCode: code, errors: [] };
}

console.log("=== USDB Algo Compiler Test Suite ===\n");

let passed = 0;
let failed = 0;

for (const testFile of testFiles) {
  const filePath = path.join(__dirname, testFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${testFile}: File not found`);
    failed++;
    continue;
  }

  const source = fs.readFileSync(filePath, "utf-8");
  const result = compile(source);

  if (result.success) {
    console.log(`✅ ${testFile}: Compiled successfully`);
    passed++;
  } else {
    console.log(`❌ ${testFile}: Compilation failed`);
    result.errors.forEach((e) => console.log(`   ${e}`));
    failed++;
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
