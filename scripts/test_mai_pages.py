"""Check the bilingual research pages without fetching external services."""

import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import unittest
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
PAGES = ("Economy_AI_ERA.html", "Economy_AI_ERA_ja.html")


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.scripts = []
        self.script = None
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if tag == "script":
            self.script = [attrs, ""]

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data):
        if self.script is not None:
            self.script[1] += data

    def handle_endtag(self, tag):
        if tag == "script" and self.script is not None:
            self.scripts.append(self.script)
            self.script = None

    def select(self, tag):
        return [attrs for name, attrs in self.elements if name == tag]

    @property
    def ids(self):
        return [attrs["id"] for _, attrs in self.elements if "id" in attrs]


class ResearchPageTests(unittest.TestCase):
    def test_landmarks_ids_and_accessible_references(self):
        for name in PAGES:
            with self.subTest(page=name):
                page = Page(ROOT / name)
                self.assertEqual(len(page.select("main")), 1)
                self.assertEqual(len(page.select("h1")), 1)
                self.assertEqual(len(page.ids), len(set(page.ids)))
                for _, attrs in page.elements:
                    for key in ("aria-controls", "aria-labelledby"):
                        for target in attrs.get(key, "").split():
                            self.assertIn(target, page.ids)

    def test_local_links_and_assets(self):
        for name in PAGES:
            page = Page(ROOT / name)
            for tag, attrs in page.elements:
                for key in ("href", "src"):
                    url = urlsplit(attrs.get(key, ""))
                    if url.scheme or url.netloc or key not in attrs:
                        continue
                    with self.subTest(page=name, url=attrs[key]):
                        path = ROOT / unquote(url.path).lstrip("/") if url.path else ROOT / name
                        if path.is_dir():
                            path = path / "index.html"
                        self.assertTrue(path.is_file(), path)
                        if url.fragment:
                            self.assertIn(unquote(url.fragment), Page(path).ids)

    def test_language_metadata_and_shared_sections(self):
        pages = [Page(ROOT / name) for name in PAGES]
        self.assertEqual(pages[0].ids[1:], pages[1].ids[1:])
        for name, lang, page in zip(PAGES, ("en", "ja"), pages):
            with self.subTest(page=name):
                self.assertEqual(page.select("html")[0]["lang"], lang)
                links = page.select("link")
                canonical = next(a["href"] for a in links if a.get("rel") == "canonical")
                alternates = {a["hreflang"]: a["href"] for a in links if a.get("rel") == "alternate"}
                self.assertEqual(alternates[lang], canonical)
                self.assertEqual(set(alternates), {"en", "ja", "x-default"})
                schemas = [json.loads(body) for attrs, body in page.scripts if attrs.get("type") == "application/ld+json"]
                self.assertEqual(len(schemas), 1)
                self.assertEqual(schemas[0]["url"], canonical)
                self.assertEqual(schemas[0]["inLanguage"], lang)
                descriptions = [a["content"] for a in page.select("meta") if a.get("name") in ("description", "twitter:description") or a.get("property") == "og:description"]
                self.assertEqual(Counter(descriptions), {schemas[0]["description"]: 3})

    def test_inline_javascript_syntax(self):
        for name in PAGES:
            for attrs, body in Page(ROOT / name).scripts:
                if attrs.get("type") == "application/ld+json" or "src" in attrs:
                    continue
                with self.subTest(page=name):
                    result = subprocess.run(["node", "--check"], input=body, text=True, capture_output=True)
                    self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
