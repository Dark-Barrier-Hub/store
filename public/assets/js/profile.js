// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
    getAuth,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
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

        // ── DOM elements ──────────────────────────────────────────────
        const loadingState   = document.getElementById("loading-state");
        const mainProfile    = document.getElementById("main-profile");
        const profileSetup   = document.getElementById("profile-setup");
        const avatarImg      = document.getElementById("avatar");
        const profileNameEl  = document.getElementById("profile-name-text");
        const emailEl        = document.getElementById("email");

        // ── Auth listener ─────────────────────────────────────────────
        onAuthStateChanged(auth, (user) => {
            if (user) {
                localStorage.setItem("userUID", user.uid);
                fetchUserData(user);
            } else {
                window.location.href = "logsign.html";
            }
        });

        // ── Fetch Firestore profile ───────────────────────────────────
        async function fetchUserData(user) {
            const userRef  = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                displayUserData(userSnap.data(), user);
            } else {
                // Pre-fill from Google account data
                const googleName   = user.displayName || "";
                const googleAvatar = user.photoURL    || "";
                askForUserDetails(user.uid, googleName, googleAvatar);
            }
        }

        // ── Display profile ───────────────────────────────────────────
        function displayUserData(userData, user) {
            loadingState.style.display = "none";
            mainProfile.style.display  = "block";

            profileNameEl.textContent = userData.name || user.displayName || "Commander";
            emailEl.textContent       = user.email || "—";

            const avatarSrc = userData.avatar_pic || user.photoURL || "";
            if (avatarSrc) {
                avatarImg.src             = avatarSrc;
                avatarImg.style.display   = "block";
            }

            // ── Settings: Change Name ──
            document.getElementById("changeNameBtn").addEventListener("click", async () => {
                const newName = prompt("Enter new name:");
                if (!newName || !newName.trim()) return;
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, { name: newName.trim() }, { merge: true });
                profileNameEl.textContent = newName.trim();
                alert("Name updated successfully.");
            });

            // ── Settings: Change Image ──
            document.getElementById("changeImageBtn").addEventListener("click", () => {
                const fileInput    = document.createElement("input");
                fileInput.type     = "file";
                fileInput.accept   = "image/*";
                fileInput.onchange = async () => {
                    const file = fileInput.files[0];
                    if (!file) return;
                    const reader   = new FileReader();
                    reader.onload  = async () => {
                        const avatar_pic = reader.result;
                        const userRef    = doc(db, "users", user.uid);
                        await setDoc(userRef, { avatar_pic }, { merge: true });
                        avatarImg.src           = avatar_pic;
                        avatarImg.style.display = "block";
                        alert("Image updated successfully.");
                    };
                    reader.readAsDataURL(file);
                };
                fileInput.click();
            });

            // ── Settings: Change Email — not supported for Google accounts ──
            document.getElementById("changeEmailBtn").addEventListener("click", () => {
                alert("Your email is managed by Google. To change it, update your Google account directly at myaccount.google.com.");
            });

            // ── Logout ──
            document.getElementById("logout").addEventListener("click", logoutUser);
        }

        // ── First-time setup ──────────────────────────────────────────
        function askForUserDetails(uid, prefillName, prefillAvatar) {
            loadingState.style.display  = "none";
            mainProfile.style.display   = "none";
            profileSetup.style.display  = "block";

            const nameInput   = document.getElementById("nameInput");
            const avatarInput = document.getElementById("avatarInput");

            // Pre-fill name from Google
            if (prefillName) nameInput.value = prefillName;

            // Show Google avatar as default preview if available
            if (prefillAvatar) {
                const preview     = document.createElement("img");
                preview.src       = prefillAvatar;
                preview.id        = "avatarPreview";
                preview.style.cssText = "width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--border-mid);box-shadow:var(--glow-violet);";
                document.getElementById("avatar-preview-wrap").appendChild(preview);
            }

            // Live preview on file change
            avatarInput.addEventListener("change", () => {
                const file = avatarInput.files[0];
                if (!file) return;
                const reader   = new FileReader();
                reader.onload  = () => {
                    const existing = document.getElementById("avatarPreview");
                    if (existing) existing.remove();
                    const preview     = document.createElement("img");
                    preview.src       = reader.result;
                    preview.id        = "avatarPreview";
                    preview.style.cssText = "width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--border-mid);box-shadow:var(--glow-violet);";
                    document.getElementById("avatar-preview-wrap").appendChild(preview);
                };
                reader.readAsDataURL(file);
            });

            // Submit
            const form = document.getElementById("setup-form");
            form.addEventListener("submit", async (e) => {
                e.preventDefault();

                const name = nameInput.value.trim();
                if (!name) {
                    alert("Please enter your name.");
                    return;
                }

                const file = avatarInput.files[0];

                if (file) {
                    // User uploaded a custom image
                    const reader  = new FileReader();
                    reader.onload = async () => {
                        await saveUserData(uid, { name, avatar_pic: reader.result });
                    };
                    reader.readAsDataURL(file);
                } else if (prefillAvatar) {
                    // Use Google profile picture URL directly
                    await saveUserData(uid, { name, avatar_pic: prefillAvatar });
                } else {
                    await saveUserData(uid, { name, avatar_pic: "" });
                }
            });
        }

        // ── Save to Firestore ─────────────────────────────────────────
        async function saveUserData(uid, userData) {
            try {
                const userRef = doc(db, "users", uid);
                await setDoc(userRef, userData);
                alert("Profile saved! Welcome to the Hub.");
                // Reload page to show main profile
                window.location.reload();
            } catch (error) {
                alert("Error saving profile: " + error.message);
            }
        }

        // ── Logout ────────────────────────────────────────────────────
        function logoutUser() {
            signOut(auth)
                .then(() => {
                    localStorage.removeItem("userUID");
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