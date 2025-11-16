import {
  get,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

import { database } from "./firebase";

// Helper function to handle player promotion when host disconnects
const setupDisconnectHandlers = async (gameId, playerNumber) => {
  const playerRef = ref(database, `games/${gameId}/players/${playerNumber}`);

  if (playerNumber === "player1") {
    // If player1 (host) disconnects, promote player2 or delete game
    onDisconnect(playerRef)
      .remove()
      .then(async () => {
        const gameRef = ref(database, `games/${gameId}`);
        const snapshot = await get(gameRef);

        if (snapshot.exists()) {
          const data = snapshot.val();

          if (data.players?.player2) {
            // Promote player2 to player1
            await update(gameRef, {
              players: {
                player1: {
                  ...data.players.player2,
                  isHost: true,
                  ready: false, // Reset ready status
                },
                player2: null,
              },
            });
          } else {
            // No player2, delete the entire game
            await remove(gameRef);
          }
        }
      });
  } else {
    // If player2 disconnects, just remove them
    onDisconnect(playerRef).remove();
  }
};

// Create a new game
export const createGame = async (playerId, playerName) => {
  const gamesRef = ref(database, "games");
  const newGameRef = push(gamesRef);
  const gameId = newGameRef.key;

  await set(newGameRef, {
    id: gameId,
    status: "waiting",
    players: {
      player1: {
        id: playerId,
        name: playerName,
        isHost: true,
        ready: false,
      },
      player2: null,
    },
    words: {
      player1: null,
      player2: null,
    },
    guesses: {
      player1: [],
      player2: [],
    },
    createdAt: Date.now(),
  });

  // Setup disconnect handler for player1
  await setupDisconnectHandlers(gameId, "player1");

  return gameId;
};

// Join existing game
export const joinGame = async (gameId, playerId, playerName) => {
  // Retry logic for Firebase sync delay
  let attempts = 0;
  const maxAttempts = 3;
  const retryDelay = 1000; // 1 second

  while (attempts < maxAttempts) {
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (snapshot.exists()) {
      const game = snapshot.val();
      if (game.players?.player2) {
        throw new Error("Game is full");
      }

      await update(gameRef, {
        "players/player2": {
          id: playerId,
          name: playerName,
          isHost: false,
          ready: false,
        },
      });

      // Setup disconnect handler for player2
      await setupDisconnectHandlers(gameId, "player2");

      return game;
    }

    attempts++;
    if (attempts < maxAttempts) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error("Game not found");
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
