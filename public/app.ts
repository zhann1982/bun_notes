const authSection = document.getElementById("auth-section") as HTMLElement;
const appSection = document.getElementById("app-section") as HTMLElement;
const currentUser = document.getElementById("current-user") as HTMLElement;
const messageEl = document.getElementById("message") as HTMLElement;
const notesList = document.getElementById("notes-list") as HTMLElement;

const registerForm = document.getElementById(
  "register-form",
) as HTMLFormElement;
const loginForm = document.getElementById("login-form") as HTMLFormElement;
const noteForm = document.getElementById("note-form") as HTMLFormElement;
const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;

function setMessage(text: string, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? "crimson" : "green";
}

function showAuth() {
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
}

function showApp(username: string) {
  currentUser.textContent = username;
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = (await res.json()) as T;

  if (!res.ok) {
    const errorMessage =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed";

    throw new Error(errorMessage);
  }

  return data;
}

type MeResponse = {
  user: {
    id: number;
    username: string;
  };
};

async function loadMe() {
  try {
    const data = await api<MeResponse>("/api/me");
    showApp(data.user.username);
    await loadNotes();
  } catch {
    showAuth();
  }
}

async function loadNotes() {
  const data = await api<{
    notes: { id: number; title: string; description: string }[];
  }>("/api/notes");
  notesList.innerHTML = "";

  if (!data.notes.length) {
    notesList.innerHTML = "<p>No notes yet.</p>";
    return;
  }

  data.notes.forEach((note) => {
    const item = document.createElement("div");
    item.className = "note";

    item.innerHTML = `
      <h3>${escapeHtml(note.title)}</h3>
      <p>${escapeHtml(note.description)}</p>
      <button data-id="${note.id}">Delete</button>
    `;

    const btn = item.querySelector("button") as HTMLButtonElement;
    btn.addEventListener("click", async () => {
      try {
        await api(`/api/notes/${note.id}`, { method: "DELETE" });
        setMessage("Note deleted");
        await loadNotes();
      } catch (err: unknown) {
        setMessage((err as Error).message, true);
      }
    });

    notesList.appendChild(item);
  });
}

function escapeHtml(str: string) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = (
    document.getElementById("register-username") as HTMLInputElement
  ).value.trim();
  const password = (
    document.getElementById("register-password") as HTMLInputElement
  ).value.trim();

  try {
    await api("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    setMessage("Registration successful");
    registerForm.reset();
  } catch (err: unknown) {
    setMessage((err as Error).message, true);
  }
});

type User = {
  id: number;
  username: string;
};

type LoginResponse = {
  message: string;
  user: User;
};

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = (
    document.getElementById("login-username") as HTMLInputElement
  ).value.trim();
  const password = (
    document.getElementById("login-password") as HTMLInputElement
  ).value.trim();

  //   try {
  //     const data = await api("/api/login", {
  //       method: "POST",
  //       body: JSON.stringify({ username, password }),
  //     });

  //     setMessage("Login successful");
  //     showApp(data.user.username);
  //     loginForm.reset();
  //     await loadNotes();
  //   } catch (err: unknown) {
  //     setMessage((err as Error).message, true);
  //   }

  try {
    const data = await api<LoginResponse>("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    setMessage("Login successful");
    showApp(data.user.username);
    loginForm.reset();
    await loadNotes();
  } catch (err: unknown) {
    if (err instanceof Error) {
      setMessage(err.message, true);
    } else {
      setMessage("Something went wrong", true);
    }
  }
});

noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = (
    document.getElementById("note-title") as HTMLInputElement
  ).value.trim();
  const description = (
    document.getElementById("note-description") as HTMLInputElement
  ).value.trim();

  try {
    await api("/api/notes", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });

    setMessage("Note created");
    noteForm.reset();
    await loadNotes();
  } catch (err: unknown) {
    setMessage((err as Error).message, true);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST" });
    setMessage("Logged out");
    showAuth();
    notesList.innerHTML = "";
  } catch (err: unknown) {
    setMessage((err as Error).message, true);
  }
});

loadMe();
