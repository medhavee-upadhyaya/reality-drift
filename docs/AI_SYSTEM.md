# AI system design

Reality Drift combines model reasoning with deterministic scoring and traceable evidence. It is a staged intelligence pipeline, not a collection of autonomous agents.

## Live analysis sequence

1. Collect regional pages, regulatory filings, news, and employee signals.
2. Normalize current regional content and compute content hashes.
3. Retrieve relevant prior analyses from Cognee graph memory.
4. Extract region-specific claims with Claude.
5. Compare regional narratives pairwise for semantic similarity.
6. Detect contradictions against current regulatory and news evidence.
7. Validate source URLs and attach retrieval timestamps and evidence hashes.
8. Run an independent verification pass over every proposed contradiction.
9. Calculate the deterministic Reality Drift Index.
10. Store the completed evidence record in graph memory.

## GraphRAG boundary

Historical Cognee results are retrieved before current reasoning and supplied as a clearly labeled context block. They help the model recognize changes, recurring claims, and previously observed contradictions.

Graph memory is not treated as primary proof. A current contradiction still requires support from current collected evidence. This prevents a historical model output from becoming self-validating evidence in a later scan.

## Verification states

- `verified` — the cited passage exists and directly supports the conclusion.
- `disputed` — the collected evidence conflicts with or weakens the conclusion.
- `insufficient_evidence` — the quote, source, or logical connection cannot be confirmed.

If the verifier model is unavailable, a conservative fallback verifies only exact evidence passages found in the collected context.

## Provenance

Live findings support source URL and date, retrieval timestamp, SHA-256 evidence hash, verification state and confidence, and a SHA-256 hash for every regional narrative.

URLs supplied by model output are accepted only when they are valid public HTTP(S) URLs. Known SEC and news URLs are attached from collector output when possible.

## Geographic scoring

Geographic drift uses pairwise comparisons of the regional narratives themselves. Claude evaluates meaning and framing during a live scan. A deterministic token-set comparison provides an offline fallback. Fetch count is not used as a proxy for narrative difference.

## Deterministic controls

The RDI aggregation, evidence hashes, URL validation, result normalization, confidence bounds, and fallback verification are implemented in application code. Model output cannot change score weights or introduce unsupported verification states.

## Evaluation

Backend unit tests cover semantic-comparison normalization, offline similarity, citation hashing, unsafe URL rejection, verifier normalization, exact-quote fallback behavior, and bounded graph context. CI runs these tests and the frontend production build on every pull request.
