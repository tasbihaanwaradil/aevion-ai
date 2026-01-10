# Aevion AI – Git & Collaboration Workflow

This document explains the **step-by-step Git workflow** for contributing to the Aevion AI Final Year Project.
All team members must follow this workflow to keep the code clean and stable.

---

## 1. Repository Overview

### Branches Used

* **main** → Final, stable, submission-ready code
* **dev** → Development & integration branch
* **feature/** → Individual feature work (home, login, agents, etc.)

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
git checkout -b feature/academic-email-writer
```

---

## 4. Working on the Project

### Step 4: Go to Client Folder

```bash
cd client
npm install
npm run dev
```

Make your changes **only related to your feature**.

---

## 5. Saving Your Work

### Step 5: Check Changes

```bash
git status
```

---

### Step 6: Add & Commit Changes

```bash
git add .
git commit -m "Add login page UI"
```

✔️ Write clear commit messages
❌ Do not commit unrelated files

---

## 6. Push Feature Branch to GitHub

```bash
git push origin feature/feature-name
```

Example:

```bash
git push origin feature/login-page
```

---

## 7. Create Pull Request (PR)

1. Go to GitHub repository
2. Click **Compare & Pull Request**
3. **From:** `feature/feature-name`
4. **To:** `dev`
5. Add short description of changes
6. Create Pull Request

❌ Do NOT merge into `main`

---

## 8. Reviewing & Testing a Feature (Team Lead)

Before merging a feature into `dev`:

```bash
git checkout dev
git pull origin dev
git fetch origin
git checkout feature/feature-name
cd client
npm run dev
```

✔️ Test UI
✔️ Check console errors
✔️ Review code

---

## 9. Merging Rules

* Feature → dev (after review & testing)
* dev → main (only when project is stable and ready)

---

## 10. Basic Rules to Follow

✔️ One feature = one branch
✔️ Pull request required
✔️ No direct push to `main`
✔️ Test before merging
✔️ Keep commits clean

---

## 11. Why This Workflow?

* Prevents breaking the main project
* Allows parallel work
* Makes collaboration easy
* Follows industry best practices
* Ideal for Final Year Project evaluation

---

## Maintained By

**Tasbiha Anwar Adil**
Team Lead – Aevion AI
