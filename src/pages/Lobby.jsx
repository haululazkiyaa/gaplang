import "./Lobby.css";

import {
  joinGame,
  listenToGame,
  setPlayerReady,
  startGame,
} from "../services/gameService";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { authenticateUser } from "../services/firebase";

function Lobby() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [gameData, setGameData] = useState(null);
  const [currentPlayerNumber, setCurrentPlayerNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const initLobby = async () => {
      try {
        const user = await authenticateUser();

        // If coming from join game, join the game
        if (location.state?.playerName) {
          await joinGame(gameId, user.uid, location.state.playerName);
        }

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

          // Navigate to game if both players are ready and game started
          if (data.status === "playing") {
            navigate(`/game/${gameId}`);
          }
        });

        setLoading(false);
        return () => unsubscribe();
      } catch (error) {
        console.error("Error initializing lobby:", error);
        alert("Gagal join game: " + error.message);
        navigate("/");
      }
    };

    initLobby();
  }, [gameId, navigate, location]);

  const handleReady = async () => {
    if (!currentPlayerNumber) return;

    try {
      const newReadyState = !gameData.players?.[currentPlayerNumber]?.ready;
      await setPlayerReady(gameId, currentPlayerNumber, newReadyState);

      // If both players are ready, start the game
      if (
        newReadyState &&
        gameData.players?.player1?.ready &&
        gameData.players?.player2?.ready
      ) {
        setTimeout(() => {
          startGame(gameId);
        }, 1000);
      }
    } catch (error) {
      console.error("Error setting ready:", error);
      alert("Gagal mengubah status ready!");
    }
  };

  const copyGameLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="lobby-container">
        <div className="lobby-content">
          <div className="loading">⏳ Loading...</div>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return null;
  }

  const player1 = gameData.players?.player1;
  const player2 = gameData.players?.player2;
  const bothReady = player1?.ready && player2?.ready;

  return (
    <div className="lobby-container">
      <div className="lobby-content">
        <h2 className="lobby-title">🎮 Ruang Tunggu</h2>

        <div className="players-section">
          <div className={`player-card ${player1?.ready ? "ready" : ""}`}>
            <div className="player-icon">👤</div>
            <div className="player-name">{player1?.name || "Player 1"}</div>
            <div className="player-status">
              {player1?.ready ? "✓ Ready" : "⏳ Waiting..."}
            </div>
            {player1?.isHost && <div className="host-badge">👑 Host</div>}
          </div>

          <div className="vs-divider">VS</div>

          <div className={`player-card ${player2?.ready ? "ready" : ""}`}>
            <div className="player-icon">👤</div>
            <div className="player-name">
              {player2?.name || "Menunggu pemain..."}
            </div>
            <div className="player-status">
              {player2
                ? player2.ready
                  ? "✓ Ready"
                  : "⏳ Waiting..."
                : "❌ Belum join"}
            </div>
          </div>
        </div>

        {!player2 && currentPlayerNumber === "player1" && (
          <div className="share-section">
            <p className="share-label">Bagikan link ini ke temanmu:</p>
            <div className="link-container">
              <input
                type="text"
                className="game-link"
                value={window.location.href}
                readOnly
              />
              <button className="copy-btn" onClick={copyGameLink}>
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
            <p className="game-code">
              Kode Game: <strong>{gameId}</strong>
            </p>
          </div>
        )}

        {player2 && (
          <div className="ready-section">
            {!bothReady ? (
              <button
                className={`btn-ready ${
                  gameData.players[currentPlayerNumber]?.ready ? "ready" : ""
                }`}
                onClick={handleReady}
              >
                {gameData.players[currentPlayerNumber]?.ready
                  ? "✓ Ready!"
                  : "👍 Siap Main!"}
              </button>
            ) : (
              <div className="starting-game">
                <div className="spinner"></div>
                <p>🎮 Memulai permainan...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;
