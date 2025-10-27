// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5LnMmP7ZuO4dHP-vJVL-G0E_zb6cY-54",
  authDomain: "cbitracker-fff31.firebaseapp.com",
  projectId: "cbitracker-fff31",
  storageBucket: "cbitracker-fff31.firebasestorage.app",
  messagingSenderId: "864316481569",
  appId: "1:864316481569:web:ac2022ed33d860332e8360",
  measurementId: "G-KVDZ670GFF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);