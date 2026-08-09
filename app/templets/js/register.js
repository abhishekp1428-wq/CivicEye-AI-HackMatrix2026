const registerForm = document.getElementById("registerForm");
const errorMsg = document.getElementById("errorMsg");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    errorMsg.textContent = "";

    const user = {
        user_name: document.getElementById("fullname").value.trim(),
        email: document.getElementById("email").value.trim(),
        mobile: document.getElementById("mobile").value.trim(),
        password: document.getElementById("password").value
    };

    try {

        const response = await fetch("http://127.0.0.1:8000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        if (response.ok) {

            alert("Registration Successful!");

            window.location.href = "login.html";

        } else {

            errorMsg.textContent = data.detail;

        }

    } catch (error) {

        console.error(error);
        errorMsg.textContent = "Server connection failed.";

    }
});