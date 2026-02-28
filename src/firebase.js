import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "<YOUR_API_KEY>",
  databaseURL: "<YOUR_DATABASE_URL>",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
