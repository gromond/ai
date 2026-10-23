// Practice — smoke tests (node tests/smoke.test.mjs)
import { readFileSync } from "node:fs";
import assert from "node:assert";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
let passed = 0; const check = (n, f) => { f(); passed++; console.log("✓ " + n); };

check("all core views exist", () => {
  for (const v of ["viewLanding","viewAuth","viewDashboard","viewClasses","viewSkill","viewTest","viewResult","viewProgress","viewInstructor","viewReview"])
    assert.ok(html.includes("function " + v), v + " missing");
});
check("four skills are wired into routing", () => {
  for (const s of ["reading","listening","speaking","writing"]) assert.ok(html.includes('"' + s + '"'), s);
});
check("auth hashes passwords (no plaintext storage)", () => {
  assert.ok(html.includes("crypto.subtle.digest"));
  assert.ok(!/passHash:\s*pw\b/.test(html));
});
check("speaking uses a real recorder, listening uses real playback", () => {
  assert.ok(html.includes("MediaRecorder") && html.includes("getUserMedia"));
  assert.ok(html.includes("speechSynthesis"));
});
check("writing autosaves drafts", () => assert.ok(html.includes("Draft saved")));
check("attempts are persisted and resumable", () => {
  assert.ok(html.includes("practice_v1") && html.includes("in_progress"));
});
check("instructor review is membership-gated", () => assert.ok(html.includes("Not your student")));
check("no lorem ipsum / placeholder copy", () => assert.ok(!/lorem ipsum/i.test(html)));
check("reduced-motion is respected", () => assert.ok(html.includes("prefers-reduced-motion")));
check("scores are labelled unofficial", () => assert.ok(/not (official )?ETS|unofficial/i.test(html)));
console.log("\n" + passed + " checks passed");
