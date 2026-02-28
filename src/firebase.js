import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCjLG22tW3Je_dOOLwvXXXO55vMOTPiQbY",
  databaseURL: "https://aqi-monitoring-sytem-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);