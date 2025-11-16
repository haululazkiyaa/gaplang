import "./App.css";

import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import Game from "./pages/Game";
import GameOver from "./pages/GameOver";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:gameId" element={<Lobby />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/gameover/:gameId" element={<GameOver />} />
      </Routes>
    </Router>
  );
}

export default App;
