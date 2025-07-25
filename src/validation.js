import crypto from "crypto";
import * as db from "./database.js";
import { resolveMx } from 'dns/promises';
import { Filter } from "bad-words";

const genToken = () => crypto.randomBytes(32).toString("hex");

// Validate names
const badWords = new Filter();

export function checkName(name, event) {
  let isValid = true;
  let msg;
  if (name === "" && event === "submit") {
    msg = "Please enter a name";
    isValid = false;
  }
  const reg = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
  if (name.length >= 50) {
    msg = "Name is too long";
    isValid = false;
  } else if (!reg.test(name)) {
    msg = "Name contains invalid characters";
    isValid = false;
  } else if (badWords.isProfane(name)) {
    msg = "Profanity detected, try again";
    isValid = false;
  }
  return { isValid, msg };
}

// Validate usernames
export async function checkUsername(username, event) {
  let isValid = true;
  let msg;
  if (username === "" && event === "submit") {
    msg = "Please enter a username";
    isValid = false;
  }
  const reg = /^[a-z0-9_-]+$/;
  if (username.length <= 4) {
    msg = "Username is too short";
    isValid = false;
  } else if (username.length >= 32) {
    msg = "Username is too long";
    isValid = false;
  } else if (!reg.test(username)) {
    msg = "Name contains invalid characters";
    isValid = false;
  } else if (badWords.isProfane(username)) {
    msg = "Profanity detected, try again";
    isValid = false;
  } else if (await taken(username, "username")) {
    msg = "Sorry, that username is already taken";
    isValid = false;
  }
  return { isValid, msg };
}

// Validate email
export async function checkEmail(email, event) {
  let isValid = true;
  let msg;
  if (email === "" && event === "submit") {
    msg = "Please enter an email";
    isValid = false;
  }
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!reg.test(email)) {
    msg = "Invalid email, try again";
    isValid = false;
  } else if (await taken(email, "email")) {
    msg = "Email already in use";
    isValid = false;
  } else if (await invalidDomain(email)) {
    const domain = email.split('@')[1] || 'unknown';
    msg = `Invalid domain (${domain})`;
    isValid = false;
  }
  return { isValid, msg };
}

// Validate password
export async function checkPassword(password, event) {
  let isValid = true;
  let msg;
  if (password === "" && event === "submit") {
    msg = "Please enter a password";
    isValid = false;
  }
  const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}\-_=+\\|;:'",.<>/?]).{8,64}$/;
  if (password.length >= 64) {
    msg = "Password is too long";
    isValid = false;
  } else if (!reg.test(password)) {
    msg = `
    Your password must include:
    <ul>
      <li>8–64 characters</li>
      <li>One uppercase letter</li>
      <li>One number</li>
      <li>One special character</li>
    </ul>`;
    isValid = false;
  } else if (await badPassword(password)) {
    msg = "Password is too weak";
    isValid = false;
  }
  return { isValid, msg };
}

// Check if password phrases are unsecure
async function badPassword(password) {
  password = password
    .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
    .toLowerCase();
  return process.env.BAD_PASS.includes(password);
}

// Check if item already in database
export async function taken(value, toSelect) {
  if (toSelect === "username") {
    if (process.env.RES_USER.includes(value)) {
      return true; 
    }
  }
  const taken = await db.query(`
      SELECT *
      FROM users
      WHERE username = ? OR email = ?
    `, [value, value]);
  return taken.found || false;
}

// Check if email doesn't have a valid domain
export async function invalidDomain(email) {
  const domain = email.split('@')[1];
  try {
    const mx = await resolveMx(domain);
    return mx.length === 0;
  } catch (err) {
    console.log("❌ Failed to check invalid domain", err);
    return true; 
  }
}

export async function startSession(req, res, userID) {
  const sessionID = genToken();
  res.cookie("user_id", userID);
  res.cookie("session_id", sessionID);
  await db.query(`
      INSERT INTO sessions
      (user_id, session_id, ip_address)
      VALUES (?, ?, ?)
    `, [userID, sessionID, req.ip]);
  result.success = true;
}