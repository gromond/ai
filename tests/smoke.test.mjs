// Practice (simplified) — smoke tests (node tests/smoke.test.mjs)
import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
let passed = 0; const check = (n, f) => { f(); passed++; console.log("✓ " + n); };

check("NO auth / accounts / classes anywhere", () => {
  for (const bad of ["viewAuth", "viewInstructor", "viewClasses", "Sign in", "Create your account", "class code", "passHash", "crypto.subtle"])
    assert.ok(!html.includes(bad), "found forbidden feature: " + bad);
});
check("all four skills reachable without login", () => {
  for (const s of ["reading", "listening", "speaking", "writing"]) {
    assert.ok(html.includes("#/skill/" + s) || html.includes('SKILL_LABEL'), s);
    assert.ok(html.includes('"' + s + '"'), s);
  }
});
check("core views exist", () => {
  for (const v of ["viewLanding", "viewSkill", "viewTest", "viewResult"])
    assert.ok(html.includes("function " + v), v);
});
check("results page requests overall AI feedback and handles its absence", () => {
  assert.ok(html.includes("/api/feedback"));
  assert.ok(html.includes("not configured"));
  assert.ok(html.includes("AI-generated"));
});
check("AI key is never referenced in client code", () => assert.ok(!html.includes("AI_FEEDBACK_API_KEY")));
check("feedback endpoint exists and is key-gated server-side", () => {
  const p = new URL("../api/feedback.js", import.meta.url);
  assert.ok(existsSync(p));
  const src = readFileSync(p, "utf8");
  assert.ok(src.includes("process.env.AI_FEEDBACK_API_KEY"));
  assert.ok(src.includes("available: false") || src.includes("available:false"));
});
check("speaking recorder + listening playback are real", () => {
  assert.ok(html.includes("MediaRecorder") && html.includes("getUserMedia"));
  assert.ok(html.includes("speechSynthesis"));
});
check("sessions persist locally and are resumable", () => assert.ok(html.includes("practice_simple_v1") && html.includes("in_progress")));
check("no fabricated scores claim / unofficial labelling", () => assert.ok(/unofficial/i.test(html) && !/lorem ipsum/i.test(html)));
check("reduced-motion respected", () => assert.ok(html.includes("prefers-reduced-motion")));
console.log("\n" + passed + " checks passed");
