import "./Home.css";

import { authenticateUser } from "../services/firebase";
import { createGame } from "../services/gameService";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Home() {
  const [name, setName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const navigate = useNavigate();

  const handleCreateGame = async () => {
    if (!name.trim()) {
      alert("Masukkan nama kamu dulu!");
      return;
    }

    try {
      setLoading(true);
      const user = await authenticateUser();

      // Wait a bit to ensure authentication is processed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const gameId = await createGame(user.uid, name.trim());
      navigate(`/lobby/${gameId}`);
    } catch (error) {
      console.error("Error creating game:", error);
      let errorMessage = "Gagal membuat game";
      if (error.message.includes("koneksi internet")) {
        errorMessage = "Periksa koneksi internet Anda dan coba lagi!";
      } else if (error.message.includes("autentikasi")) {
        errorMessage = "Gagal autentikasi. Refresh halaman dan coba lagi!";
      } else {
        errorMessage = `Gagal membuat game: ${error.message}`;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!name.trim()) {
      alert("Masukkan nama kamu dulu!");
      return;
    }

    if (!gameCode.trim()) {
      alert("Masukkan kode game!");
      return;
    }

    try {
      setLoading(true);
      // Authenticate first before navigating
      await authenticateUser();

      // Wait a bit to ensure authentication is processed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      navigate(`/lobby/${gameCode.trim()}`, {
        state: { playerName: name.trim(), isJoining: true },
      });
    } catch (error) {
      console.error("Error authenticating:", error);
      alert("Gagal autentikasi. Refresh halaman dan coba lagi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="logo-section">
          <h1 className="game-title">🎮 GAPLANG</h1>
          <p className="game-subtitle">Game Tebak Kata Seru!</p>
        </div>

        <div className="input-section">
          <input
            type="text"
            className="name-input"
            placeholder="Masukkan nama kamu..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            disabled={loading}
          />

          {!showJoin ? (
            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={handleCreateGame}
                disabled={loading}
              >
                {loading ? "⏳ Membuat game..." : "🎯 Buat Game Baru"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowJoin(true)}
                disabled={loading}
              >
                🔗 Join Game
              </button>
            </div>
          ) : (
            <div className="join-section">
              <input
                type="text"
                className="code-input"
                placeholder="Masukkan kode game..."
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                disabled={loading}
              />
              <div className="button-group">
                <button
                  className="btn btn-primary"
                  onClick={handleJoinGame}
                  disabled={loading}
                >
                  {loading ? "⏳ Bergabung..." : "✓ Join Game"}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setShowJoin(false);
                    setGameCode("");
                  }}
                  disabled={loading}
                >
                  ← Kembali
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="info-section">
          <p className="info-text">🎲 Game untuk 2 pemain</p>
          <p className="info-text">⏱️ 10 ronde seru</p>
          <p className="info-text">🏆 Kumpulkan poin terbanyak!</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
