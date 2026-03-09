import { Database } from "bun:sqlite";

export const db = new Database("notes.sqlite", { create: true });

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

export const createUserStmt = db.prepare(`
  INSERT INTO users (username, password_hash)
  VALUES (?, ?)
`);

export const findUserByUsernameStmt = db.prepare(`
  SELECT id, username, password_hash
  FROM users
  WHERE username = ?
`);

export const createSessionStmt = db.prepare(`
  INSERT INTO sessions (user_id, token, expires_at)
  VALUES (?, ?, ?)
`);

export const findSessionStmt = db.prepare(`
  SELECT s.id, s.user_id, s.token, s.expires_at, u.username
  FROM sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.token = ?
`);

export const deleteSessionStmt = db.prepare(`
  DELETE FROM sessions
  WHERE token = ?
`);

export const createNoteStmt = db.prepare(`
  INSERT INTO notes (user_id, title, description)
  VALUES (?, ?, ?)
`);

export const getNotesByUserStmt = db.prepare(`
  SELECT id, title, description, created_at, updated_at
  FROM notes
  WHERE user_id = ?
  ORDER BY id DESC
`);

export const deleteNoteStmt = db.prepare(`
  DELETE FROM notes
  WHERE id = ? AND user_id = ?
`);