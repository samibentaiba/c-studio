// Quick test of specific file

import { Parser } from "../src/usdb-compiler/parser";
import * as fs from "fs";

const filePath = process.argv[2] || "src/templates/algorithms/datastructures/queue.algo";
console.log("Testing:", filePath);

const source = fs.readFileSync(filePath, "utf-8");
const parser = new Parser();
const { ast, errors } = parser.parse(source);

if (errors.length > 0) {
  console.log("Parse errors:");
  errors.forEach(e => console.log(e.toString()));
} else {
  console.log("Parsed successfully!");
}
