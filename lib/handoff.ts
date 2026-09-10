/** One-shot image handoff between routes (the landing-page dropzone → a tool).
 * Uses sessionStorage as a data URL because a File can't survive a client
 * navigation. Best-effort: a too-large file trips the quota, we swallow it and
 * the target tool just shows its normal upload screen. */
const KEY = "specshot:handoff-image";

export function stashHandoffImage(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.onload = () => {
      try {
        sessionStorage.setItem(
          KEY,
          JSON.stringify({ name: file.name, type: file.type, data: reader.result }),
        );
        resolve();
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    reader.readAsDataURL(file);
  });
}

export function takeHandoffImage(): File | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const { name, type, data } = JSON.parse(raw) as { name: string; type: string; data: string };
    const comma = data.indexOf(",");
    if (comma < 0) return null;
    const bin = atob(data.slice(comma + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], name || "image", { type: type || "image/png" });
  } catch {
    return null;
  }
}
