import "./CreateWordPhase.css";

import { useCallback, useEffect, useState } from "react";

import { submitWord } from "../services/gameService";

function CreateWordPhase({
  gameId,
  currentRound,
  playerNumber,
  opponentNumber,
}) {
  const [word, setWord] = useState("");
  const [hint, setHint] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    if (!word.trim()) {
      return;
    }

    if (!hint.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await submitWord(
        gameId,
        currentRound,
        word.trim(),
        hint.trim(),
        playerNumber,
        opponentNumber
      );
    } catch (error) {
      console.error("Error submitting word:", error);
      setSubmitting(false);
    }
  }, [
    submitting,
    word,
    hint,
    gameId,
    currentRound,
    playerNumber,
    opponentNumber,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmit]);

  const timerColor =
    timeLeft > 15 ? "#50C878" : timeLeft > 5 ? "#FFD700" : "#FF6B6B";

  return (
    <div className="create-word-phase">
      <div className="timer-display" style={{ color: timerColor }}>
        ⏱️ {timeLeft} detik
      </div>

      <h2 className="phase-title">✏️ Buat Pertanyaan</h2>
      <p className="phase-subtitle">Buat kata yang sulit untuk temanmu!</p>

      <div className="input-group">
        <label className="input-label">Kata:</label>
        <input
          type="text"
          className="word-input"
          placeholder="Contoh: GALON"
          value={word}
          onChange={(e) => setWord(e.target.value.toUpperCase())}
          maxLength={20}
          disabled={submitting}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Hint/Petunjuk:</label>
        <textarea
          className="hint-input"
          placeholder="Contoh: Alat untuk menampung air minum"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          maxLength={100}
          rows={4}
          disabled={submitting}
        />
      </div>

      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={submitting || !word.trim() || !hint.trim()}
      >
        {submitting ? "⏳ Mengirim..." : "✓ Simpan"}
      </button>
    </div>
  );
}

export default CreateWordPhase;
