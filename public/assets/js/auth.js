// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCt7LySnM0ieRESq9cm4R6bgN6U_KzgeCU",
    authDomain: "dark-barrier-hub.firebaseapp.com",
    projectId: "dark-barrier-hub",
    storageBucket: "dark-barrier-hub.appspot.com",
    messagingSenderId: "803039197813",
    appId: "1:803039197813:web:9b7c0bf2791c5fea34563c",
    measurementId: "G-WBEFMXKJHG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle sending login link
document.getElementById("send-link").addEventListener("click", function (event) {
    event.preventDefault();

    const email = document.getElementById("user-email").value.trim();
    if (!email) {
        alert("Please enter your email.");
        return;
    }

    const actionCodeSettings = {
        url: window.location.href, // Redirects back to this page
        handleCodeInApp: true,
    };

    sendSignInLinkToEmail(auth, email, actionCodeSettings)
        .then(() => {
            alert("A login link has been sent to your email. Please check your inbox.");
            localStorage.setItem("emailForSignIn", email); // Store email temporarily
        })
        .catch((error) => {
            alert(error.message);
        });
});

// Handle login if the user opens the link
if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = localStorage.getItem("emailForSignIn");
    if (!email) {
        email = prompt("Please enter your email to confirm sign-in:");
    }

    signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
            // Clear stored email after successful sign-in
            localStorage.removeItem("emailForSignIn");

            alert("Login successful! Redirecting...");
            window.location.href = "profile.html"; // Redirect after login
        })
        .catch((error) => {
            alert(error.message);
        });
}

// Check authentication state (Useful for persistent login)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in:", user.uid);
    } else {
        console.log("No user logged in.");
    }
});
