"""
claude_client.py — Anthropic Claude client with aggressive prompt caching.

CACHING STRATEGY (saves ~90% of tokens on repeated analyses):

Layer 1 — System prompt cache:
  The SYSTEM_PROMPT (~1500 tokens) is marked ephemeral in the system block.
  Anthropic caches it for 5 minutes after first call.
  All 5 Claude calls per analysis hit this cache.

Layer 2 — HTML context cache:
  The combined 5-region HTML (~30-50k tokens) is passed in the FIRST user
  content block with cache_control={"type":"ephemeral"}.
  Subsequent calls (claims → contradictions → drift_type → sec_compare)
  all read the HTML from cache. First call writes it (~$0.08 in cache write),
  next 4 calls read it (~$0.001 each).

Layer 3 — Result cache:
  Completed analysis results cached in utils/cache.py (in-memory, 1hr TTL).
  Prevents any Claude calls for the same URL within an hour.

Net effect: Running all 5 Claude calls for one analysis costs roughly
the same as running 1 call without caching.
"""

import os
import json
import re
from typing import Any
import anthropic

from ai.prompts import SYSTEM_PROMPT, TASK_PROMPTS

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 4096

# Singleton client
_client: anthropic.Anthropic | None = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        if not ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not set in environment")
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client


def _build_html_context(regional_text: dict[str, str], company_name: str) -> str:
    """
    Build the combined HTML context string for caching.
    Truncates each region to 12k chars to keep total under ~60k tokens.
    """
    parts = [f"COMPANY BEING ANALYZED: {company_name}\n"]
    for region, text in regional_text.items():
        truncated = text[:12000] if len(text) > 12000 else text
        parts.append(f"\n{'='*60}\nREGION: {region}\n{'='*60}\n{truncated}")
    return "\n".join(parts)


def _parse_json_response(text: str) -> Any:
    """
    Robustly parse JSON from Claude's response.
    Handles markdown code blocks and leading/trailing whitespace.
    """
    # Strip markdown code blocks
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        # Try to extract JSON from within the response
        json_match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        raise ValueError(f"Cannot parse JSON response: {e}\n\nRaw response (first 500 chars):\n{text[:500]}")


async def call_claude(
    task: str,
    regional_text: dict[str, str],
    company_name: str,
    extra_context: str = "",
) -> tuple[Any, dict]:
    """
    Make a cached Claude API call for a specific analysis task.

    Args:
        task: One of the keys in TASK_PROMPTS
        regional_text: Dict of region → clean page text (cached after first call)
        company_name: Company being analyzed
        extra_context: Additional evidence text (SEC filings, news) appended after HTML

    Returns:
        (parsed_result, cache_stats)
    """
    client = get_client()
    html_context = _build_html_context(regional_text, company_name)

    # Build the content blocks:
    # - Block 1: HTML context (large, cached with ephemeral)
    # - Block 2: Extra context like SEC text (medium, also cached if present)
    # - Block 3: Task instruction (small, NOT cached — varies per call)
    content_blocks = [
        {
            "type": "text",
            "text": html_context,
            "cache_control": {"type": "ephemeral"},  # ← Caches the HTML
        },
    ]

    if extra_context.strip():
        content_blocks.append({
            "type": "text",
            "text": f"\n\nADDITIONAL EVIDENCE:\n{extra_context[:20000]}",
            "cache_control": {"type": "ephemeral"},  # ← Also cache evidence
        })

    # Task instruction — small, not cached (varies per call)
    content_blocks.append({
        "type": "text",
        "text": TASK_PROMPTS[task],
    })

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},  # ← Cache system prompt
            }
        ],
        messages=[
            {
                "role": "user",
                "content": content_blocks,
            }
        ],
    )

    # Extract cache stats for logging
    usage = response.usage
    cache_stats = {
        "cache_read_tokens": getattr(usage, "cache_read_input_tokens", 0),
        "cache_write_tokens": getattr(usage, "cache_creation_input_tokens", 0),
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "cache_hit": getattr(usage, "cache_read_input_tokens", 0) > 0,
    }

    cache_status = "HIT 🎯" if cache_stats["cache_hit"] else "MISS (writing cache)"
    print(
        f"[Claude/{task}] cache={cache_status} | "
        f"read={cache_stats['cache_read_tokens']} | "
        f"write={cache_stats['cache_write_tokens']} | "
        f"input={cache_stats['input_tokens']} | "
        f"output={cache_stats['output_tokens']}"
    )

    raw_text = response.content[0].text
    parsed = _parse_json_response(raw_text)
    return parsed, cache_stats
