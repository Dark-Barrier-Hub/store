// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
    getAuth,
    signOut,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    verifyBeforeUpdateEmail
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

fetch('assets/js/API.json')
    .then(response => response.json())
    .then(firebaseConfig => {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
	const analytics = getAnalytics(app);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // DOM Elements
        const avatarImg = document.getElementById("avatar");
        const profileHeader = document.querySelector(".profile-container h1");
        const loadingText = document.querySelector(".loading-text");
        const profileContainer = document.querySelector(".profile-container");
        const profileSetup = document.getElementById("profile-setup");

        // Auth Listener
        onAuthStateChanged(auth, (user) => {
            if (user) {
                const userUID = user.uid;
                localStorage.setItem("userUID", userUID);
                fetchUserData(userUID);
            } else {
                alert("No user logged in! Redirecting to login page.");
                logoutUser();
                window.location.href = "index.html";
            }
        });

        // Save this somewhere globally if needed
        const actionCodeSettings = {
            url: window.location.href,
            handleCodeInApp: true
        };

        // Fetch User Data
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

        window.addEventListener("DOMContentLoaded", async () => {
            if (isSignInWithEmailLink(auth, window.location.href)) {
                const email = window.localStorage.getItem("reauthEmail");
                if (email) {
                    try {
                        await signInWithEmailLink(auth, email, window.location.href);
                        window.localStorage.removeItem("reauthEmail");
                        alert("Re-authentication successful! You can now retry updating your email.");
                        logoutUser();
                    } catch (error) {
                        alert("Sign-in with email link failed: " + error.message);
                    }
                } else {
                    alert("No stored email for re-authentication.");
                }
            }
        });


        // Display Profile Data
        function displayUserData(userData) {
            const user = auth.currentUser;
            const email = user ? user.email : "Not Available";

            loadingText.style.display = "none";
            profileHeader.textContent = `Welcome, ${userData.name || "User"}!`;
            document.getElementById("email").textContent = `Email: ${email}`;

            avatarImg.src = userData.avatar_pic || "assets/images/default_avatar.png";
            avatarImg.style.display = "block";

            // Event Listeners
            document.getElementById("logout").addEventListener("click", logoutUser);

            // Change Name
            document.getElementById("changeNameBtn").addEventListener("click", async () => {
                const newName = prompt("Enter new name:");
                if (newName && newName.trim() !== "") {
                    const uid = auth.currentUser.uid;
                    const userRef = doc(db, "users", uid);
                    await setDoc(userRef, { name: newName.trim() }, { merge: true });
                    alert("Name updated successfully.");
                    profileHeader.textContent = `Welcome, ${newName.trim()}!`;
                }
            });

            // Change Image
            document.getElementById("changeImageBtn").addEventListener("click", () => {
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = "image/*";
                fileInput.onchange = async () => {
                    const file = fileInput.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = async () => {
                            const avatar_pic = reader.result;
                            const uid = auth.currentUser.uid;
                            const userRef = doc(db, "users", uid);
                            await setDoc(userRef, { avatar_pic }, { merge: true });
                            alert("Image updated successfully.");
                            avatarImg.src = avatar_pic;
                        };
                        reader.readAsDataURL(file);
                    }
                };
                fileInput.click();
            });

            // Change Email
            document.getElementById("changeEmailBtn").addEventListener("click", async () => {
                const user = auth.currentUser;

                if (!user || !user.email) {
                    alert("No authenticated user or email.");
                    return;
                }

                const newEmail = prompt("Enter your new email:");
                if (!newEmail || newEmail.trim() === "") {
                    alert("Please enter a valid email.");
                    return;
                }

                try {
                    await verifyBeforeUpdateEmail(user, newEmail.trim(), actionCodeSettings);
                    alert(`A verification email has been sent to ${newEmail.trim()}. Please verify to update your email.`);
                } catch (error) {
                    if (error.code === "auth/requires-recent-login") {
                        // Send a reauthentication email to their current email
                        try {
                            await sendSignInLinkToEmail(auth, user.email, actionCodeSettings);
                            window.localStorage.setItem("reauthEmail", user.email);
                            alert("To re-authenticate, check your email and click the link. Then return to this page.");
                        } catch (linkError) {
                            alert("Failed to send re-authentication link: " + linkError.message);
                        }
                    } else {
                        alert("Failed to send verification email: " + error.message);
                    }
                }
            });

        }

        // First Time Profile Setup
        function askForUserDetails(uid) {
            loadingText.style.display = "none";
            profileContainer.style.display = "none";
            profileSetup.style.display = "block";

            const nameInput = document.getElementById("nameInput");
            const avatarInput = document.getElementById("avatarInput");

            // Live Preview
            avatarInput.addEventListener("change", () => {
                const file = avatarInput.files[0];
                if (file) {
                    const previewReader = new FileReader();
                    previewReader.onload = () => {
                        document.getElementById("avatarPreview")?.remove(); // Remove previous preview if any
                        const preview = document.createElement("img");
                        preview.src = previewReader.result;
                        preview.style.width = "100px";
                        preview.style.borderRadius = "50%";
                        preview.style.marginTop = "10px";
                        preview.id = "avatarPreview";
                        avatarInput.parentNode.appendChild(preview);
                    };
                    previewReader.readAsDataURL(file);
                }
            });

            const form = document.getElementById("setup-form");
            form.addEventListener("submit", async (e) => {
                e.preventDefault();

                const name = nameInput.value.trim();
                const file = avatarInput.files[0];

                if (!name || !file) {
                    alert("Please fill in all fields.");
                    return;
                }

                const reader = new FileReader();
                reader.onload = async () => {
                    const avatar_pic = reader.result;
                    await saveUserData(uid, { name, avatar_pic });

                    profileSetup.style.display = "none";
                    profileContainer.style.display = "block";
                };
                reader.readAsDataURL(file);
            });
        }

        // Save Data to Firestore
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

        // Logout
        function logoutUser() {
            signOut(auth)
                .then(() => {
                    localStorage.removeItem("userUID");
                    localStorage.removeItem("userLoggedIn");
                    window.location.href = "index.html";
                })
                .catch((error) => {
                    alert("Error logging out: " + error.message);
                });
        }
    })
    .catch(error => {
        console.error("Failed to load Firebase config:", error);
    });
