import { api, saveSession } from "../api.js";

export default function loginPage() {
  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";
  let mode = "login";

  function draw(message) {
    wrap.innerHTML = `
      <div class="page-head">
        <h1>${mode === "login" ? "Welcome back" : "Create an account"}</h1>
        <p>Guests book rooms, staff manage them. Same door, different keys.</p>
      </div>
      <div class="card stack">
        <div class="tabs">
          <button type="button" data-mode="login" aria-pressed="${mode === "login"}">Log in</button>
          <button type="button" data-mode="register" aria-pressed="${mode === "register"}">Sign up</button>
        </div>
        ${message ? `<p class="notice bad">${message}</p>` : ""}
        <form class="stack">
          ${
            mode === "register"
              ? '<div class="field"><label for="name">Full name</label><input id="name" name="name" required /></div>'
              : ""
          }
          <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" minlength="6" required />
          </div>
          <button class="primary" type="submit">${mode === "login" ? "Log in" : "Sign up"}</button>
        </form>
        <!-- <p class="muted">Demo staff login: admin@rajshahigrand.com / admin123</p> -->
      </div>
    `;

    wrap.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        mode = button.dataset.mode;
        draw();
      });
    });

    wrap.querySelector("form").addEventListener("submit", submit);
  }

  async function submit(event) {
    event.preventDefault();
    const form = event.target;
    const payload = Object.fromEntries(new FormData(form));
    form.querySelector("button[type=submit]").disabled = true;

    try {
      const { token, user } = await api(`/auth/${mode}`, {
        method: "POST",
        body: payload,
      });
      saveSession(token, user);
      const next = sessionStorage.getItem("hrs.next");
      sessionStorage.removeItem("hrs.next");
      location.hash = `#${next || "/"}`;
    } catch (error) {
      draw(error.message);
    }
  }

  draw();
  return wrap;
}
