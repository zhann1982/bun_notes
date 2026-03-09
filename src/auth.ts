import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const SESSION_DAYS = 7;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken() {
  return crypto.randomUUID();
}

export function createExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DAYS);
  return date.toISOString();
}

export function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}