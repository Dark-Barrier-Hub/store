// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userUID = user.uid;
        localStorage.setItem("userUID", userUID);
        fetchUserData(userUID);
    } else {
        alert("No user logged in! Redirecting to login page.");
        window.location.href = "index.html";
    }
});

// Function to Fetch User Data
async function fetchUserData(uid) {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        displayUserData(userData);
    } else {
        askForUserDetails(uid);
    }
}

// Function to Display User Data
function displayUserData(userData) {
    const user = auth.currentUser;
    const email = user ? user.email : "Not Available";

    document.querySelector("h1").textContent = `Welcome, ${userData.name}!`;
    document.getElementById("email").textContent = `Email: ${email}`;

    const avatarImg = document.getElementById("avatar");
    avatarImg.src = userData.avatar_pic;
    avatarImg.style.display = "block";

    document.getElementById("logout").addEventListener("click", logoutUser);
}

// Function to Ask User for Details (First-Time Users)
async function askForUserDetails(uid) {
    const name = prompt("Enter your name:");
    if (!name) {
        alert("You must enter a name!");
        return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.addEventListener("change", async function () {
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async function () {
                const avatar_pic = reader.result;

                await saveUserData(uid, { name, avatar_pic });
            };
        } else {
            alert("No image selected. Profile setup failed.");
        }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
}

// Function to Save User Data in Firestore (excluding email)
async function saveUserData(uid, userData) {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, userData);
        alert("Profile saved successfully!");
        displayUserData(userData);
    } catch (error) {
        alert("Error saving profile: " + error.message);
    }
}

// Function to Logout User
function logoutUser() {
    signOut(auth).then(() => {
        localStorage.removeItem("userUID");
        localStorage.removeItem("userLoggedIn");
        window.location.href = "index.html";
    }).catch((error) => {
        alert("Error logging out: " + error.message);
    });
}
