  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
  import { getAuth, createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth-compat.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCt7LySnM0ieRESq9cm4R6bgN6U_KzgeCU",
    authDomain: "dark-barrier-hub.firebaseapp.com",
    projectId: "dark-barrier-hub",
    storageBucket: "dark-barrier-hub.firebasestorage.app",
    messagingSenderId: "803039197813",
    appId: "1:803039197813:web:9b7c0bf2791c5fea34563c",
    measurementId: "G-WBEFMXKJHG"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const auth = getAuth(app);



  // Submit Button
  const submit = document.getElementById("signup-submit");
  submit.addEventListener("click", function(event){
    event.preventDefault();

  // Initialize Document IDs
    const signup_name = document.getElementById("signup-name").value;
    const signup_user = document.getElementById("signup-user").value;
    const signup_email = document.getElementById("signup-email").value;
    const signup_pass = document.getElementById("signup-pass").value;


  // Auth Creation
  createUserWithEmailAndPassword(auth, signup_email, signup_pass)
  .then((userCredential) => {
    // Signed up 
    const user = userCredential.user;
    window.location.href="../../profile.html";
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    window.alert(errorMessage)
    // ..
  });
  });

