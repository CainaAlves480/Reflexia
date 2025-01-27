import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, googleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyDhKNZrJF21nMAfGFvOAjd4E7LmsGVQJv8",
    authDomain: "login-1d78b.firebaseapp.com",
    projectId: "login-1d78b",
    storageBucket: "login-1d78b.appspot.com",
    messagingSenderId: "935314690052",
    appId: "1:935314690052:web:e93dc192d6e83f78b82551",
    measurementId: "G-TXQWJ5TF08"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth();
auth.languageCode = 'en'
const provider = new googleAuthProvider();
const googleLogin = document.getElementById("google-login-btn");
googleLogin.addEventListener("click", function(){
    const googleLogin = document.getElementById("google-login-btn");
    googleLogin.addEventListener("click", function(){
        signInWithPopup(auth, provider)
        .the((result) =>{
            const credential = googleAuthProvider.credentialFromResult(result);
            const user = result.user;

        }).catch((error)=>{
            const errorCode = error.code;
            const errorMessage = error.message;
        })
    })
})