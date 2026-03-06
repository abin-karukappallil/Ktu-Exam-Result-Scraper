import * as cheerio from "cheerio";
import { Agent, fetch as undiciFetch } from "undici";

export interface CourseResult {
  courseCode: string;
  courseName: string;
  credit: string;
  grade: string;
}

export interface ScraperInput {
  sessionId: string;
  csrfToken: string;
  semesterId: number;
  studentId?: string;
  cookies?: string;
}

export interface ScraperResult {
  courses: CourseResult[];
}

const dispatcher = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

export async function scrapeKTUResults(
  input: ScraperInput
): Promise<ScraperResult> {
  const { sessionId, csrfToken, semesterId, studentId, cookies } = input;

  console.log("[SCRAPER] Starting scrape. Semester:", semesterId, "StudentId:", studentId || "(self)");

  const cookieHeader = cookies || `JSESSIONID=${sessionId}`;

  const formData = new URLSearchParams({
    CSRF_TOKEN: csrfToken,
    form_name: "semesterGradeCardListingSearchForm",
    semesterId: semesterId.toString(),
    stdId: studentId ?? "",
    search: "Search",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const response = await undiciFetch(
    "https://app.ktu.edu.in/eu/res/semesterGradeCardListing.htm",
    {
      method: "POST",
      dispatcher,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
        Origin: "https://app.ktu.edu.in",
        Referer: "https://app.ktu.edu.in/eu/res/semesterGradeCardListing.htm",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      body: formData.toString(),
    }
  );

  clearTimeout(timeout);


  if (!response.ok) {
    throw new Error(
      `KTU portal responded with ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();

  if (
    html.toLowerCase().includes("session expired") ||
    (html.toLowerCase().includes("login") &&
      !html.toLowerCase().includes("course"))
  ) {
    throw new Error("Invalid or expired session.");
  }

  const courses = parseResultTable(html);

  return { courses };
}

function parseResultTable(html: string): CourseResult[] {
  const $ = cheerio.load(html);
  const courses: CourseResult[] = [];

  let table: cheerio.Cheerio<any> | null = null;

  $("table").each((_, t) => {
    const header = $(t).text().toLowerCase();

    if (
      header.includes("course") &&
      header.includes("credit") &&
      header.includes("grade")
    ) {
      table = $(t);
      return false;
    }
  });

  if (!table) return [];

  let codeIdx = -1;
  let nameIdx = -1;
  let creditIdx = -1;
  let gradeIdx = -1;

  (table as cheerio.Cheerio<any>).find("tr").first().find("th, td").each((i, cell) => {
    const text = $(cell).text().trim().toLowerCase();
    if (text.includes("course code") || text.includes("code")) codeIdx = i;
    else if (text.includes("course name") || text.includes("course") && nameIdx === -1) nameIdx = i;
    else if (text.includes("credit")) creditIdx = i;
    else if (text.includes("grade")) gradeIdx = i;
  });


  if (codeIdx === -1) codeIdx = 1;
  if (nameIdx === -1) nameIdx = 2;
  if (creditIdx === -1) creditIdx = 3;
  if (gradeIdx === -1) gradeIdx = 4;

  (table as cheerio.Cheerio<any>).find("tr").each((rowIdx, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const courseCode = $(cells[codeIdx]).text().trim();
    const courseName = $(cells[nameIdx]).text().trim();
    const credit = $(cells[creditIdx]).text().trim();
    const grade = $(cells[gradeIdx]).text().trim();

    if (rowIdx <= 3) {
      console.log(`[PARSER] Row ${rowIdx}:`, {
        cellCount: cells.length,
        courseCode,
        courseName,
        credit,
        grade,
        allCells: cells.map((_, c) => $(c).text().trim()).get(),
      });
    }

    if (!courseCode && !courseName) return;

    courses.push({ courseCode, courseName, credit, grade });
  });

  return courses;
}