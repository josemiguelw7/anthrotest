// @ts-nocheck
"use client";
import { useEffect, useState } from "react";

export function useBanks() {
  const [banks, setBanks] = useState(null);
  useEffect(() => {
    fetch("/api/questions").then((r) => r.json()).then((d) => setBanks(d.banks)).catch(() => setBanks(null));
  }, []);
  return banks;
}
