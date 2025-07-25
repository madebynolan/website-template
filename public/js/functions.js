export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => document.querySelectorAll(sel);

export async function getData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("GET failed:", error);
    return null;
  }
}

export async function postData(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("POST failed:", error);
    return null;
  }
}

export function inputStyling(input, isValid, msg) {
  const isPassword = input.id === "password";
  const container = isPassword ? input.closest("#password-wrapper") : input;
  if (!isValid) {
    setErrorMsg(input, msg);
    container.classList.add("error");

    if (isPassword) {
      const lis = container.querySelectorAll("li");
      const errors = passwordCriteria(input.value);
      lis.forEach((li, i) => {
        if (errors[i]) li.innerHTML = `<s>${li.textContent}</s>`;
      });
    }
  } else {
    container.classList.add("valid");
  }
  setIcon(input, isValid);
  input.addEventListener("mousedown", async () => {
    clearErrorStyling(input);
  }, { once: true });
}

export function clearErrorStyling(input) {
  const isPassword = input.id === "password";
  const container = isPassword ? input.closest("#password-wrapper") : input;
  container.classList.remove("error", "valid");
  const parent = input.closest("div");
  parent.querySelector(".icon")?.remove();
  parent.querySelector(".error-msg")?.remove();
}

export function banStyling(input, verification, insertInto, insertBefore) {
  if ($(".ban-msg")) {
    return;
  }
  input.readOnly = true;
  input.style.cursor = "default";
  input.style.color = "rgb(80, 80, 80)";
  if (input.id === "password") {
    const banDiv = document.createElement("div");
    banDiv.classList.add("ban-msg");
    const banMsg = 
      verification.tempBan ? 
      "Too many login attempts, try again later" :
      `"You have been locked out. Please email us at contact@email.com"`;
    banDiv.innerHTML = banMsg;
    insertInto.insertBefore(banDiv, $(insertBefore));
  }
}

function setIcon(input, isValid) {
  input.querySelector(".icon")?.remove();
  const icon = document.createElement("img");
  icon.classList.add("icon");
  icon.src = `./assets/img/${isValid ? "valid" : "error"}-icon.svg`;
  const container = input.closest("div");
  icon.style.top = `${(container.clientHeight - 20) / 2}px`;
  if (!isValid) {
    const errorMsg = container.querySelector(".error-msg");
    icon.addEventListener("mouseenter", () => {
      errorMsg.classList.remove("hidden");
    });
    icon.addEventListener("mouseleave", () => {
      errorMsg.classList.add("hidden");
    });
  }
  container.append(icon);
}

function setErrorMsg(input, msg) {
  const errorMsg = document.createElement("div");
  errorMsg.classList.add("error-msg", "hidden");
  errorMsg.innerHTML = msg;
  const container = input.closest("div");
  container.querySelector(".error-msg")?.remove();
  container.append(errorMsg);
  errorMsg.style.top = `-${errorMsg.clientHeight - 3}px`;
}

function passwordCriteria(value) {
  const hasLength = value.length >= 8 && value.length <= 64 ;
  const regCapital = /[A-Z]/;
  const hasCapital = regCapital.test(value);
  const regNumber = /[0-9]/;
  const hasNumber = regNumber.test(value);
  const regCharacter = /[!@#$%^&*()[\]{}\-_=+\\|;:'",.<>/?]/;
  const hasCharacter = regCharacter.test(value);
  return [hasLength, hasCapital, hasNumber, hasCharacter];
}
