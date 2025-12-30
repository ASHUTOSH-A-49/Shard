import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getFirestore} from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDR8iUKGH5xSNxxadHXURLww4svFlGyUWA",
  authDomain: "notes-app-1f946.firebaseapp.com",
  databaseURL: "https://notes-app-1f946-default-rtdb.firebaseio.com",
  projectId: "notes-app-1f946",
  storageBucket: "notes-app-1f946.firebasestorage.app",
  messagingSenderId: "211368205758",
  appId: "1:211368205758:web:1cb0b877198349474badef"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
