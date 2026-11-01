# Run CivicEye AI locally

## 1. Install Python dependencies

From the project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 2. Configure optional AI image analysis

The app uses a local SQLite database by default and can start without AI credentials. To enable image analysis, add your Groq key to the root `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
```

To use MySQL instead of SQLite, also set `DATABASE_URL`, for example:

```env
DATABASE_URL=mysql+pymysql://username:password@127.0.0.1:3306/civil_ai
```

Create the MySQL database first. Leave `DATABASE_URL` unset to use `civiceye.db` in the project root.

## 3. Start the backend

In one terminal, from the project root:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: <http://127.0.0.1:8000/docs>

## 4. Start the frontend

In a second terminal, from the project root:

```bash
python3 -m http.server 5500 --directory app/templets
```

Open <http://127.0.0.1:5500/html/login.html> and register an account first. Admin features require an account whose `userdata.is_admin` value is set to `1` in the local database.

The image upload and AI analysis page requires `GROQ_API_KEY`; registration, login, dashboard, reports, and profile management work without it.
