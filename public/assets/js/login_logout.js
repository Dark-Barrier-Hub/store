document.addEventListener("DOMContentLoaded", function () {
    const userUID = localStorage.getItem("userUID");
    const navItem = document.querySelector(".nav-item a[title='Login/Signup']");
    
    if (userUID && navItem) {
        navItem.href = "profile.html";
        navItem.title = "Profile";
        navItem.innerHTML = '<i class="fa-solid fa-user"></i>';
    }
});
