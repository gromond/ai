// Practice — scoring & seed-content integrity tests (node tests/scoring.test.mjs)
import { readFileSync } from "node:fs";
import assert from "node:assert";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

// Extract the CONTENT seed block and evaluate it in isolation
const start = html.indexOf("const CONTENT =");
const end = html.indexOf("const SKILLS =");
assert.ok(start > -1 && end > start, "CONTENT block found");
const CONTENT = new Function(html.slice(start, end) + "; return CONTENT;")();

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log("✓ " + name); };

// Objective scoring logic (same algorithm as the app)
function scoreObjective(test, answers){ let s=0; test.questions.forEach((q,i)=>{ if(Number(answers[i])===q.a) s++; }); return s; }

for (const skill of ["reading", "listening"]) {
  check(skill + " has at least 2 seed tests", () => assert.ok(CONTENT[skill].length >= 2));
  for (const t of CONTENT[skill]) {
    check(t.id + ": 5 questions, valid answer indexes, explanations", () => {
      assert.equal(t.questions.length, 5);
      for (const q of t.questions) { assert.ok(q.a >= 0 && q.a < q.opts.length); assert.ok(q.exp && q.exp.length > 10); assert.ok(q.opts.length >= 4); }
    });
    check(t.id + ": perfect answers score full marks", () => {
      const perfect = {}; t.questions.forEach((q, i) => perfect[i] = q.a);
      assert.equal(scoreObjective(t, perfect), t.questions.length);
    });
    check(t.id + ": empty answers score zero", () => assert.equal(scoreObjective(t, {}), 0));
  }
}
check("listening tests have playable scripts (TTS source text)", () => {
  for (const t of CONTENT.listening) assert.ok(t.script && t.script.length > 200);
});
check("speaking has prompts with prep/response times", () => {
  assert.ok(CONTENT.speaking.length >= 2);
  for (const t of CONTENT.speaking) { assert.ok(t.prompt.length > 40); assert.ok(t.seconds > 0 && t.prep >= 0); }
});
check("writing has prompts with time + min words", () => {
  assert.ok(CONTENT.writing.length >= 2);
  for (const t of CONTENT.writing) { assert.ok(t.prompt.length > 40); assert.ok(t.minutes > 0 && t.minWords > 0); }
});
console.log("\n" + passed + " checks passed");
