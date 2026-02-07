import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path, "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function writeIfMissing(path: string, content: string): Promise<void> {
  if (await fileExists(path)) {
    return;
  }

  await ensureDirectory(dirname(path));
  await writeFile(path, content, "utf8");
}

export async function copyFileWithParents(source: string, target: string): Promise<void> {
  await ensureDirectory(dirname(target));
  await copyFile(source, target);
}
