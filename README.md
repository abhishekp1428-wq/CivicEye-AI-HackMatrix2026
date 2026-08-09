# 🚨 CivicEye AI

### AI-Powered Civic Issue Detection Platform

**Hackathon:** HackMatrix 2K26
**Team Name:** Techno
**Developer:** Abhishek Patel
**Organized by:** IEEE Computer Society SBC, MITS Gwalior

---

## 📌 Problem Statement

Citizens regularly encounter civic issues such as potholes, damaged roads, garbage accumulation, and broken street lights. Reporting these problems often requires citizens to manually identify the issue and provide proper information about it.

This can make the reporting process time-consuming and may result in incomplete or unclear information.

There is a need for a simple system that can use Artificial Intelligence to analyze civic issue images and provide meaningful information about the detected problem.

---

## 💡 Solution Overview

**CivicEye AI** is an AI-powered platform designed to analyze images of civic infrastructure problems.

A user can upload an image of a civic issue, and the AI analyzes the image to identify important information such as:

* 🔍 Type of civic problem
* ⚠️ Severity of the problem
* 🏢 Relevant department
* 📝 Description of the detected issue

The analyzed information can then be used as a foundation for a structured civic complaint system.

### 🔄 Current Workflow

```text
User
  ↓
Login / Register
  ↓
Upload Civic Issue Image
  ↓
AI Image Analysis
  ↓
Problem Detection
  ↓
Severity Detection
  ↓
Department Detection
  ↓
Issue Description
  ↓
Display Result
```

---

## ✨ Current Features

### 👤 User Authentication

* User Registration
* User Login
* JWT-based authentication
* Secure password handling

### 📸 Image Upload

Users can upload an image of a civic issue for AI analysis.

### 🤖 AI Image Analysis

The system analyzes the uploaded image and identifies:

* Problem type
* Severity
* Responsible department
* Problem description

### 📊 Dashboard

The platform provides a dashboard for viewing relevant civic issue information and system statistics.

### 🛠️ Admin Functionality

The project includes admin-side functionality for managing and monitoring reported civic issues.

---

## 🧠 AI Analysis

CivicEye AI uses an AI-powered image analysis system to understand uploaded civic issue images.

### Processing Pipeline

```text
Image Upload
      ↓
Image Processing
      ↓
AI Vision Analysis
      ↓
Problem Identification
      ↓
Severity Analysis
      ↓
Department Identification
      ↓
Description Generation
      ↓
Structured Result
```

The current implementation uses the **Groq API** for AI-based image analysis.

---

## 🏗️ Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy
* JWT Authentication

### Database

* MySQL

### AI

* Groq API
* Vision-capable AI model
* Image analysis

### Development Tools

* Git
* GitHub
* VS Code
* Uvicorn
* MySQL Workbench

---

## 📂 Project Structure

```text
CivicEye-AI/
│
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── complaint.py
│   │   └── dashboard.py
│   │
│   ├── services/
│   │   └── analyze_image.py
│   │
│   └── uploads/
│
├── frontend/
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

```bash
cd CivicEye-AI
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

For Windows PowerShell:

```powershell
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=mysql+pymysql://USERNAME:PASSWORD@localhost/DATABASE_NAME
SECRET_KEY=YOUR_SECRET_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

⚠️ Do not upload `.env` or API keys to GitHub.

### 5. Start the Backend

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API Documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 🚀 Future Scope

The following features are planned for future versions of CivicEye AI:

### 📍 Location Tracking

* Automatic GPS location detection
* Location-based complaint information
* Map integration

### 📝 Automatic Complaint Generation

* AI-generated complaint text
* Structured complaint reports
* Professional PDF complaint reports

### 📧 Authority Communication

* Automatic email to the responsible department
* SMS / WhatsApp notifications
* Complaint forwarding system

### 📊 Advanced Analytics

* District-level issue analytics
* Area-wise civic problem mapping
* Complaint statistics and trends

### 🎤 Voice Complaints

* Voice-based complaint registration
* Hindi and English voice support

### 🤖 Multi-AI Verification

Multiple AI models can be integrated in the future to:

* Verify AI predictions
* Cross-check issue classification
* Improve detection accuracy
* Reduce incorrect classifications

---

## 🎯 Expected Impact

CivicEye AI aims to reduce the effort required to understand and report civic infrastructure problems.

By using AI-based image analysis, the system can convert an ordinary civic issue image into structured information that can eventually become part of a complete civic complaint workflow.

---

## 🎥 Live Demonstration

**Live Demo:** `ADD_LIVE_DEMO_LINK`

**Demo Video:** `ADD_DEMO_VIDEO_LINK`

---

## 📦 Repository

 **GitHub Repository:** https://github.com/abhishekp1428-wq/CivicEye-AI-HackMatrix2026

---

## 👨‍💻 Team

### Team Techno

**Abhishek Patel**
Solo Developer

### Responsibilities

* Frontend Development
* Backend Development
* Database Design
* AI Integration
* Authentication
* API Development
* Testing & Debugging
* Project Documentation

---

## 📜 Hackathon

This project is developed for:

### HackMatrix 2K26

**IEEE Computer Society SBC, MITS Gwalior**

---

## ⭐ Conclusion

**CivicEye AI** is an AI-powered civic issue detection platform that helps identify and analyze public infrastructure problems from images.

The current system focuses on **AI-based civic issue analysis**, while features such as **location tracking, automatic complaint generation, authority communication, advanced analytics, and voice complaints** are planned for future development.

> **Upload the issue. Let AI understand it.**

---

### Built for HackMatrix 2K26 🚀

**Team Techno | Abhishek Patel**
