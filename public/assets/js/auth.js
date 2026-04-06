// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Load firebaseConfig from external JSON
fetch('assets/js/API.json')
    .then(response => response.json())
    .then(firebaseConfig => {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        const signInBtn = document.getElementById("google-signin-btn");
        const statusMsg = document.getElementById("auth-status");

        // Check if user is already logged in — redirect to profile
        onAuthStateChanged(auth, (user) => {
            if (user) {
                localStorage.setItem("userUID", user.uid);
                window.location.href = "profile.html";
            }
        });

        // Google Sign-In via popup
        signInBtn.addEventListener("click", () => {
            signInBtn.disabled = true;
            signInBtn.style.opacity = "0.7";
            statusMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;"></i> Opening Google sign-in...';

            signInWithPopup(auth, provider)
                .then((result) => {
                    const user = result.user;
                    localStorage.setItem("userUID", user.uid);
                    statusMsg.innerHTML = '<i class="fa-solid fa-check" style="color: var(--teal-rune); margin-right:6px;"></i> Signed in! Redirecting...';
                    window.location.href = "profile.html";
                })
                .catch((error) => {
                    signInBtn.disabled = false;
                    signInBtn.style.opacity = "1";
                    const msg = error.code === "auth/popup-closed-by-user"
                        ? "Sign-in cancelled. The gate awaits your return."
                        : `Sign-in failed: ${error.message}`;
                    statusMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--crimson-bright); margin-right:6px;"></i> ${msg}`;
                });
        });
    })
    .catch(error => {
        console.error("Failed to load Firebase config:", error);
    });