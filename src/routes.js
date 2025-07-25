import express from "express";
import path from "path";
import bcrypt from "bcrypt";
import * as db from "./database.js";
import * as mid from "./middleware.js";
import * as val from "./validation.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const router = express.Router();

router.get("*", mid.cookies, mid.js, mid.session, (req, res) => {
  // Clean the path
  const filePath = req.path.replace(/\.[^/.]+$/, "");
  // Redirect off certain pages based on session status
  if (res.session) {
    const toDashboard = ["/login", "/signup"];
    if (toDashboard.includes(filePath)) return res.sendFile(path.join(__dirname, "../public/dashboard"));
  } else {
    const toLogin = ["/dashboard", "/profile"];
    if (toLogin.includes(filePath)) return res.sendFile(path.join(__dirname, "../public/login"));
  }
  // Otherwise, send requested page, or error to 404
  return res.sendFile(path.join(__dirname, `../public${filePath}`), (err) => {
    if (err) res.sendFile(path.join(__dirname, `../public/404`));
  });
});

router.post("/js-enabled", (req, res) => {
  res.cookie("js_enabled", "1", { maxAge: maxAge(1), httpOnly: true });
  res.sendStatus(204);
});

router.post("/auth/signup", async (req, res) => {
  let result = {};
  result.success = false;
  const { data } = req.body;
  // Validate each input value
  for (const [key, value] of Object.entries(data)) {
    switch (key) {
      case "firstname":
      case "lastname":
        result[key] = val.checkName(value, data.event);
        break;
      case "username":
        result[key] = await val.checkUsername(value, data.event);
        break;
      case "email":
        result[key] = await val.checkEmail(value, data.event);
        break;
      case "password":
        result[key] = val.checkPassword(value, data.event);
        break;
    }
  }
  // Check if result has all verified inputs
  if (Object.keys(result).length === 5) {
    // If so, check if all values are true
    if (Object.values(result).every(v => v.isValid)) {
      // If so, add user into database
      const passwordHash = await bcrypt.hash(data.password, 12);
      const [inserted] = await db.query(`
          INSERT INTO users
          (username, email, first_name, last_name, password_hash)
          VALUES (?, ?, ?, ?, ?)
        `, [
          data.username, 
          data.email, 
          data.firstname, 
          data.lastname,
          passwordHash
        ]);
      // Then create a new session
      const userID = inserted.insertId;
      await val.startSession(req, res, userID);
    }
  }
  return res.json(result);
});

router.post("/auth/login", async (req, res) => {
  let result = {};
  result.success = false;
  const { data } = req.body;
  // Query for user
  const [rows] = await db.query(`
      SELECT *
      FROM users
      WHERE username = ? OR email = ?
    `, [data.emailusername, data.emailusername]);
  const user = rows[0];
  // If they don't exist, mark an error
  if (!user) {
    result.emailusername = { isValid: false, msg: "User not found" };
  } else {
    // Otherwise, compare passwords
    const match = await bcrypt.compare(data.password, user.password_hash);
    if (!match) {
      // If they don't match, mark an error
      result.password = { isValid: false, msg: "Password is incorrect" };
    }
  }
  // Then check if each result value is valid
  if (Object.values(result).every(v => v.isValid)) {
    // If so, start a session and return success
    const userID = user.user_id;
    await val.startSession(req, res, userID);
    result.success = true;
  }
  return res.json(result);
});

export default router;