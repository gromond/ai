// Practice — overall AI feedback endpoint (Vercel serverless function)
// AI is used ONLY for overall feedback after a session. It never grades
// objective questions: Reading/Listening scores are computed by the app
// and passed in only so the model can contextualise its feedback.
//
// Environment (server-only, set in Vercel Project Settings):
//   AI_FEEDBACK_API_KEY   — provider API key (required to enable feedback)
//   AI_FEEDBACK_API_URL   — OpenAI-compatible chat completions URL
//                           (default: https://api.openai.com/v1/chat/completions)
//   AI_FEEDBACK_MODEL     — model name (default: gpt-4o-mini)
//
// With no key configured this returns { available:false } and the client
// shows an honest fallback — fake feedback is never generated.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ available: false, error: "Method not allowed" });
    return;
  }
  const key = process.env.AI_FEEDBACK_API_KEY;
  if (!key) {
    res.status(200).json({ available: false, reason: "not_configured" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const skill = String(body.skill || "");
  const title = String(body.title || "Practice session").slice(0, 200);
  if (!["reading", "listening", "writing"].includes(skill)) {
    res.status(400).json({ available: false, error: "Unsupported skill for text feedback" });
    return;
  }

  const scoreNote = (typeof body.score === "number" && typeof body.total === "number")
    ? `The student scored ${body.score} out of ${body.total} on "${title}". This score was computed by the app — do not change, re-grade, or invent a different score.`
    : "";
  const missed = Array.isArray(body.missed) ? body.missed.slice(0, 10).map(s => String(s).slice(0, 200)) : [];
  const missedNote = missed.length ? `Questions they answered incorrectly were about: ${missed.join(" | ")}` : "";
  const writingNote = skill === "writing"
    ? `Writing prompt: ${String(body.prompt || "").slice(0, 1500)}\n\nStudent response:\n${String(body.response || "").slice(0, 6000)}`
    : "";

  const prompt = [
    "You are a supportive TOEFL tutor giving OVERALL feedback after a practice session.",
    "Be concise (120-180 words). Structure: 1) short summary, 2) strengths, 3) areas to improve, 4) 2-3 concrete next steps.",
    "Never present anything as an official TOEFL or ETS score. Do not invent scores.",
    scoreNote, missedNote, writingNote
  ].filter(Boolean).join("\n\n");

  try {
    const url = process.env.AI_FEEDBACK_API_URL || "https://api.openai.com/v1/chat/completions";
    const model = process.env.AI_FEEDBACK_MODEL || "gpt-4o-mini";
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 20000);
    const r = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 400, temperature: 0.5 })
    });
    clearTimeout(timeout);
    if (!r.ok) { res.status(200).json({ available: false, reason: "provider_error" }); return; }
    const data = await r.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) { res.status(200).json({ available: false, reason: "empty_response" }); return; }
    res.status(200).json({ available: true, feedback: String(text).slice(0, 4000) });
  } catch (e) {
    res.status(200).json({ available: false, reason: "unreachable" });
  }
}
