// The Fundamentals learning path. Each unit: read the intro -> skim the linked notes ->
// pass a 5-question checkpoint (4/5) to unlock the next. domain indexes match ASSOC_DOMAINS.
const PATH = [
  {
    unit: 1,
    title: "What even is an LLM?",
    domain: 0,
    minutes: 8,
    intro: [
      "Start here if words like 'token' and 'model' feel fuzzy. An LLM is software that read a staggering amount of text and learned to predict what comes next — that single trick, done extremely well, is what lets it write emails, summarize documents, and answer questions. It is not a database looking up facts; it is a predictor generating likely text. That one distinction explains most of its superpowers and most of its failures.",
      "Three ideas carry this whole unit. First, tokens: the model reads and writes in small chunks of text, and everything — pricing, limits, speed — is counted in them. Second, the context window: the model's whiteboard, the total text it can consider at once; if something isn't on the whiteboard, it doesn't exist to the model. Third, the knowledge cutoff: training ended on a date, and the model can't know what happened after it without help like web search.",
      "Last piece: models come in tiers (fast-and-cheap up to slow-and-brilliant), and the same question can get differently-worded answers because generation involves controlled randomness. Neither is a bug. Skim the two study-note cards for this domain, then take the checkpoint.",
    ],
  },
  {
    unit: 2,
    title: "Talking to Claude (prompting)",
    domain: 1,
    minutes: 10,
    intro: [
      "A prompt is a ticket description, and the universal law of ticketing applies: vague in, vague out. 'It's broken, fix it' gets you nothing at the helpdesk, and 'make this better' gets you nothing from a model. The four ingredients that fix almost every disappointing answer: the exact task, the context it couldn't know, the format you want (show an example!), and who the audience is.",
      "The second habit is iteration. The first draft is a starting point, not a verdict — reply with targeted corrections ('keep the tone, shorten section two, add pricing') instead of starting over. And for big messy jobs, break the work into steps you can check, exactly like you wouldn't hand one mega-ticket covering an office move, a firewall change, and a printer jam to one tech in one go.",
      "When you can predict what a model will do with a lazy prompt versus a specific one, this unit is done. The checkpoint will test exactly that instinct.",
    ],
  },
  {
    unit: 3,
    title: "The product map",
    domain: 2,
    minutes: 8,
    intro: [
      "Same brain, different bodies. Claude.ai is the chat product — a person talking to Claude. The API is Claude as a building block — software talking to Claude, which is how companies put it inside their own products. Claude Code is Claude with hands in a code repository, working like an agentic pair programmer in the terminal.",
      "Inside Claude.ai, two features matter for the exam and for real work: Projects, which give a set of related conversations persistent shared knowledge and instructions (think: a team share for context), and artifacts, standalone work products — documents, code, small apps — that live beside the chat and can be iterated on.",
      "The checkpoint question underneath all of this is always the same: given a scenario, which surface? Quick question → chat. Ongoing workstream → Project. Customer-facing feature → API. Repetitive coding task → Claude Code.",
    ],
  },
  {
    unit: 4,
    title: "Data, tools, and staying grounded",
    domain: 3,
    minutes: 8,
    intro: [
      "The model only knows two things: what it learned in training (frozen at the cutoff) and what you put in front of it right now. Everything in this unit is about the second part. Recent events? Web search fetches and cites current sources. A 40-page PDF? Upload the actual file so answers are grounded in the real document instead of vibes. Precise math on a big spreadsheet? Have it compute with code — models are eloquent but unreliable calculators.",
      "One acronym to know cold: MCP, the Model Context Protocol — an open standard for connecting AI assistants to external tools and data, the USB-C of AI integrations. You don't need to build one for the Fundamentals level; you need to know what it is and why a standard connector matters.",
      "The instinct this unit builds: when a question depends on live, private, or precise data, the answer is 'connect the model to the data,' never 'hope it remembers.'",
    ],
  },
  {
    unit: 5,
    title: "Using it responsibly",
    domain: 4,
    minutes: 8,
    intro: [
      "The failure mode to respect is the hallucination: a fluent, confident, wrong answer. Statistics, citations, names, legal claims — anything that matters gets verified against a real source. The model never says 'I'm not sure' with the body language a human would; you supply the skepticism.",
      "Two workplace rules. High-stakes output — legal, financial, medical, HR — gets qualified human review before it's used; AI accelerates drafts, humans own decisions. And data hygiene: credentials never go in a prompt, ever, and customer PII is handled per company policy with the minimum shared. If you wouldn't paste it in a public Slack channel, think twice before pasting it anywhere.",
      "Pass this checkpoint and you've completed the path — the dashboard will show it, and the Fundamentals mock exam is your graduation lap.",
    ],
  },
];
export { PATH };
