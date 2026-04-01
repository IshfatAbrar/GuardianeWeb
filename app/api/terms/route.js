import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  try {
    const termsPath = path.join(process.cwd(), "data", "tos.txt");
    const termsText = await readFile(termsPath, "utf8");

    return new Response(termsText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(
      "Terms of Service are currently unavailable. Please try again later.",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
