# Bun Notes App

A full-stack notes application built with **Bun**, **SQLite**, and **bcrypt**.

## Features

* User registration
* User login
* Password hashing with bcrypt
* Session tokens with cookies
* Create notes with title and description
* Delete notes
* Each user can see only their own notes
* SQLite local database

---

## Tech Stack

* **Bun**
* **TypeScript**
* **SQLite**
* **bcrypt**
* **HTML / CSS / TypeScript**

---

## Project Structure

```text
bun_notes/
├─ public/
│  ├─ index.html
│  ├─ app.ts
│  └─ styles.css
├─ src/
│  ├─ server.ts
│  ├─ db.ts
│  └─ auth.ts
├─ package.json
├─ tsconfig.json
└─ notes.sqlite
```

---

## How to install and run this project in another folder

### 1. Clone the repository

Open terminal and run:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### 2. Go into the project folder

```bash
cd YOUR_REPO
```

### 3. Install dependencies

```bash
bun install
```

### 4. Run the development server

```bash
bun run dev
```

### 5. Open the project in browser

Open:

```text
http://localhost:3000
```

---

## Alternative: copy project into another folder manually

If you already downloaded the project as ZIP or copied files manually:

### 1. Open terminal in that folder

Example:

```bash
cd path/to/your/copied/project
```

### 2. Install dependencies

```bash
bun install
```

### 3. Run the project

```bash
bun run dev
```

### 4. Open in browser

```text
http://localhost:3000
```

---

## Requirements

Make sure you have these installed:

* [Bun](https://bun.sh/)
* Git

Check Bun version:

```bash
bun --version
```

---

## Notes about the database

This project uses a local SQLite database file:

```text
notes.sqlite
```

If the database file does not exist yet, it will be created automatically when the server starts.

If you want a fresh empty database, delete the old `notes.sqlite` file and run the project again.

---

## Install dependencies used in this project

If needed, you can install them manually:

```bash
bun add bcrypt
bun add -d @types/bun @types/bcrypt
```

Usually this is not necessary if `package.json` is already included and you run:

```bash
bun install
```

---

## Development script

Run dev mode:

```bash
bun run dev
```

Example `package.json` script:

```json
{
  "scripts": {
    "dev": "bun --hot src/server.ts"
  }
}
```

---

## How the app works

* Register a new user
* Login with username and password
* A session cookie is created
* Create personal notes
* Each user only sees their own notes

---

## Troubleshooting

### Port already in use

If port `3000` is busy, stop the other process using that port or change the port in `src/server.ts`.

### Dependencies are missing

Run:

```bash
bun install
```

### Database issues

Delete `notes.sqlite` and restart the server:

```bash
bun run dev
```

### TypeScript or Bun type errors

Install type packages:

```bash
bun add -d @types/bun @types/bcrypt
```

---

## Author

Built as a Bun full-stack notes project with authentication, sessions, and SQLite.
