/** Client-side download only — no file is ever uploaded or served. */
export function downloadBlob(blob: Blob, filename: string) {
  // Android's WebView silently ignores <a download>, so the APK build saves
  // through Capacitor instead. Inlined at build time — dead code on the web.
  if (process.env.NEXT_PUBLIC_NATIVE_APP === "android") {
    void saveOnAndroid(blob, filename);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Revoking in the same tick can cancel the download on some mobile browsers.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function saveOnAndroid(blob: Blob, filename: string) {
  const [{ Filesystem, Directory }, { Share }, { Toast }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
    import("@capacitor/toast"),
  ]);
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  const path = `SpecShot/${filename}`;
  try {
    await Filesystem.writeFile({ path, data, directory: Directory.Documents, recursive: true });
    await Toast.show({ text: `Saved to Documents/${path}`, duration: "long" });
  } catch {
    // No write access to Documents (Android 10's scoped storage, or the
    // permission was refused on 9 and older): hand it to the share sheet,
    // which needs no permission.
    const { uri } = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
    await Share.share({ title: filename, files: [uri] });
  }
}
