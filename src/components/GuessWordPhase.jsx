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
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);

  const targetWord = roundData.word.toUpperCase();
  const wordLength = targetWord.length;

  // Initialize guessed letters with free hints
  useEffect(() => {
    const freeHints = currentWord?.freeHints || [];

    if (freeHints.length > 0 && guessedLetters.length === 0) {
      const initialGuesses = new Array(wordLength).fill("");

      // Fill in the free hints
      freeHints.forEach((hint) => {
        if (hint.index < wordLength) {
          initialGuesses[hint.index] = hint.letter;
        }
      });

      setGuessedLetters(initialGuesses);

      // Also add these to revealed letters for styling
      setRevealedLetters(
        freeHints.map((hint) => ({
          index: hint.index,
          letter: hint.letter,
          isFree: true,
        }))
      );
    }
  }, [currentWord?.freeHints, wordLength, guessedLetters.length]);

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
            // Use completeRound for guessing phase timeout
            // This marks the round as failed and moves to next turn
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
    // Check if all positions are filled (including free hints)
    const filledCount = guessedLetters.filter((letter) => letter).length;
    if (filledCount === wordLength) {
      checkAnswer(guessedLetters);
    }
  }, [guessedLetters, wordLength, checkAnswer]);

  const handleLetterClick = (letter) => {
    if (completing) return;

    // Find the first empty position (not filled and not a free hint)
    const newGuessed = [...guessedLetters];
    for (let i = 0; i < wordLength; i++) {
      if (!newGuessed[i]) {
        newGuessed[i] = letter;
        break;
      }
    }

    setGuessedLetters(newGuessed);
  };

  const handleBackspace = () => {
    if (completing) return;

    const newGuessed = [...guessedLetters];

    // Find the last filled position that is not a free hint and remove it
    for (let i = wordLength - 1; i >= 0; i--) {
      const isRevealedFreeHint = revealedLetters.some(
        (r) => r.index === i && r.isFree
      );

      if (newGuessed[i] && !isRevealedFreeHint) {
        newGuessed[i] = "";
        break;
      }
    }

    setGuessedLetters(newGuessed);
  };

  const handleUseHint = async () => {
    if (completing) return;
    if (revealedLetters.length >= wordLength) return;

    try {
      const word = await getHint(gameId, currentRound);

      // Find the next empty position that doesn't have a free hint
      let nextIndex = -1;
      for (let i = 0; i < wordLength; i++) {
        const hasRevealedLetter = revealedLetters.some((r) => r.index === i);
        if (!hasRevealedLetter) {
          nextIndex = i;
          break;
        }
      }

      if (nextIndex === -1) return; // No more hints available

      const correctLetter = word.toUpperCase()[nextIndex];

      setRevealedLetters([
        ...revealedLetters,
        { index: nextIndex, letter: correctLetter, isFree: false },
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

  const handleSurrender = () => {
    if (completing) return;
    setShowSurrenderModal(true);
  };

  const confirmSurrender = async () => {
    if (completing) return;

    setShowSurrenderModal(false);
    setCompleting(true);

    try {
      await completeRound(
        gameId,
        currentRound,
        "",
        false,
        hintsUsed,
        playerNumber
      );
    } catch (error) {
      console.error("Error surrendering:", error);
      setCompleting(false);
    }
  };

  const cancelSurrender = () => {
    setShowSurrenderModal(false);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Escape" && showSurrenderModal) {
        cancelSurrender();
      }
    };

    if (showSurrenderModal) {
      document.addEventListener("keydown", handleKeyPress);
      return () => {
        document.removeEventListener("keydown", handleKeyPress);
      };
    }
  }, [showSurrenderModal]);

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
        {currentWord?.freeHints && currentWord.freeHints.length > 0 && (
          <div className="free-hints-info">
            ✨ {currentWord.freeHints.length} huruf gratis sudah diberikan!
          </div>
        )}
      </div>

      <div className="answer-section">
        <div className="answer-boxes">
          {Array.from({ length: wordLength }).map((_, index) => {
            const revealed = revealedLetters.find((r) => r.index === index);
            const letter = guessedLetters[index] || "";
            const isFreeHint = revealed?.isFree || false;

            return (
              <div
                key={index}
                className={`answer-box ${letter ? "filled" : ""} ${
                  revealed ? "revealed" : ""
                } ${isFreeHint ? "free-hint" : ""}`}
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
        <button
          className="surrender-btn"
          onClick={handleSurrender}
          disabled={completing}
        >
          🏳️ Menyerah
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

      {showSurrenderModal && (
        <div className="surrender-modal-overlay">
          <div className="surrender-modal">
            <div className="surrender-modal-header">
              <h3>🏳️ Konfirmasi Menyerah</h3>
            </div>
            <div className="surrender-modal-body">
              <p>Apakah kamu yakin ingin menyerah?</p>
              <p className="surrender-warning">
                Kamu akan mendapat 0 poin untuk ronde ini.
              </p>
            </div>
            <div className="surrender-modal-footer">
              <button
                className="surrender-confirm-btn"
                onClick={confirmSurrender}
              >
                ✓ Ya, Menyerah
              </button>
              <button
                className="surrender-cancel-btn"
                onClick={cancelSurrender}
              >
                ✕ Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuessWordPhase;
