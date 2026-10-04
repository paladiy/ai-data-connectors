/** Each source lives in its own folder: the record you edit and the guide generated from it. */
export const SOURCES_DIR = "sources";
export const SOURCE_FILE = "source.yaml";
export const GUIDE_FILE = "README.md";

export function sourceFile(slug: string): string {
  return `${SOURCES_DIR}/${slug}/${SOURCE_FILE}`;
}

export function guideFile(slug: string): string {
  return `${SOURCES_DIR}/${slug}/${GUIDE_FILE}`;
}

export const GUIDE_FILE_PATTERN = new RegExp(`^${SOURCES_DIR}/[^/]+/${GUIDE_FILE.replace(".", "\\.")}$`);
