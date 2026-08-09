/*==================================================
        CIVICEYE AI
        UPLOAD JAVASCRIPT
==================================================*/

const API_BASE = "http://127.0.0.1:8000";

const captureBox = document.getElementById("captureBox");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const placeholder = document.getElementById("placeholder");
const retakeBtn = document.getElementById("retakeBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const analysisPanel = document.getElementById("analysisPanel");
const submitBtn = document.getElementById("submitBtn");
const toast = document.getElementById("toast");

let selectedFile = null;
let currentComplaint = null;

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

    const formData = new FormData();
    formData.append("title", title);
    formData.append("location", location);
    formData.append("image", selectedFile);

    try {

        const response = await fetch(`${API_BASE}/complaints`, {
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

        currentComplaint = data.complaint;

        document.getElementById("resType").textContent = data.ai_analysis.problem;
        document.getElementById("resSeverity").textContent = data.ai_analysis.severity;
        document.getElementById("resDept").textContent = data.ai_analysis.department;
        document.getElementById("resDescription").textContent = data.ai_analysis.description;
        document.getElementById("resPriority").textContent = data.ai_analysis.severity;
        document.getElementById("resLocation").textContent = location;

        analysisPanel.style.display = "block";

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

    const finalDescription = note
        ? `${currentComplaint.description}\n\nAdditional Note: ${note}`
        : currentComplaint.description;

    try {

        const response = await fetch(`${API_BASE}/complaints/${currentComplaint.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: currentComplaint.title,
                description: finalDescription,
                image: currentComplaint.image,
                location: currentComplaint.location,
                department: currentComplaint.department
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