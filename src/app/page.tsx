"use strict";

import { Suspense } from "react";
import EmailComposer from "@/components/EmailComposer";

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm animate-pulse">Loading email composer...</p>
      </div>
    }>
      <EmailComposer />
    </Suspense>
  );
}
