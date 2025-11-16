import {
  get,
  onDisconnect,
  onValue,
  push,
  ref,
  set,
  update,
} from "firebase/database";

import { database } from "./firebase";

// Create a new game
export const createGame = async (hostId, hostName) => {
  const gameRef = push(ref(database, "games"));
  const gameId = gameRef.key;

  const gameData = {
    createdAt: Date.now(),
    status: "waiting",
    currentRound: 0,
    currentTurn: null,
    totalRounds: 10,
    players: {
      player1: {
        id: hostId,
        name: hostName,
        ready: false,
        score: 0,
        isHost: true,
      },
    },
    rounds: {},
  };

  await set(gameRef, gameData);

  // Handle disconnect
  onDisconnect(ref(database, `games/${gameId}/players/player1`)).remove();

  return gameId;
};

// Join existing game
export const joinGame = async (gameId, playerId, playerName) => {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const gameData = snapshot.val();

  if (gameData.players?.player2) {
    throw new Error("Game is full");
  }

  await update(ref(database, `games/${gameId}/players`), {
    player2: {
      id: playerId,
      name: playerName,
      ready: false,
      score: 0,
      isHost: false,
    },
  });

  // Handle disconnect
  onDisconnect(ref(database, `games/${gameId}/players/player2`)).remove();

  return gameData;
};

// Set player ready status
export const setPlayerReady = async (gameId, playerNumber, ready) => {
  await update(ref(database, `games/${gameId}/players/${playerNumber}`), {
    ready,
  });
};

// Start game (when both players are ready)
export const startGame = async (gameId) => {
  const firstPlayer = Math.random() < 0.5 ? "player1" : "player2";

  await update(ref(database, `games/${gameId}`), {
    status: "playing",
    currentRound: 1,
    currentTurn: firstPlayer,
  });
};

// Submit word and hint
export const submitWord = async (
  gameId,
  roundNumber,
  word,
  hint,
  wordMaker,
  guesser
) => {
  const roundData = {
    wordMaker,
    guesser,
    word: word.toLowerCase(),
    hint,
    startTime: Date.now(),
    status: "inProgress",
    hintsUsed: 0,
    guessedWord: "",
    score: 0,
  };

  await set(
    ref(database, `games/${gameId}/rounds/round${roundNumber}`),
    roundData
  );

  // Generate letter grid
  const letters = generateLetterGrid(word);

  await set(ref(database, `games/${gameId}/currentWord`), {
    hint,
    gridSize: calculateGridSize(word.length),
    letters,
    guessedLetters: [],
    timeLeft: 90,
  });
};

// Update guessed letters
export const updateGuessedLetters = async (gameId, guessedLetters) => {
  await update(ref(database, `games/${gameId}/currentWord`), {
    guessedLetters,
  });
};

// Use hint
export const useHint = async (gameId, roundNumber) => {
  const roundRef = ref(database, `games/${gameId}/rounds/round${roundNumber}`);
  const snapshot = await get(roundRef);
  const roundData = snapshot.val();

  await update(roundRef, {
    hintsUsed: (roundData.hintsUsed || 0) + 1,
  });

  return roundData.word;
};

// Complete round
export const completeRound = async (
  gameId,
  roundNumber,
  guessedWord,
  isCorrect,
  hintsUsed,
  guesser
) => {
  const score = isCorrect ? Math.max(100 - hintsUsed * 10, 0) : 0;

  await update(ref(database, `games/${gameId}/rounds/round${roundNumber}`), {
    endTime: Date.now(),
    guessedWord,
    score,
    status: "completed",
  });

  // Update player score
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const gameData = snapshot.val();

  const currentScore = gameData.players?.[guesser]?.score || 0;
  await update(ref(database, `games/${gameId}/players/${guesser}`), {
    score: currentScore + score,
  });

  // Clear current word
  await set(ref(database, `games/${gameId}/currentWord`), null);

  // Move to next round or end game
  if (roundNumber >= 10) {
    await update(ref(database, `games/${gameId}`), {
      status: "finished",
    });
  } else {
    const nextTurn = gameData.currentTurn === "player1" ? "player2" : "player1";
    await update(ref(database, `games/${gameId}`), {
      currentRound: roundNumber + 1,
      currentTurn: nextTurn,
    });
  }
};

// Listen to game changes
export const listenToGame = (gameId, callback) => {
  const gameRef = ref(database, `games/${gameId}`);
  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};

// Helper function to generate letter grid
const generateLetterGrid = (word) => {
  const wordLetters = word.toUpperCase().split("");
  const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Calculate grid size
  const wordLength = word.length;
  const gridSize = Math.ceil(Math.sqrt(wordLength * 3)); // 3x more letters than needed
  const totalCells = gridSize * gridSize;

  // Start with word letters
  const gridLetters = [...wordLetters];

  // Add random letters to fill the grid
  while (gridLetters.length < totalCells) {
    const randomLetter =
      allLetters[Math.floor(Math.random() * allLetters.length)];
    gridLetters.push(randomLetter);
  }

  // Shuffle the array
  return gridLetters.sort(() => Math.random() - 0.5);
};

// Helper function to calculate grid size
const calculateGridSize = (wordLength) => {
  const size = Math.ceil(Math.sqrt(wordLength * 3));
  return `${size}x${size}`;
};

// Reset game for rematch
export const resetGame = async (gameId) => {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const gameData = snapshot.val();

  await update(gameRef, {
    status: "waiting",
    currentRound: 0,
    currentTurn: null,
    rounds: {},
    currentWord: null,
    players: {
      player1: {
        ...gameData.players?.player1,
        ready: false,
        score: 0,
      },
      player2: {
        ...gameData.players?.player2,
        ready: false,
        score: 0,
      },
    },
  });
};
