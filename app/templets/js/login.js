document.getElementById("loginForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const identifier = document.getElementById("identifier").value.trim();
    const password = document.getElementById("password").value;
    const err = document.getElementById("errorMsg");

    err.textContent = "";

    const user = {
        email: identifier,
        password: password
    };

    try {

        const response = await fetch("http://127.0.0.1:8000/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(user)

        });

        const data = await response.json();

        if (response.ok) {

            // Save login data
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user_id", data.user.id);
            localStorage.setItem("user_name", data.user.user_name);
            localStorage.setItem("email", data.user.email);
            localStorage.setItem("mobile", data.user.mobile);

            alert("Login Successful!");

            window.location.href = "dashboard.html";

        } else {

            err.textContent = data.detail;

        }

    } catch (error) {

        console.error(error);
        err.textContent = "Unable to connect to server.";

    }

});