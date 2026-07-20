// @ts-nocheck
import { ARCH_DOMAINS, ASSOC_DOMAINS, ARCH_Q, ASSOC_Q, ARCH_NOTES, ASSOC_NOTES } from "./data/content";

export const TRACKS: any = {
  arch: { name: "Architect Foundations", short: "CCA-F", domains: ARCH_DOMAINS, bank: ARCH_Q, notes: ARCH_NOTES, exam: { n: 25, min: 40, counts: [7, 5, 4, 5, 4] } },
  assoc: { name: "Entry-Level Fundamentals", short: "Fundamentals", domains: ASSOC_DOMAINS, bank: ASSOC_Q, notes: ASSOC_NOTES, exam: { n: 20, min: 25, counts: [5, 5, 4, 3, 3] } },
};
export const qById = (id: string) => [...ARCH_Q, ...ASSOC_Q].find((q: any) => q.id === id);
export const trackOf = (id: string) => (ARCH_Q.some((q: any) => q.id === id) ? "arch" : "assoc");
