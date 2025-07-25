import "./defaults.js";
import * as func from "./functions.js";

// Select all form inputs
const loginInputs = {
  emailusername: func.$("#emailusername"),
  password: func.$("#password")
};

// Handle showing and hiding passwords
const showPasswordButton = func.$("#show-password");
showPasswordButton.addEventListener("click", () => {
  const input = loginInputs.password;
  const type = input.type;
  const img = showPasswordButton.querySelector("img");
  if (type === "text") {
    input.type = "password";
    img.src = "./img/show-password-icon.svg";
  } else {
    input.type = "text";
    img.src = "./img/hide-password-icon.svg";
  }
});
