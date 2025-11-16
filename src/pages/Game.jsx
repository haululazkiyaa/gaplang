import "./Game.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CreateWordPhase from "../components/CreateWordPhase";
import GuessWordPhase from "../components/GuessWordPhase";
import WaitingPhase from "../components/WaitingPhase";
import { authenticateUser } from "../services/firebase";
import { listenToGame } from "../services/gameService";

function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [currentPlayerNumber, setCurrentPlayerNumber] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initGame = async () => {
      try {
        const user = await authenticateUser();

        // Listen to game changes
        const unsubscribe = listenToGame(gameId, (data) => {
          if (!data) {
            alert("Game tidak ditemukan!");
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

          // Navigate to game over if finished
          if (data.status === "finished") {
            navigate(`/gameover/${gameId}`);
          }
        });

        setLoading(false);
        return () => unsubscribe();
      } catch (error) {
        console.error("Error initializing game:", error);
        alert("Gagal memuat game!");
        navigate("/");
      }
    };

    initGame();
  }, [gameId, navigate]);

  // Handle auto-transition for skipped rounds
  useEffect(() => {
    const roundData = gameData?.rounds?.[`round${gameData?.currentRound}`];
    if (roundData?.status === "skipped") {
      const skipTimeout = setTimeout(() => {
        // The skipRound function already handles moving to next round
        // The UI will automatically update via the listenToGame listener
        console.log("Skip message displayed for 3 seconds");
      }, 3000);

      return () => clearTimeout(skipTimeout);
    }
  }, [gameData?.rounds, gameData?.currentRound]);

  if (loading || !gameData || !currentPlayerNumber) {
    return (
      <div className="game-container">
        <div className="loading">⏳ Loading game...</div>
      </div>
    );
  }

  const currentRound = gameData.currentRound;
  const roundData = gameData.rounds?.[`round${currentRound}`];
  const isMyTurnToCreate = gameData.currentTurn === currentPlayerNumber;
  const amIGuesser = roundData?.guesser === currentPlayerNumber;

  // Determine which phase to show
  let phaseComponent;

  if (!roundData || roundData.status === "pending") {
    // Create word phase
    if (isMyTurnToCreate) {
      phaseComponent = (
        <CreateWordPhase
          gameId={gameId}
          currentRound={currentRound}
          playerNumber={currentPlayerNumber}
          opponentNumber={
            currentPlayerNumber === "player1" ? "player2" : "player1"
          }
        />
      );
    } else {
      phaseComponent = (
        <WaitingPhase
          message={`${
            gameData.players?.[gameData.currentTurn]?.name || "Pemain"
          } sedang membuat pertanyaan...`}
          icon="✏️"
        />
      );
    }
  } else if (roundData.status === "inProgress") {
    // Guess word phase
    if (amIGuesser) {
      phaseComponent = (
        <GuessWordPhase
          gameId={gameId}
          currentRound={currentRound}
          playerNumber={currentPlayerNumber}
          roundData={roundData}
          currentWord={gameData.currentWord}
        />
      );
    } else {
      phaseComponent = (
        <WaitingPhase
          message={`${
            gameData.players?.[roundData.guesser]?.name || "Pemain"
          } sedang menebak...`}
          icon="🤔"
        />
      );
    }
  } else if (roundData.status === "skipped") {
    // Round was skipped due to timeout
    phaseComponent = (
      <WaitingPhase
        message={`⏱️ Waktu habis! Ronde ${currentRound} dilewati. Lanjut ke ronde berikutnya...`}
        icon="⏭️"
      />
    );
  } else {
    // Between rounds or completed
    phaseComponent = (
      <WaitingPhase message="Memulai ronde berikutnya..." icon="⏭️" />
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="round-info">Ronde {currentRound}/10</div>
        <div className="score-info">
          <div className="score-item">
            <span className="score-label">
              {gameData.players?.player1?.name || "Player 1"}
            </span>
            <span className="score-value">
              {gameData.players?.player1?.score || 0}
            </span>
          </div>
          <div className="score-divider">-</div>
          <div className="score-item">
            <span className="score-label">
              {gameData.players?.player2?.name || "Player 2"}
            </span>
            <span className="score-value">
              {gameData.players?.player2?.score || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="game-content">{phaseComponent}</div>
    </div>
  );
}

export default Game;
