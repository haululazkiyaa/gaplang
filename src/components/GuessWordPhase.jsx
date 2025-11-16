import "./GuessWordPhase.css";

import { completeRound, useHint as getHint } from "../services/gameService";
import { useCallback, useEffect, useState } from "react";

function GuessWordPhase({
  gameId,
  currentRound,
  playerNumber,
  roundData,
  currentWord,
}) {
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedLetters, setRevealedLetters] = useState([]);
  const [completing, setCompleting] = useState(false);

  const targetWord = roundData.word.toUpperCase();
  const wordLength = targetWord.length;

  const checkAnswer = useCallback(
    async (letters) => {
      if (completing) return;

      const guessedWord = letters.join("");

      if (guessedWord.length === wordLength) {
        setCompleting(true);
        const isCorrect = guessedWord === targetWord;

        if (isCorrect) {
          // Show success animation
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        try {
          await completeRound(
            gameId,
            currentRound,
            guessedWord,
            isCorrect,
            hintsUsed,
            playerNumber
          );
        } catch (error) {
          console.error("Error completing round:", error);
          setCompleting(false);
        }
      }
    },
    [
      completing,
      wordLength,
      targetWord,
      gameId,
      currentRound,
      hintsUsed,
      playerNumber,
    ]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!completing) {
            completeRound(
              gameId,
              currentRound,
              "",
              false,
              hintsUsed,
              playerNumber
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameId, currentRound, hintsUsed, playerNumber, completing]);

  useEffect(() => {
    if (guessedLetters.length === wordLength) {
      checkAnswer(guessedLetters);
    }
  }, [guessedLetters, wordLength, checkAnswer]);

  const handleLetterClick = (letter) => {
    if (completing) return;
    if (guessedLetters.length >= wordLength) return;

    setGuessedLetters([...guessedLetters, letter]);
  };

  const handleBackspace = () => {
    if (completing) return;
    if (guessedLetters.length === 0) return;

    setGuessedLetters(guessedLetters.slice(0, -1));
  };

  const handleUseHint = async () => {
    if (completing) return;
    if (revealedLetters.length >= wordLength) return;

    try {
      const word = await getHint(gameId, currentRound);
      const nextIndex = revealedLetters.length;
      const correctLetter = word.toUpperCase()[nextIndex];

      setRevealedLetters([
        ...revealedLetters,
        { index: nextIndex, letter: correctLetter },
      ]);

      // Auto-fill the revealed letter
      const newGuessed = [...guessedLetters];
      newGuessed[nextIndex] = correctLetter;
      setGuessedLetters(newGuessed);

      setHintsUsed(hintsUsed + 1);
    } catch (error) {
      console.error("Error using hint:", error);
    }
  };

  const timerColor =
    timeLeft > 60 ? "#50C878" : timeLeft > 20 ? "#FFD700" : "#FF6B6B";
  const gridSize = currentWord?.gridSize || "5x5";
  const [cols] = gridSize.split("x").map(Number);

  return (
    <div className="guess-word-phase">
      <div className="timer-display" style={{ color: timerColor }}>
        ⏱️ {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </div>

      <div className="hint-section">
        <div className="hint-label">💡 Hint:</div>
        <div className="hint-text">{currentWord?.hint || roundData.hint}</div>
      </div>

      <div className="answer-section">
        <div className="answer-boxes">
          {Array.from({ length: wordLength }).map((_, index) => {
            const revealed = revealedLetters.find((r) => r.index === index);
            const letter = guessedLetters[index] || "";

            return (
              <div
                key={index}
                className={`answer-box ${letter ? "filled" : ""} ${
                  revealed ? "revealed" : ""
                }`}
              >
                {letter}
              </div>
            );
          })}
        </div>

        {guessedLetters.length > 0 && (
          <button
            className="backspace-btn"
            onClick={handleBackspace}
            disabled={completing}
          >
            ← Hapus
          </button>
        )}
      </div>

      <div
        className="letter-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {currentWord?.letters?.map((letter, index) => (
          <button
            key={index}
            className="letter-btn"
            onClick={() => handleLetterClick(letter)}
            disabled={completing}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="hint-button-section">
        <button
          className="hint-btn"
          onClick={handleUseHint}
          disabled={completing || revealedLetters.length >= wordLength}
        >
          💡 Gunakan Hint (-10 poin)
        </button>
        {hintsUsed > 0 && (
          <div className="hints-used">Hint digunakan: {hintsUsed}x</div>
        )}
      </div>

      {completing && guessedLetters.join("") === targetWord && (
        <div className="success-overlay">
          <div className="success-message">🎉 Benar! 🎉</div>
        </div>
      )}
    </div>
  );
}

export default GuessWordPhase;
