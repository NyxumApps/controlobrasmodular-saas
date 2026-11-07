"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { ApiError } from "../src/lib/api";

const ClientApp = dynamic(() => import("../src/App"), { ssr: false });

export function SpaShell() {
  useEffect(() => {
    const suppressNotifiedErrors = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof ApiError && event.reason.notified) event.preventDefault();
    };
    window.addEventListener("unhandledrejection", suppressNotifiedErrors);
    return () => window.removeEventListener("unhandledrejection", suppressNotifiedErrors);
  }, []);

  return <ClientApp />;
}
