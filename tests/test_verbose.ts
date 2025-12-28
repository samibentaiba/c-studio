// Comprehensive test script for all algorithm templates with detailed output
// Run with: npx ts-node tests/test_verbose.ts

import { Parser } from "../src/usdb-compiler/parser";
import { SemanticAnalyzer } from "../src/usdb-compiler/semantic";
import { CodeGenerator } from "../src/usdb-compiler/codegen";
import * as fs from "fs";
import * as path from "path";

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

const templatesDir = path.join(__dirname, "../src/templates/algorithms");
const algoFiles = findAlgoFiles(templatesDir);

console.log("Testing", algoFiles.length, "algorithm templates\n");

for (const file of algoFiles) {
  const relPath = path.relative(path.join(__dirname, ".."), file);
  const source = fs.readFileSync(file, "utf-8");
  
  const parser = new Parser();
  const { ast, errors: parseErrors } = parser.parse(source);
  
  if (parseErrors.length > 0) {
    console.log(`❌ ${relPath}`);
    parseErrors.forEach(e => console.log(`   Parse: ${e.toString()}`));
    continue;
  }
  if (!ast) {
    console.log(`❌ ${relPath} - No AST`);
    continue;
  }
  
  const semantic = new SemanticAnalyzer();
  const { errors: semErrors } = semantic.analyze(ast);
  const realErrors = semErrors.filter((e: any) => e.severity !== "warning");
  
  if (realErrors.length > 0) {
    console.log(`❌ ${relPath}`);
    realErrors.forEach((e: any) => console.log(`   Semantic: ${e.toString()}`));
    continue;
  }
  
  const codegen = new CodeGenerator();
  const { errors: codeErrors } = codegen.generate(ast);
  
  if (codeErrors.length > 0) {
    console.log(`❌ ${relPath}`);
    codeErrors.forEach(e => console.log(`   CodeGen: ${e.toString()}`));
    continue;
  }
  
  console.log(`✅ ${relPath}`);
}
