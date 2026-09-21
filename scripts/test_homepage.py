"""Keep core projects and supporting resources discoverable on the homepage."""

import json
import unittest
from urllib.parse import unquote, urlsplit

from test_mai_pages import Page, ROOT


class HomepageTests(unittest.TestCase):
    def setUp(self):
        self.page = Page(ROOT / "index.html")
        self.html = (ROOT / "index.html").read_text(encoding="utf-8")

    def test_structure_and_legacy_anchors(self):
        self.assertEqual(len(self.page.select("h1")), 1)
        self.assertEqual(len(self.page.select("main")), 1)
        self.assertEqual(len(self.page.ids), len(set(self.page.ids)))
        for anchor in ("main", "work", "research", "publications", "contact", "services"):
            self.assertIn(anchor, self.page.ids)
        for _, attrs in self.page.elements:
            for target in attrs.get("aria-labelledby", "").split():
                self.assertIn(target, self.page.ids)

    def test_core_projects_and_collapsed_supporting_work(self):
        cards = [a for a in self.page.select("article") if "project-card" in a.get("class", "").split()]
        self.assertEqual(len(cards), 3)
        details = self.page.select("details")
        self.assertEqual(len(details), 1)
        self.assertNotIn("open", details[0])
        links = {a["href"] for a in self.page.select("a")}
        for href in ("agents-secure-binding.html", "/yolozu/", "/yolozu/docs/", "Economy_AI_ERA.html", "theory.html", "education/rfc_quizzes.html", "education/rfc_quizzes_ja.html"):
            self.assertIn(href, links)

    def test_observatory_public_and_admin_routes_are_separate(self):
        main, footer = self.html.split("</main>", 1)
        public = "https://observatory.toppymicros.com/"
        admin = "https://admin-observatory.toppymicros.com/"
        self.assertIn(public, main)
        self.assertNotIn(admin, main)
        self.assertIn(admin, footer)
        self.assertNotIn(public, footer)
        self.assertIn("Observatory admin (Japanese only; sign-in required)", footer)
        for href in (public, admin):
            links = [a for a in self.page.select("a") if a.get("href") == href]
            self.assertEqual(len(links), 1)
            self.assertEqual(links[0].get("hreflang"), "ja")

    def test_withdrawn_observatory_notes_are_not_linked(self):
        for name in ("index.html", "README.md", "llms.txt", "llms-full.txt"):
            with self.subTest(name=name):
                text = (ROOT / name).read_text(encoding="utf-8")
                self.assertNotIn("https://observatory.toppymicros.com/research", text)

    def test_observatory_leads_resources_without_claiming_confirmed_breaches(self):
        resources = self.html.split('<section id="publications"', 1)[1].split("</section>", 1)[0]
        self.assertIn('id="observatory"', resources)
        self.assertLess(resources.index("Ransomware Observatory"), resources.index("High-confidence errors"))
        self.assertIn("observation history", resources)
        self.assertIn("A listing is a claim, not confirmation of a breach.", resources)

    def test_local_links_and_external_link_attributes(self):
        for link in self.page.select("a"):
            href = link["href"]
            with self.subTest(href=href):
                if link.get("target") == "_blank":
                    self.assertTrue({"noopener", "noreferrer"} <= set(link.get("rel", "").split()))
                url = urlsplit(href)
                if url.scheme or url.netloc:
                    continue
                path = ROOT / unquote(url.path).lstrip("/") if url.path else ROOT / "index.html"
                if path.is_dir():
                    path /= "index.html"
                self.assertTrue(path.is_file(), path)
                if url.fragment:
                    self.assertIn(unquote(url.fragment), Page(path).ids)

    def test_structured_data_includes_core_projects(self):
        schemas = [json.loads(body) for attrs, body in self.page.scripts if attrs.get("type") == "application/ld+json"]
        organization = next(s for s in schemas if s["@type"] == "Organization")
        names = {item["name"] for item in organization["hasPart"]}
        self.assertIn("Agents Secure Binding", names)
        self.assertIn("YOLOZU — Vision model evaluation toolkit", names)
        self.assertIn("mAI Economy", names)


if __name__ == "__main__":
    unittest.main()
