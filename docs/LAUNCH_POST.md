# Reality Drift launch kit

## GitHub description

Detect regional contradictions in corporate ESG claims with an explainable Reality Drift Index and source-level receipts.

## Recommended topics

`ai` · `esg` · `greenwashing` · `osint` · `fastapi` · `nextjs` · `claude-ai` · `data-transparency` · `compliance` · `sustainability`

## Launch post — LinkedIn / X long form

**The internet shows different truths to different people. I built Reality Drift to catch the gap.**

A company can publish an ambitious sustainability promise to customers, qualify it in an SEC filing, omit a controversy in another country, and soften the language somewhere else. The evidence is public—but scattered across regions, filings, news, and formats.

Reality Drift turns that mess into an evidence-first narrative audit:

→ compares claims across five regions  
→ checks public language against regulatory filings  
→ finds contradictions and disclosure gaps  
→ independently verifies each proposed finding

→ retrieves relevant history through knowledge-graph RAG

→ tracks whether drift is getting worse over time  
→ produces an explainable 0–100 Reality Drift Index

The Shell demo is the clearest example: a public 30% reduction claim appears beside a 20% target qualified by market conditions in the filing. Reality Drift shows the 10-point gap, the exact evidence, and the recommended next actions.

Try the instant demo: https://reality-drift-rho.vercel.app  
Explore the code: https://github.com/medhavee-upadhyaya/reality-drift

Under the hood it combines Claude reasoning, cross-regional web collection, deterministic scoring, evidence hashes, and Cognee GraphRAG memory. Historical model output is context—not proof—so every current finding still needs current evidence.

The project is open source. I would especially value feedback from climate-tech builders, investigative researchers, compliance teams, and anyone working on explainable AI systems.

If the idea resonates, a GitHub star helps more people discover it—and issues and pull requests are very welcome.

#OpenSource #ClimateTech #AI #ESG #OSINT #Compliance

## Short post

Companies can say one thing to customers and another in a regulatory filing.

Reality Drift compares corporate claims across regions and evidence sources, then explains the gap with a 0–100 score and source-level receipts.

Try Shell, Nike, or H&M instantly—no API key required:
https://reality-drift-rho.vercel.app

Source: https://github.com/medhavee-upadhyaya/reality-drift

## Hacker News title

Show HN: Reality Drift – detect when companies tell different ESG stories by region

## Hacker News opening comment

I built Reality Drift after noticing how difficult it is to compare a company's public sustainability claims with the language it uses in regulatory filings and different regional sites.

The app collects claims, compares them with filings and other evidence, and produces an inspectable score rather than a single opaque AI verdict. The repository includes three instant demo records so the core experience does not depend on paid APIs.

I would love feedback on two things: whether the evidence presentation is trustworthy, and whether the scoring model is understandable enough to critique. The methodology is documented in the repo.
