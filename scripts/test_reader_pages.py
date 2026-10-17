"""Keep reader-facing pages navigable as introductions are shortened."""

import json
import subprocess
import unittest
from urllib.parse import unquote, urlsplit

from test_mai_pages import Page, ROOT


PAGES = (
    "index.html", "agents-secure-binding.html", "theory.html",
    "Economy_AI_ERA.html", "Economy_AI_ERA_ja.html",
    "contact.html", "news.html", "security-policy.html", "terms-legal-notice.html",
    "education/rfc_quizzes.html", "education/rfc_quizzes_ja.html",
    "education/quiz_finance_terms.html", "education/quiz_finance_terms_en.html",
    "yolozu/index.html",
) + tuple(str(path.relative_to(ROOT)) for path in sorted((ROOT / "yolozu/docs").glob("*.html")))


class ReaderPageTests(unittest.TestCase):
    def test_finance_settings_are_scripted_not_visible_text(self):
        for name in ("quiz_finance_terms.html", "quiz_finance_terms_en.html"):
            with self.subTest(page=name):
                page = Page(ROOT / "education" / name)
                self.assertEqual(len(page.select("body")), 1)
                self.assertTrue(any("window.DRILL_SETTINGS =" in body
                                    for _, body in page.scripts))

    def test_headings_ids_and_accessible_references(self):
        for name in PAGES:
            with self.subTest(page=name):
                page = Page(ROOT / name)
                self.assertEqual(len(page.select("h1")), 1)
                self.assertEqual(len(page.ids), len(set(page.ids)))
                for _, attrs in page.elements:
                    for key in ("aria-controls", "aria-labelledby", "aria-describedby"):
                        for target in attrs.get(key, "").split():
                            self.assertIn(target, page.ids)

    def test_local_links_assets_and_fragments(self):
        for name in PAGES:
            source = ROOT / name
            for _, attrs in Page(source).elements:
                for key in ("href", "src"):
                    if key not in attrs:
                        continue
                    url = urlsplit(attrs[key])
                    if url.scheme or url.netloc:
                        continue
                    with self.subTest(page=name, link=attrs[key]):
                        if not url.path:
                            target = source
                        elif url.path.startswith("/"):
                            target = ROOT / unquote(url.path).lstrip("/")
                        else:
                            target = source.parent / unquote(url.path)
                        if target.is_dir():
                            target /= "index.html"
                        self.assertTrue(target.is_file(), target)
                        if url.fragment and target.suffix == ".html":
                            self.assertIn(unquote(url.fragment), Page(target).ids)

    def test_structured_data_and_inline_scripts_parse(self):
        for name in PAGES:
            for attrs, body in Page(ROOT / name).scripts:
                with self.subTest(page=name, script_type=attrs.get("type")):
                    if attrs.get("type") == "application/ld+json":
                        json.loads(body)
                    elif "src" not in attrs:
                        result = subprocess.run(
                            ["node", "--check"], input=body, text=True, capture_output=True)
                        self.assertEqual(result.returncode, 0, result.stderr)

    def test_asb_details_keep_evidence_available(self):
        page = Page(ROOT / "agents-secure-binding.html")
        self.assertEqual(len(page.select("details")), 3)
        self.assertTrue(all("open" not in attrs for attrs in page.select("details")))
        links = {attrs["href"] for attrs in page.select("a")}
        base = "https://github.com/ToppyMicroServices/agents-secure-binding/"
        for path in ("blob/main/docs/SSOT.md", "blob/main/docs/live-red-team-report.md",
                     "blob/main/docs/security-red-team-tests.md", "releases/tag/v1.1.1",
                     "releases/tag/v2.0.0-rc.2"):
            self.assertIn(base + path, links)


if __name__ == "__main__":
    unittest.main()
