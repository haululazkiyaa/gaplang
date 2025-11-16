import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './JoinGame.css';

function JoinGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');

  const handleJoin = async () => {
    if (!name.trim()) {
      alert('Masukkan nama kamu dulu!');
      return;
    }

    // Navigate to lobby with player name
    navigate(`/lobby/${gameId}`, { state: { playerName: name.trim(), isJoining: true } });
  };

  return (
    <div className="join-game-container">
      <div className="join-game-content">
        <div className="logo-section">
          <h1 className="game-title">🎮 GAPLANG</h1>
          <p className="game-subtitle">Join Game</p>
        </div>

        <div className="info-box">
          <p className="info-text">
            Temanmu mengundangmu untuk bermain!
          </p>
          <p className="game-code">
            Kode Game: <strong>{gameId}</strong>
          </p>
        </div>

        <div className="input-section">
          <input
            type="text"
            className="name-input"
            placeholder="Masukkan nama kamu..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoin();
              }
            }}
          />

          <button
            className="btn btn-primary"
            onClick={handleJoin}
            disabled={!name.trim()}
          >
            🎯 Bergabung
          </button>

          <button
            className="btn btn-outline"
            onClick={() => navigate('/')}
          >
            ← Kembali
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinGame;
