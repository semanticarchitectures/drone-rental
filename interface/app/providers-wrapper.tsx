"use client";

import dynamic from "next/dynamic";

// Dynamically import providers with SSR disabled to avoid window access issues
const Providers = dynamic(() => import("./providers").then((mod) => mod.Providers), {
  ssr: false,
});

export default function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}

