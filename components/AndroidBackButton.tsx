"use client";

import { useEffect } from "react";

/** Android's back button: step back through the app's pages, and only leave
 * the app from the first one. Without this the APK closes on the first press,
 * from any page. Rendered only in the Android build (app/layout.tsx). */
export function AndroidBackButton() {
  useEffect(() => {
    const listener = import("@capacitor/app").then(({ App }) =>
      App.addListener("backButton", ({ canGoBack }) => (canGoBack ? history.back() : App.minimizeApp())),
    );
    return () => void listener.then((l) => l.remove());
  }, []);
  return null;
}
