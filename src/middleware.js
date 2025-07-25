import crypto from "crypto";
import * as db from "./database.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const maxAge = (days) => 1000 * 60 * 60 * 24 * days;
const genToken = () => crypto.randomBytes(32).toString("hex");

// ----------
// Make sure cookies are enabled
// ----------
export async function cookies(req, res, next) {
  // Check if cookies enabled
  if (!req.cookies["cookies_enabled"]) {
    // If not, set a cookie
    res.cookie("cookies_enabled", "1", { maxAge: maxAge(1), httpOnly: true });
    // Check if a token is in the query string
    const tokenQS = req.query.cookie_token;
    // If not, make one and add it to cookie test table
    if (!tokenQS) {
      const token = genToken();
      await db.query(`
          INSERT INTO cookie_tests
          (ip_address, cookie_token)
          VALUES (?, ?)
        `, [req.ip, token])
      // Then redirect to test new cookies
      const separator = req.originalUrl.includes("?") ? "&" : "?";
      const redirectUrl = `${req.originalUrl}${separator}cookie_token=${encodeURIComponent(token)}`;
      return res.redirect(redirectUrl);
    }
    // Once test returns with query string, check the test table
    const [tokenDB] = await db.query(`
        SELECT cookie_token
        FROM cookie_tests
        WHERE cookie_token = ?
      `, [tokenQS]);
    // If token is not found, send 404 page
    if (tokenDB.length === 0) return res.sendFile(path.join(__dirname, "../public/404"));
    // If token exists and cookies do not, send cookies required page
    return res.sendFile(path.join(__dirname, "../public/cookies-required"));
  }
  return next();
}

// ----------
// Make sure javascript is enabled
// ----------
export function js(req, res, next) {
  // Check js enabled cookie exists
  if (!req.cookies["js_enabled"]) {
    // If not, send then js required file to test js
    return res.sendFile(path.join(__dirname, "../public/js-required"));
  }
  return next();
}

// ----------
// Check if a session exists
// ----------
export async function session(req, res, next) {
  res.session = false;
  // Check if required session cookies exist
  const userID = req.cookies["user_id"];
  const sessionID = req.cookies["session_id"];
  if (userID && sessionID) {
    // If they do, check sessions table
    const [session] = await db.query(`
        SELECT *
        FROM sessions
        WHERE user_id = ? AND session_id = ?
      `, [userID, sessionID]);
    // If found, check if it's expired
    if (session.length > 0) {
      const now = new Date();
      // If it's expired, clear the cookies
      if (now > session[0].expires_at) {
        res.clearCookie("user_id");
        res.clearCookie("session_id");
      } else {
        // Otherwise, mark existing session and extend expiry
        res.session = true;
        const newExpiry = db.mysqlTime(now + maxAge(7));
        await db.query(`
            UPDATE sessions
            SET expires_at = ?
            WHERE user_id = ? AND session_id = ?
          `, [newExpiry, userID, sessionID]);
      }
    }
  }
  return next();
}