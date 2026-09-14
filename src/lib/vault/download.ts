export function downloadText(name: string, body: string, type: string): void {
  const file = new Blob([body], { type });
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
