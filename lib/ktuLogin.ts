import * as cheerio from "cheerio";
import { Agent, fetch as undiciFetch } from "undici";

export interface LoginResult {
  sessionId: string;
  csrfToken: string;
  cookies: string;
}

const dispatcher = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

function mergeCookies(
  jar: Map<string, string>,
  headers: import("undici").Headers
): void {
  const raw = headers.getSetCookie?.() ?? [];
  for (const cookie of raw) {
    const pair = cookie.split(";")[0]; 
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const name = pair.substring(0, eqIdx).trim();
    const value = pair.substring(eqIdx + 1).trim();
    if (value === "deleteMe") {
      jar.delete(name);
    } else {
      jar.set(name, value);
    }
  }
}

function jarToString(jar: Map<string, string>): string {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

interface CachedSession {
  sessionId: string;
  csrfToken: string;
  cookies: string;
  password: string;
  timestamp: number;
}

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const sessionCache = new Map<string, CachedSession>();

export async function loginKTU(
  username: string,
  password: string
): Promise<LoginResult> {
  const cached = sessionCache.get(username);
  if (
    cached &&
    cached.password === password &&
    Date.now() - cached.timestamp < SESSION_TTL_MS
  ) {
    console.log("[LOGIN] Using cached session for:", username);

    try {
      const checkResponse = await undiciFetch(
        "https://app.ktu.edu.in/eu/res/semesterGradeCardListing.htm",
        {
          method: "GET",
          dispatcher,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            Cookie: cached.cookies,
          },
        }
      );

      const html = await checkResponse.text();
      const $check = cheerio.load(html);
      const csrf = $check("input[name='CSRF_TOKEN']").val() as string;

      if (csrf && !html.toLowerCase().includes("session expired")) {
        console.log("[LOGIN] Cached session still valid. CSRF:", csrf);
        return {
          sessionId: cached.sessionId,
          csrfToken: csrf,
          cookies: cached.cookies,
        };
      }

      console.log("[LOGIN] Cached session expired, re-logging in...");
    } catch {
      console.log("[LOGIN] Cached session check failed, re-logging in...");
    }

    sessionCache.delete(username);
  }

  console.log("[LOGIN] Starting fresh login:", username);

  const cookieJar = new Map<string, string>();

  const loginPage = await undiciFetch("https://app.ktu.edu.in/login.htm", {
    method: "GET",
    dispatcher,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  mergeCookies(cookieJar, loginPage.headers);
  console.log("[LOGIN] Step 1: Status:", loginPage.status, "Cookies:", jarToString(cookieJar));

  const loginHtml = await loginPage.text();
  const $ = cheerio.load(loginHtml);
  const csrfToken = $("input[name='CSRF_TOKEN']").val() as string;

  if (!csrfToken) {
    throw new Error("Could not extract CSRF token from login page.");
  }

  console.log("[LOGIN] Step 1: CSRF:", csrfToken);

  const formData = new URLSearchParams({
    CSRF_TOKEN: csrfToken,
    username,
    password,
  });

  const loginResponse = await undiciFetch(
    "https://app.ktu.edu.in/login.htm",
    {
      method: "POST",
      dispatcher,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://app.ktu.edu.in",
        Referer: "https://app.ktu.edu.in/login.htm",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Cookie: jarToString(cookieJar),
      },
      body: formData.toString(),
      redirect: "manual",
    }
  );

  mergeCookies(cookieJar, loginResponse.headers);
  console.log("[LOGIN] Step 2: Status:", loginResponse.status, "Cookies:", jarToString(cookieJar));

  // Follow redirect chain if any (302/301)
  let currentResponse = loginResponse;
  let redirectCount = 0;
  while (currentResponse.status >= 300 && currentResponse.status < 400 && redirectCount < 5) {
    const location = currentResponse.headers.get("location");
    if (!location) break;

    const absoluteUrl = location.startsWith("http")
      ? location
      : `https://app.ktu.edu.in${location}`;

    console.log("[LOGIN] Step 2: Following redirect to:", absoluteUrl);

    currentResponse = await undiciFetch(absoluteUrl, {
      method: "GET",
      dispatcher,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Cookie: jarToString(cookieJar),
      },
      redirect: "manual",
    });

    mergeCookies(cookieJar, currentResponse.headers);
    console.log("[LOGIN] Step 2: Redirect status:", currentResponse.status, "Cookies:", jarToString(cookieJar));
    redirectCount++;
  }

  const sessionId = cookieJar.get("JSESSIONID") ?? "";
  if (!sessionId) {
    throw new Error("Login failed. No JSESSIONID returned.");
  }

  console.log("[LOGIN] Step 2: Final session:", sessionId);


  const resultsPage = await undiciFetch(
    "https://app.ktu.edu.in/eu/res/semesterGradeCardListing.htm",
    {
      method: "GET",
      dispatcher,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Cookie: jarToString(cookieJar),
        Referer: "https://app.ktu.edu.in/eu/ent/redirectToStudent.htm",
      },
    }
  );

  mergeCookies(cookieJar, resultsPage.headers);
  console.log("[LOGIN] Step 3: Results page status:", resultsPage.status);

  const resultsHtml = await resultsPage.text();
  console.log("[LOGIN] Step 3: Results page length:", resultsHtml.length);

  const $r = cheerio.load(resultsHtml);
  const newCsrf = $r("input[name='CSRF_TOKEN']").val() as string;
  const finalCsrf = newCsrf || csrfToken;

  console.log("[LOGIN] Step 3: Final CSRF:", finalCsrf);
  console.log("[LOGIN] Complete. All cookies:", jarToString(cookieJar));
  sessionCache.set(username, {
    sessionId,
    csrfToken: finalCsrf,
    cookies: jarToString(cookieJar),
    password,
    timestamp: Date.now(),
  });

  return {
    sessionId,
    csrfToken: finalCsrf,
    cookies: jarToString(cookieJar),
  };
}