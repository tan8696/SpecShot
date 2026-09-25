// Windows app: the same static export the website serves (`next build` → out/),
// bundled so it runs offline. out/ uses root-absolute URLs (/_next/...), which
// file:// can't resolve, so it's served from a privileged app:// origin instead.
const { app, BrowserWindow, protocol, net, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = app.isPackaged ? path.join(process.resourcesPath, "site") : path.join(__dirname, "..", "out");
const ORIGIN = "app://specshot";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

function serve(req) {
  let p = decodeURIComponent(new URL(req.url).pathname);
  // trailingSlash export: /tools/ → tools/index.html
  if (p.endsWith("/")) p += "index.html";
  else if (!path.extname(p)) p += "/index.html";
  const file = path.join(ROOT, p);
  // An encoded %2F..%2F survives URL normalisation; never serve outside ROOT.
  if (path.relative(ROOT, file).startsWith("..")) return new Response("Forbidden", { status: 403 });
  return net.fetch(pathToFileURL(file).toString()).catch(async () => {
    const page = await net.fetch(pathToFileURL(path.join(ROOT, "404.html")).toString());
    return new Response(page.body, { status: 404, headers: { "content-type": "text/html" } });
  });
}

app.whenReady().then(() => {
  protocol.handle("app", serve);

  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    backgroundColor: "#131313",
    autoHideMenuBar: true,
    icon: path.join(ROOT, "icon-512.png"),
  });
  // Links off-site (GitHub, government spec sources, mailto:) open in the real browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(ORIGIN)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
  win.loadURL(`${ORIGIN}/`);
});

app.on("window-all-closed", () => app.quit());
