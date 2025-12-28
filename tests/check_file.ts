// Simple semantic test

import { Parser } from "../src/usdb-compiler/parser";
import { SemanticAnalyzer } from "../src/usdb-compiler/semantic";
import { CodeGenerator } from "../src/usdb-compiler/codegen";
import * as fs from "fs";

const file = process.argv[2];
if (!file) {
  console.log("Usage: npx ts-node tests/check_file.ts <file.algo>");
  process.exit(1);
}

const source = fs.readFileSync(file, "utf-8");

// Parse
const parser = new Parser();
const { ast, errors: parseErrors } = parser.parse(source);
if (parseErrors.length > 0 || !ast) {
  console.log("Parse errors:");
  parseErrors.forEach(e => console.log(e.toString()));
  process.exit(1);
}
console.log("✓ Parsed");

// Semantic
const semantic = new SemanticAnalyzer();
const { errors: semErrors } = semantic.analyze(ast);
const realErrors = semErrors.filter((e: any) => e.severity !== "warning");
if (realErrors.length > 0) {
  console.log("Semantic errors:");
  realErrors.forEach((e: any) => console.log(e.toString()));
  process.exit(1);
}
console.log("✓ Semantic OK");

// CodeGen
const codegen = new CodeGenerator();
const { code, errors: codeErrors } = codegen.generate(ast);
if (codeErrors.length > 0) {
  console.log("CodeGen errors:");
  codeErrors.forEach(e => console.log(e.toString()));
  process.exit(1);
}
console.log("✓ CodeGen OK");
console.log("\nGenerated C code (first 500 chars):");
console.log(code.substring(0, 500));
