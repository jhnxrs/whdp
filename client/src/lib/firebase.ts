import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBYLnzZZNTlW3SYgrcBZjdece_zDuHWRV8",
    authDomain: "whdp-af114.firebaseapp.com",
    projectId: "whdp-af114",
    storageBucket: "whdp-af114.firebasestorage.app",
    messagingSenderId: "153473392712",
    appId: "1:153473392712:web:877ccf0469ef7e99b3b87d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getFirestore(app);

export { app, auth, database };