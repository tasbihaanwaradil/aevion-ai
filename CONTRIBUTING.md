# Aevion AI – Git & Collaboration Workflow

This document explains the **step-by-step Git workflow** for contributing to the Aevion AI Final Year Project.  
All team members must follow this workflow to keep the code clean and stable.

---

## 1. Repository Overview

### Branches Used

- **main** → Final, stable, submission-ready code  
- **dev** → Development & integration branch  
- **feature/** → Individual feature work (frontend or backend)

⚠️ Never work directly on `main`

---

## 2. First-Time Setup (For New Contributors)

### Step 1: Clone the Repository

```bash
git clone https://github.com/tasbihaanwaradil/aevion-ai.git
cd aevion-ai
```

---

### Step 2: Switch to Development Branch

```bash
git fetch
git checkout dev
git pull origin dev
```

---

## 3. Starting New Work (VERY IMPORTANT)

### Step 3: Create a Feature Branch

Each feature must have its **own branch**.

```bash
git checkout -b feature/feature-name
```

### Examples

```bash
git checkout -b feature/home-page
git checkout -b feature/login-page
git checkout -b feature/backend-setup
git checkout -b feature/auth-api
```

---

## 4. Running the Project Locally

### 4.1 Frontend Setup (Client)

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

### 4.2 Backend Setup (Server)

Open a **new terminal**:

```bash
cd server
npm install
```

#### Create `.env` File (REQUIRED)

Create a file named `.env` inside the `server` folder:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key
```

⚠️ `.env` must **never** be committed to GitHub.

---

#### Run Backend Server

```bash
npm run dev
```

Backend runs on:

```
http://localhost:3000
```

Expected logs:

```
MongoDB connected
Server running on port 5000
```

---

## 5. Working on the Project

Make changes **only related to your assigned feature**.

- Frontend work → `client/`
- Backend work → `server/`

---

## 6. Saving Your Work

### Step 6.1: Check Changes

```bash
git status
```

---

### Step 6.2: Add & Commit Changes

```bash
git add .
git commit -m "Add login page UI"
```

✔️ Use clear commit messages  
❌ Do not commit `.env` or `node_modules`

---

## 7. Push Feature Branch to GitHub

```bash
git push origin feature/feature-name
```

Example:

```bash
git push origin feature/login-page
```

---

## 8. Create Pull Request (PR)

1. Go to the GitHub repository  
2. Click **Compare & Pull Request**  
3. **From:** `feature/feature-name`  
4. **To:** `dev`  
5. Add a short description  
6. Create Pull Request  

❌ Do NOT merge into `main`

---

## 9. Reviewing & Testing a Feature (Team Lead)

```bash
git checkout dev
git pull origin dev
git fetch origin
git checkout feature/feature-name
```

### Test Frontend

```bash
cd client
npm run dev
```

### Test Backend (if applicable)

```bash
cd server
npm run dev
```

✔️ UI works  
✔️ API works  
✔️ No console errors  

---

## 10. Merging Rules

- Feature → `dev` (after review & testing)  
- `dev` → `main` (only when project is stable)

---

## 11. Basic Rules to Follow

✔ One feature = one branch  
✔ Pull request required  
✔ No direct push to `main`  
✔ Test before merging  
✔ Keep commits clean  

---

## 12. Why This Workflow?

- Prevents breaking the main project  
- Allows parallel work  
- Makes collaboration easy  
- Follows industry best practices  
- Ideal for Final Year Project evaluation  

---

## Maintained By

**Tasbiha Anwar Adil**  
Team Lead – Aevion AI

