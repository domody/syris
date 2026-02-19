import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadLegalMarkdown(slug: string) {
  const filePath = path.join(process.cwd(), "content", "legal", `${slug}.md`);
  return readFile(filePath, "utf8");
}
