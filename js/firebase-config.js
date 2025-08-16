// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";  // <-- Añadido

const firebaseConfig = {
  apiKey: "AIzaSyCw5TaHHdipxjw21jLGVDv8KQT_Eq3IPgI",
  authDomain: "proyecto-x-53e7d.firebaseapp.com",
  projectId: "proyecto-x-53e7d",
  storageBucket: "proyecto-x-53e7d.appspot.com",
  messagingSenderId: "889591303007",
  appId: "1:889591303007:web:fb211e62d2a7cd819584ea"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);  // <-- Exporta auth


