import { getAuth, signInAnonymously } from "firebase/auth";

import { getDatabase } from "firebase/database";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

// Anonymous authentication with retry logic
export const authenticateUser = async (retryCount = 0) => {
  try {
    console.log("Starting authentication... attempt:", retryCount + 1);

    // Check if user is already authenticated
    if (auth.currentUser) {
      console.log("User already authenticated:", auth.currentUser.uid);
      return auth.currentUser;
    }

    const userCredential = await signInAnonymously(auth);
    console.log("Authentication successful:", userCredential.user.uid);

    // Wait a moment to ensure the authentication state is propagated
    await new Promise((resolve) => setTimeout(resolve, 100));

    return userCredential.user;
  } catch (error) {
    console.error("Error authenticating user:", error);

    // Retry once if it's a network error
    if (
      retryCount < 1 &&
      (error.code === "auth/network-request-failed" ||
        error.message.includes("network"))
    ) {
      console.log("Retrying authentication...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return authenticateUser(retryCount + 1);
    }

    throw new Error("Gagal autentikasi: " + error.message);
  }
};
