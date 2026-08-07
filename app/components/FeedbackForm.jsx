"use client";

import { useState } from "react";

export default function FeedbackForm({ sessionId }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!rating) { setError("Pick a star rating first."); return; }
    try {
      const res = await fetch(`/api/sessions/${sessionId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment }),
      });
      if (!res.ok) throw new Error("Couldn't submit feedback — try again.");
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    }
  }

  if (submitted) return <div className="success-box show">Thanks for the feedback — it helps the next cohort.</div>;

  return (
    <div>
      {error && <div className="errbox show">{error}</div>}
      <div className="star-row" style={{ marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`star-btn ${n <= (hover || rating) ? "filled" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star`}
          >★</button>
        ))}
      </div>
      <div className="field"><label>Name (optional)</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="field"><label>Comment (optional)</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} /></div>
      <button className="pill pill-ghost pill-sm" onClick={submit}>Submit feedback</button>
    </div>
  );
}
