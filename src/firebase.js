import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDRphgL9iXp3OGHTOrOxebWQiduhId1jhI",
  databaseURL: "https://aqi-monitoring-sytem-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);