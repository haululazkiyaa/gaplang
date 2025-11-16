import { auth, database } from "./firebase";
import {
  get,
  onDisconnect,
  onValue,
  push,
  ref,
  set,
  update,
} from "firebase/database";

// Utility function to ensure user is authenticated
const ensureAuthenticated = async () => {
  if (!auth.currentUser) {
    throw new Error("User not authenticated");
  }
  return auth.currentUser;
};

// Helper function to handle player promotion when host disconnects
const setupDisconnectHandlers = async (gameId, playerNumber) => {
  try {
    console.log("Setting up disconnect handler for:", gameId, playerNumber);
    const playerRef = ref(database, `games/${gameId}/players/${playerNumber}`);

    if (playerNumber === "player1") {
      // If player1 (host) disconnects, promote player2 or delete game
      await onDisconnect(playerRef).remove();
      console.log("Disconnect handler set for player1");
    } else {
      // If player2 disconnects, just remove them
      await onDisconnect(playerRef).remove();
      console.log("Disconnect handler set for player2");
    }
  } catch (error) {
    console.error("Error setting up disconnect handlers:", error);
    // Don't throw error here, as it's not critical for game functionality
  }
};

// Create a new game
export const createGame = async (playerId, playerName) => {
  try {
    console.log("Creating game for player:", playerId, playerName);

    // Ensure user is authenticated
    await ensureAuthenticated();

    const gamesRef = ref(database, "games");
    const newGameRef = push(gamesRef);
    const gameId = newGameRef.key;

    const gameData = {
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
    };

    console.log("Setting game data:", gameData);
    await set(newGameRef, gameData);
    console.log("Game created successfully with ID:", gameId);

    // Setup disconnect handler for player1
    await setupDisconnectHandlers(gameId, "player1");

    return gameId;
  } catch (error) {
    console.error("Error creating game:", error);
    throw new Error("Gagal membuat game: " + error.message);
  }
};

// Join existing game
export const joinGame = async (gameId, playerId, playerName) => {
  console.log(
    "Attempting to join game:",
    gameId,
    "with player:",
    playerId,
    playerName
  );

  try {
    // Ensure user is authenticated
    await ensureAuthenticated();

    const gameRef = ref(database, `games/${gameId}`);

    // Use get() instead of onValue for one-time read to avoid timing issues
    console.log("Fetching game data...");
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      console.log("Game not found in database");
      throw new Error("Game tidak ditemukan");
    }

    const game = snapshot.val();
    console.log("Game found:", game);

    // Check if game is full
    if (game.players?.player2) {
      console.log("Game is full");
      throw new Error("Game penuh");
    }

    // Check if player is already in the game as player1
    if (game.players?.player1?.id === playerId) {
      console.log("Player already in game as player1");
      throw new Error("Kamu sudah ada di game ini");
    }

    // Update player2 data
    console.log("Updating player2 data...");
    await update(gameRef, {
      "players/player2": {
        id: playerId,
        name: playerName,
        isHost: false,
        ready: false,
      },
    });

    console.log("Player2 updated successfully");

    // Setup disconnect handler for player2
    await setupDisconnectHandlers(gameId, "player2");

    return game;
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
}; // Set player ready status
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

  // Generate free hints based on word length
  const freeHints = generateFreeHints(word);

  await set(ref(database, `games/${gameId}/currentWord`), {
    hint,
    gridSize: calculateGridSize(word.length),
    letters,
    guessedLetters: [],
    freeHints, // Add free hints to the data
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
  console.log("Setting up listener for game:", gameId);
  const gameRef = ref(database, `games/${gameId}`);
  return onValue(
    gameRef,
    (snapshot) => {
      console.log(
        "Game listener triggered for:",
        gameId,
        "exists:",
        snapshot.exists()
      );
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Game data received:", data);
        callback(data);
      } else {
        console.log("Game data is null, game may not exist");
        callback(null);
      }
    },
    (error) => {
      console.error("Game listener error:", error);
      callback(null);
    }
  );
};

// Helper function to generate free hints based on word length
const generateFreeHints = (word) => {
  const wordLength = word.length;
  let numberOfHints = 0;

  // Determine number of free hints based on word length
  if (wordLength <= 4) {
    numberOfHints = 1; // Short words: 1 free hint
  } else if (wordLength <= 7) {
    numberOfHints = 2; // Medium words: 2 free hints
  } else if (wordLength <= 10) {
    numberOfHints = 3; // Long words: 3 free hints
  } else {
    numberOfHints = Math.floor(wordLength / 3); // Very long words: 1/3 of letters
  }

  // Generate random positions for free hints
  const positions = [];
  const wordUpper = word.toUpperCase();

  // Avoid giving hints for the first and last letters to maintain some challenge
  const availablePositions = [];
  for (let i = 1; i < wordLength - 1; i++) {
    availablePositions.push(i);
  }

  // If word is very short, include first or last position
  if (wordLength <= 4) {
    availablePositions.push(0);
    if (wordLength > 2) {
      availablePositions.push(wordLength - 1);
    }
  }

  // Randomly select positions
  const shuffled = availablePositions.sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numberOfHints, shuffled.length); i++) {
    const position = shuffled[i];
    positions.push({
      index: position,
      letter: wordUpper[position],
    });
  }

  return positions;
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
