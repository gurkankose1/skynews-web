"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ToggleRewrite() {
  const router = useRouter();
  const params = useSearchParams();
  const rewrite = params.get("rewrite") || "tr";

  function toggle() {
    const next = rewrite === "tr" ? "orig" : "tr";
    const q = new URLSearchParams(Array.from(params.entries()));
    q.set("rewrite", next);
    router.push("/?" + q.toString());
  }

  return (
    <button onClick={toggle} aria-pressed={rewrite === "tr"} style={{ padding: "6px 10px", borderRadius: 6 }}>
      {rewrite === "tr" ? "Türkçe (Özgün)" : "Orijinal"}
    </button>
  );
}