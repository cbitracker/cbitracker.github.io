// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5LnMmP7ZuO4dHP-vJVL-G0E_zb6cY-54",
  authDomain: "cbitracker-fff31.firebaseapp.com",
  projectId: "cbitracker-fff31",
  storageBucket: "cbitracker-fff31.appspot.com", // ✅ fixed
  messagingSenderId: "864316481569",
  appId: "1:864316481569:web:ac2022ed33d860332e8360",
  measurementId: "G-KVDZ670GFF"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
