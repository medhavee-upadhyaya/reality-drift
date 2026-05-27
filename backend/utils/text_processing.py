"""
text_processing.py — HTML to clean text conversion.

Strips HTML tags, script/style content, and normalizes whitespace.
Used to prepare scraped pages for Claude analysis.
"""

import re
from bs4 import BeautifulSoup


def extract_text_from_html(html: str, max_chars: int = 12000) -> str:
    """
    Extract clean text from HTML for Claude analysis.

    Args:
        html: Raw HTML string
        max_chars: Maximum characters to return (truncate for token control)

    Returns:
        Clean, normalized text string
    """
    if not html or not html.strip():
        return ""

    try:
        soup = BeautifulSoup(html, "lxml")

        # Remove non-content elements
        for tag in soup(["script", "style", "nav", "header", "footer",
                         "aside", "iframe", "noscript", "meta", "link"]):
            tag.decompose()

        # Get text
        text = soup.get_text(separator=" ", strip=True)

    except Exception:
        # Fallback: regex-based stripping
        text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # Truncate
    if len(text) > max_chars:
        text = text[:max_chars] + "..."

    return text


def chunk_text(text: str, chunk_size: int = 8000, overlap: int = 500) -> list[str]:
    """
    Split large text into overlapping chunks for multi-pass analysis.
    Used when a single regional page exceeds safe Claude context size.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        # Try to break at sentence boundary
        last_period = chunk.rfind(". ")
        if last_period > chunk_size * 0.7:
            chunk = chunk[:last_period + 1]
            end = start + last_period + 1
        chunks.append(chunk)
        start = end - overlap

    return chunks
