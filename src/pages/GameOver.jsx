import "./GameOver.css";

import { listenToGame, resetGame } from "../services/gameService";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { authenticateUser } from "../services/firebase";

function GameOver() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [currentPlayerNumber, setCurrentPlayerNumber] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initGameOver = async () => {
      try {
        const user = await authenticateUser();

        // Listen to game changes
        const unsubscribe = listenToGame(gameId, (data) => {
          if (!data) {
            navigate("/");
            return;
          }

          setGameData(data);

          // Determine current player number
          if (data.players?.player1?.id === user.uid) {
            setCurrentPlayerNumber("player1");
          } else if (data.players?.player2?.id === user.uid) {
            setCurrentPlayerNumber("player2");
          }

          // Navigate back to lobby if game is reset
          if (data.status === "waiting") {
            navigate(`/lobby/${gameId}`);
          }
        });

        setLoading(false);
        return () => unsubscribe();
      } catch (error) {
        console.error("Error initializing game over:", error);
        navigate("/");
      }
    };

    initGameOver();
  }, [gameId, navigate]);

  const handlePlayAgain = async () => {
    try {
      await resetGame(gameId);
    } catch (error) {
      console.error("Error resetting game:", error);
      alert("Gagal reset game!");
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  if (loading || !gameData) {
    return (
      <div className="gameover-container">
        <div className="loading">⏳ Loading...</div>
      </div>
    );
  }

  const player1 = gameData.players?.player1;
  const player2 = gameData.players?.player2;

  if (!player1 || !player2) {
    return (
      <div className="gameover-container">
        <div className="loading">⏳ Loading data pemain...</div>
      </div>
    );
  }

  const winner =
    player1.score > player2.score
      ? player1
      : player2.score > player1.score
      ? player2
      : null;
  const isDraw = player1.score === player2.score;

  // Calculate statistics
  const calculateStats = (playerNumber) => {
    let correct = 0;
    let hintsUsed = 0;

    Object.values(gameData.rounds || {}).forEach((round) => {
      if (round.guesser === playerNumber && round.score > 0) {
        correct++;
        hintsUsed += round.hintsUsed || 0;
      }
    });

    return { correct, hintsUsed };
  };

  const stats1 = calculateStats("player1");
  const stats2 = calculateStats("player2");

  return (
    <div className="gameover-container">
      <div className="gameover-content">
        <div className="confetti">🎉</div>
        <h1 className="gameover-title">GAME OVER</h1>

        {!isDraw ? (
          <div className="winner-section">
            <div className="winner-badge">👑</div>
            <h2 className="winner-name">{winner?.name}</h2>
            <p className="winner-label">Pemenang!</p>
            <div className="winner-score">{winner?.score} Poin</div>
          </div>
        ) : (
          <div className="winner-section">
            <div className="winner-badge">🤝</div>
            <h2 className="winner-name">SERI!</h2>
            <p className="winner-label">Sama-sama Hebat!</p>
          </div>
        )}

        <div className="stats-section">
          <h3 className="stats-title">Statistik Permainan</h3>

          <div className="player-stats">
            <div
              className={`stat-card ${
                currentPlayerNumber === "player1" ? "highlight" : ""
              }`}
            >
              <div className="stat-player-name">{player1.name}</div>
              <div className="stat-score">{player1.score} poin</div>
              <div className="stat-details">
                <div className="stat-item">
                  <span className="stat-label">Benar:</span>
                  <span className="stat-value">{stats1.correct}/5</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Hint:</span>
                  <span className="stat-value">{stats1.hintsUsed}x</span>
                </div>
              </div>
            </div>

            <div
              className={`stat-card ${
                currentPlayerNumber === "player2" ? "highlight" : ""
              }`}
            >
              <div className="stat-player-name">{player2.name}</div>
              <div className="stat-score">{player2.score} poin</div>
              <div className="stat-details">
                <div className="stat-item">
                  <span className="stat-label">Benar:</span>
                  <span className="stat-value">{stats2.correct}/5</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Hint:</span>
                  <span className="stat-value">{stats2.hintsUsed}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="button-section">
          <button className="btn btn-primary" onClick={handlePlayAgain}>
            🔄 Main Lagi
          </button>
          <button className="btn btn-secondary" onClick={handleGoHome}>
            🏠 Kembali ke Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOver;
