import "./defaults.js";
import * as func from "./functions.js";

// Select all form inputs
const signupInputs = {
  firstname: func.$("#firstname"),
  lastname: func.$("#lastname"),
  username: func.$("#username"),
  email: func.$("#email"),
  password: func.$("#password")
};

// Handle showing and hiding passwords
const showPasswordButton = func.$("#show-password");
showPasswordButton.addEventListener("click", () => {
  const input = signupInputs.password;
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

// Helper for input validation
async function validate(event) {
  let data = {};
  if (event.type === "focusout") {
    const input = event.target;
    input.value = input.value.trim();
    data[input.id] = input.value;
  } else {
    for (const [key, input] of Object.entries(signupInputs)) {
      input.value = input.value.trim();
      data[input.id] = input.value;
    }
  }
  data["event"] = event.type;
  return result = await func.postData("/auth/signup", { data });
}

// Helper for styling
function styleInputs(data) {
  for (const [key, value] of Object.entries(data)) {
    if (Object.keys(signupInputs).includes(key)) {
      func.inputStyling(signupInputs[key], value.isValid, value.msg);
    }
  }
}

Object.entries(signupInputs).forEach(([key, input]) => {
  input.addEventListener("focusout", async (event) => {
    const result = await validate(event);
    if (!result.success) styleInputs(result);
  });
});

const signupForm = func.$("#signup-form");
signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const result = await validate(event);
  if (!result.success) return styleInputs(result);
  location.href = "/dashboard";
});
