"use client";

import { useEffect } from "react";

// Registers the service worker that makes the app installable and provides a
// lightweight offline fallback. No-op where service workers aren't supported.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        /* registration is best-effort */
      });
  }, []);

  return null;
}
