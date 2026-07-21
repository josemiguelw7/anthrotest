// @ts-nocheck
import { ARCH_DOMAINS, ASSOC_DOMAINS, ARCH_Q, ASSOC_Q, ARCH_NOTES, ASSOC_NOTES, LABS } from "./data/content";

export const TRACKS: any = {
  arch: { name: "Architect Foundations", short: "CCA-F", domains: ARCH_DOMAINS, bank: ARCH_Q, notes: ARCH_NOTES, exam: { n: 25, min: 40, counts: [7, 5, 4, 5, 4] } },
  assoc: { name: "Entry-Level Fundamentals", short: "Fundamentals", domains: ASSOC_DOMAINS, bank: ASSOC_Q, notes: ASSOC_NOTES, exam: { n: 20, min: 25, counts: [5, 5, 4, 3, 3] } },
};
export { LABS };

export const BOOKING_URL = "https://www.pearsonvue.com/us/en/anthropic.html";

// Official further-reading links per domain (shown under explanations).
export const DOMAIN_DOCS = {
  arch: [
    { label: "Building effective agents (Anthropic)", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    { label: "Claude Code docs", url: "https://code.claude.com/docs" },
    { label: "Model Context Protocol", url: "https://modelcontextprotocol.io" },
    { label: "Prompt engineering overview", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview" },
    { label: "Prompt caching docs", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-caching" },
  ],
  assoc: [
    { label: "Claude docs", url: "https://docs.claude.com" },
    { label: "Prompt engineering overview", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview" },
    { label: "Claude help center", url: "https://support.claude.com" },
    { label: "Model Context Protocol", url: "https://modelcontextprotocol.io" },
    { label: "Claude help center", url: "https://support.claude.com" },
  ],
};

export const mergeBanks = (customRows) => {
  const custom = { arch: [], assoc: [] };
  (customRows || []).forEach((r) => { if (custom[r.track]) custom[r.track].push({ id: r.id, d: r.domain, q: r.q, opts: r.opts, a: r.a, why: r.why }); });
  return { arch: [...ARCH_Q, ...custom.arch], assoc: [...ASSOC_Q, ...custom.assoc] };
};
export const findQ = (banks, id) => banks.arch.find((q) => q.id === id) || banks.assoc.find((q) => q.id === id);
export const trackIn = (banks, id) => (banks.arch.some((q) => q.id === id) ? "arch" : "assoc");
