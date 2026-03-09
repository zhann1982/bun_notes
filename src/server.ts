import app from "../public/index.html";
import {
  createNoteStmt,
  createSessionStmt,
  createUserStmt,
  deleteNoteStmt,
  deleteSessionStmt,
  findSessionStmt,
  findUserByUsernameStmt,
  getNotesByUserStmt,
} from "./db";
import {
  createExpiryDate,
  createSessionToken,
  hashPassword,
  isExpired,
  verifyPassword,
} from "./auth";

function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    status: init.status || 200,
  });
}

function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

function unauthorized(message = "Unauthorized") {
  return json({ error: message }, { status: 401 });
}

type AuthBody = {
  username?: string;
  password?: string;
  title?: string;
  description?: string;
};

async function getBody(req: Request): Promise<AuthBody | null> {
  try {
    return (await req.json()) as AuthBody;
  } catch {
    return null;
  }
}

function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = new Bun.CookieMap(cookieHeader);
  return cookies.get(name) ?? null;
}

function getCurrentUser(req: Request) {
  const token = getCookie(req, "session_token");
  if (!token) return null;

  const session = findSessionStmt.get(token) as
    | {
        id: number;
        user_id: number;
        token: string;
        expires_at: string;
        username: string;
      }
    | undefined;

  if (!session) return null;

  if (isExpired(session.expires_at)) {
    deleteSessionStmt.run(token);
    return null;
  }

  return {
    id: session.user_id,
    username: session.username,
    token: session.token,
  };
}

const server = Bun.serve({
  port: 3000,

  routes: {
    "/": app,
  },

  async fetch(req: Bun.BunRequest) {
    const url = new URL(req.url);
    const method = req.method;

    if (url.pathname === "/api/register" && method === "POST") {
      const body = await getBody(req);
      if (!body) return badRequest("Invalid JSON");

      const username = String(body.username || "").trim();
      const password = String(body.password || "").trim();

      if (!username || !password) {
        return badRequest("Username and password are required");
      }

      if (password.length < 6) {
        return badRequest("Password must be at least 6 characters");
      }

      const existingUser = findUserByUsernameStmt.get(username) as
        | { id: number }
        | undefined;

      if (existingUser) {
        return badRequest("Username already exists");
      }

      const passwordHash = await hashPassword(password);
      createUserStmt.run(username, passwordHash);

      return json({ message: "Registration successful" }, { status: 201 });
    }

    if (url.pathname === "/api/login" && method === "POST") {
      const body = await getBody(req);
      if (!body) return badRequest("Invalid JSON");

      const username = String(body.username || "").trim();
      const password = String(body.password || "").trim();

      if (!username || !password) {
        return badRequest("Username and password are required");
      }

      const user = findUserByUsernameStmt.get(username) as
        | { id: number; username: string; password_hash: string }
        | undefined;

      if (!user) {
        return unauthorized("Invalid username or password");
      }

      const ok = await verifyPassword(password, user.password_hash);
      if (!ok) {
        return unauthorized("Invalid username or password");
      }

      const token = createSessionToken();
      const expiresAt = createExpiryDate();

      createSessionStmt.run(user.id, token, expiresAt);

      const cookie = new Bun.Cookie({
        name: "session_token",
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: new Date(expiresAt),
      });

      return json(
        {
          message: "Login successful",
          user: { id: user.id, username: user.username },
        },
        {
          headers: {
            "Set-Cookie": cookie.toString(),
          },
        },
      );
    }

    if (url.pathname === "/api/logout" && method === "POST") {
      const token = getCookie(req, "session_token");

      if (token) {
        deleteSessionStmt.run(token);
      }

      const cookie = new Bun.Cookie({
        name: "session_token",
        value: "",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
      });

      return json(
        { message: "Logged out" },
        {
          headers: {
            "Set-Cookie": cookie.toString(),
          },
        },
      );
    }

    if (url.pathname === "/api/me" && method === "GET") {
      const user = getCurrentUser(req);
      if (!user) return unauthorized();

      return json({
        user: {
          id: user.id,
          username: user.username,
        },
      });
    }

    if (url.pathname === "/api/notes" && method === "GET") {
      const user = getCurrentUser(req);
      if (!user) return unauthorized();

      const notes = getNotesByUserStmt.all(user.id) as Array<{
        id: number;
        title: string;
        description: string;
        created_at: string;
        updated_at: string;
      }>;

      return json({ notes });
    }

    if (url.pathname === "/api/notes" && method === "POST") {
      const user = getCurrentUser(req);
      if (!user) return unauthorized();

      const body = await getBody(req);
      if (!body) return badRequest("Invalid JSON");

      const title = String(body.title || "").trim();
      const description = String(body.description || "").trim();

      if (!title) {
        return badRequest("Title is required");
      }

      createNoteStmt.run(user.id, title, description);

      return json({ message: "Note created" }, { status: 201 });
    }

    if (url.pathname.startsWith("/api/notes/") && method === "DELETE") {
      const user = getCurrentUser(req);
      if (!user) return unauthorized();

      const id = Number(url.pathname.split("/").pop());
      if (!Number.isInteger(id)) {
        return badRequest("Invalid note id");
      }

      const result = deleteNoteStmt.run(id, user.id);

      if (result.changes === 0) {
        return json({ error: "Note not found" }, { status: 404 });
      }

      return json({ message: "Note deleted" });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
