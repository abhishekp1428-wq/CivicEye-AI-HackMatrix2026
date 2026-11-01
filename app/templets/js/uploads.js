/*==================================================
        CIVICEYE AI
        UPLOAD JAVASCRIPT
==================================================*/

const API_BASE = "https://civiceye-ai-hackmatrix2026-1.onrender.com";

const captureBox = document.getElementById("captureBox");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const placeholder = document.getElementById("placeholder");
const retakeBtn = document.getElementById("retakeBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const analysisPanel = document.getElementById("analysisPanel");
const submitBtn = document.getElementById("submitBtn");
const toast = document.getElementById("toast");
const locationInput = document.getElementById("location");
const detectLocationBtn = document.getElementById("detectLocationBtn");
const locationStatus = document.getElementById("locationStatus");

let selectedFile = null;
let currentComplaint = null;
let locationWasDetected = false;

function getToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Session expired. Please log in again.");
        window.location.href = "login.html";
        return null;
    }
    return token;
}


/*=========================
OPEN FILE PICKER
=========================*/

captureBox.onclick = function () {
    if (preview.style.display === "none") {
        fileInput.click();
    }
};


/*=========================
IMAGE SELECT
=========================*/

fileInput.addEventListener("change", function (e) {

    const file = e.target.files[0];

    if (!file) return;

    selectedFile = file;
    currentComplaint = null;
    analysisPanel.style.display = "none";

    const reader = new FileReader();

    reader.onload = function (event) {
        preview.src = event.target.result;
        preview.style.display = "block";
        placeholder.style.display = "none";
        retakeBtn.style.display = "inline-block";
        analyzeBtn.style.display = "inline-block";
    };

    reader.readAsDataURL(file);

});

["title", "location"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
        currentComplaint = null;
        analysisPanel.style.display = "none";
        if (id === "location" && locationWasDetected) {
            locationWasDetected = false;
            locationStatus.textContent = "Location edited manually.";
        }
    });
});

detectLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        locationStatus.textContent = "Location detection is not supported by this browser.";
        return;
    }

    detectLocationBtn.disabled = true;
    locationStatus.textContent = "Requesting your current location...";

    navigator.geolocation.getCurrentPosition(
        async position => {
            const { latitude, longitude, accuracy } = position.coords;
            const coordinates = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
            locationInput.value = coordinates;
            locationWasDetected = false;
            locationInput.dispatchEvent(new Event("input", { bubbles: true }));
            locationStatus.textContent = "Finding the nearby place name...";

            try {
                const url = new URL("https://nominatim.openstreetmap.org/reverse");
                url.search = new URLSearchParams({
                    format: "jsonv2",
                    lat: latitude,
                    lon: longitude,
                    zoom: "18",
                    addressdetails: "1"
                });
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Reverse geocoding failed (${response.status})`);
                }

                const result = await response.json();
                const address = result.address || {};
                const locality = address.neighbourhood
                    || address.suburb
                    || address.city_district
                    || address.village
                    || address.town
                    || address.city
                    || address.municipality
                    || address.county;
                const placeName = [
                    result.name || address.road || locality,
                    locality,
                    address.city || address.town || address.village,
                    address.state
                ].filter((part, index, parts) => part && parts.indexOf(part) === index).slice(0, 3).join(", ");

                if (!placeName) {
                    throw new Error("No nearby place name was returned");
                }

                locationInput.value = placeName;
                locationInput.dispatchEvent(new Event("input", { bubbles: true }));
                locationWasDetected = true;
                locationStatus.textContent = `Place detected (GPS accuracy about ${Math.round(accuracy)} m). Edit if needed.`;
            } catch (error) {
                console.error("Could not look up the current place name:", error);
                locationStatus.textContent = "Place name could not be loaded. Coordinates were kept; you can enter a place name manually.";
            }

            detectLocationBtn.disabled = false;
        },
        error => {
            const messages = {
                1: "Location permission was denied. Allow access in your browser settings or enter it manually.",
                2: "Your location is currently unavailable. Try again or enter it manually.",
                3: "Location detection timed out. Try again or enter it manually."
            };
            locationStatus.textContent = messages[error.code] || "Could not detect your location. Enter it manually.";
            detectLocationBtn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
});


/*=========================
RETAKE IMAGE
=========================*/

retakeBtn.onclick = function () {
    selectedFile = null;
    currentComplaint = null;
    preview.style.display = "none";
    placeholder.style.display = "block";
    analysisPanel.style.display = "none";
    retakeBtn.style.display = "none";
    analyzeBtn.style.display = "none";
    fileInput.value = "";
};


/*=========================
AI ANALYSIS
=========================*/

analyzeBtn.onclick = async function () {

    if (!selectedFile) {
        alert("Please upload image first");
        return;
    }

    const title = document.getElementById("title").value.trim();
    const location = document.getElementById("location").value.trim();

    if (title === "" || location === "") {
        alert("Please enter title and location.");
        return;
    }

    const token = getToken();
    if (!token) return;

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    currentComplaint = null;
    analysisPanel.style.display = "none";

    const formData = new FormData();
    formData.append("title", title);
    formData.append("location", location);
    formData.append("image", selectedFile);

    try {

        const response = await fetch(`${API_BASE}/complaints/analyze`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail);
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = "Analyze with AI";
            return;
        }

        currentComplaint = {
            analysis_id: data.analysis_id,
            title,
            location,
            description: data.ai_analysis.description,
            department: data.ai_analysis.department,
            severity: data.ai_analysis.severity
        };

        document.getElementById("resType").textContent = data.ai_analysis.problem;
        document.getElementById("resSeverity").textContent = data.ai_analysis.severity;
        document.getElementById("resDept").textContent = data.ai_analysis.department;
        document.getElementById("resDescription").textContent = data.ai_analysis.description;
        document.getElementById("resPriority").textContent = data.ai_analysis.severity;
        document.getElementById("resLocation").textContent = location;

        analysisPanel.style.display = "block";
        analysisPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {
        console.log(error);
        alert("Server Connection Failed");
    }

    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze with AI";

};


/*=========================
SUBMIT COMPLAINT
=========================*/

submitBtn.onclick = async function () {

    if (!currentComplaint) {
        alert("Please analyze the image first.");
        return;
    }

    const token = getToken();
    if (!token) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const note = document.getElementById("note").value.trim();

    try {

        const response = await fetch(`${API_BASE}/complaints`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                analysis_id: currentComplaint.analysis_id,
                note
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            alert(errData.detail || "Failed to submit complaint");
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Complaint";
            return;
        }

        toast.style.display = "block";

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1200);

    } catch (error) {
        console.log(error);
        alert("Server Connection Failed");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Complaint";
    }

};