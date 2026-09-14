export const MAX_DOC_FILE = 350_000;

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"]);

export type DocFile = { fileName: string; fileMime: string; fileData: string };

export function isAllowedDocFile(file: File): boolean {
  if (file.size > MAX_DOC_FILE) return false;
  if (ALLOWED.has(file.type)) return true;
  return /\.(pdf|png|jpe?g|webp|txt)$/i.test(file.name);
}

export function readDocFile(file: File): Promise<DocFile> {
  return new Promise((resolve, reject) => {
    if (!isAllowedDocFile(file)) {
      reject(new Error("type"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const comma = raw.indexOf(",");
      const data = comma >= 0 ? raw.slice(comma + 1) : raw;
      if (!data) {
        reject(new Error("empty"));
        return;
      }
      resolve({
        fileName: file.name.slice(0, 80),
        fileMime: file.type || "application/octet-stream",
        fileData: data,
      });
    };
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

export function downloadDocFile(file: DocFile): void {
  const bin = atob(file.fileData);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: file.fileMime || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.fileName || "document";
  a.click();
  URL.revokeObjectURL(url);
}
