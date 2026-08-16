# Contributing to Reality Drift

Thanks for helping make narrative drift easier to inspect and reproduce.

## Good first contributions

- Improve collectors for a public evidence source.
- Add tests for scoring edge cases.
- Make evidence citations clearer or more accessible.
- Reproduce a regional claim mismatch with stable source URLs.
- Improve setup documentation on a clean machine.

## Development workflow

1. Fork the repository and create a focused branch.
2. Follow the local setup in the README.
3. Keep credentials in local `.env` files; never commit keys or scraped personal data.
4. Run the frontend production build and backend checks before submitting.
5. Open a pull request explaining the behavior change and how you verified it.

```bash
cd frontend && npm ci && npm run build
cd ../backend && python -m compileall -q api ai data memory scoring scrapers utils main.py
```

For UI changes, include before-and-after screenshots. For scoring changes, include a small fixture and the expected score calculation.

## Evidence and language

- Cite the original public source when possible.
- Separate observed contradictions from inferred intent.
- Do not describe a company as fraudulent or legally liable based only on an RDI score.
- Remove unnecessary personal information from fixtures and screenshots.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
