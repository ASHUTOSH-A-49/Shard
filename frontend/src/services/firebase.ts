import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC1LyxmEQ6Ow5VffXXwT3I3i4y6TPl6l9k",
  authDomain: "invologs.firebaseapp.com",
  projectId: "invologs",
  storageBucket: "invologs.firebasestorage.app",
  messagingSenderId: "229473993006",
  appId: "1:229473993006:web:55f6bd217e811b8b843abf",
  measurementId: "G-DJ7D184CX1",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
