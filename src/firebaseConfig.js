import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
    apiKey: "AIzaSyBYO10Z1ceIZh8h8NUYbbdLZtqHK9Sarpo",
    authDomain: "qrcode-based-online-order.firebaseapp.com",
    databaseURL: "https://qrcode-based-online-order-default-rtdb.firebaseio.com", // ✅ Add Realtime Database URL
    projectId: "qrcode-based-online-order",
    storageBucket: "qrcode-based-online-order.appspot.com",
    messagingSenderId: "1066703960451",
    appId: "1:1066703960451:web:cea18ce1d930c756055eb6",
    measurementId: "G-69LY3WXX4K"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Services
const db = getFirestore(app);  // Firestore
const rtdb = getDatabase(app); // ✅ Realtime Database
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

// ✅ Export both Firestore and Realtime Database
export { auth, provider, db, rtdb, storage, collection, getDocs, addDoc, updateDoc, deleteDoc, signInWithPopup, signOut, onSnapshot, doc, getDoc };
