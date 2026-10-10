"""Keep core projects and supporting resources discoverable on the homepage."""

import json
import unittest
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

from test_mai_pages import Page, ROOT


class NewsEntries(HTMLParser):
    """Read the complete visible content of each approved update entry."""

    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.entries = []
        self.current = None
        self.capture_tag = None
        self.capture_key = None
        self.related_link = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "article" and "news-item" in attrs.get("class", "").split():
            self.current = {"attrs": attrs, "tags": [], "loose_text": [], "related_links": []}
            return
        if self.current is None:
            return
        self.current["tags"].append(tag)
        if tag in ("time", "h2", "p"):
            self.capture_tag = tag
            self.capture_key = tag
            self.current[tag] = ""
            self.current[f"{tag}_attrs"] = attrs
        elif tag == "a":
            self.capture_tag = tag
            if "source-link" in attrs.get("class", "").split():
                self.capture_key = "link_text"
                self.current["link_text"] = ""
                self.current["link_attrs"] = attrs
            else:
                self.related_link = {"attrs": attrs, "text": ""}
                self.current["related_links"].append(self.related_link)

    def handle_data(self, data):
        if self.current is None:
            return
        if self.related_link is not None:
            self.related_link["text"] += data
        elif self.capture_key:
            self.current[self.capture_key] += data
        elif data.strip():
            self.current["loose_text"].append(data.strip())

    def handle_endtag(self, tag):
        if self.current is None:
            return
        if tag == self.capture_tag:
            self.capture_tag = None
            self.capture_key = None
            self.related_link = None
        if tag == "article":
            for key in ("time", "h2", "p", "link_text"):
                self.current[key] = " ".join(self.current.get(key, "").split())
            for link in self.current["related_links"]:
                link["text"] = " ".join(link["text"].split())
            self.entries.append(self.current)
            self.current = None


class NavigationLinks(HTMLParser):
    """Read labels and destinations from the main navigation link group."""

    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.links = []
        self.current = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if self.depth:
            self.depth += 1
        elif {"links", "top-links"} & set(attrs.get("class", "").split()):
            self.depth = 1
        if self.depth and tag == "a":
            self.current = {"attrs": attrs, "text": ""}
            self.links.append(self.current)

    def handle_data(self, data):
        if self.current is not None:
            self.current["text"] += data

    def handle_endtag(self, tag):
        if tag == "a":
            self.current = None
        if self.depth:
            self.depth -= 1


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
        folded = self.html.split('<details class="supporting-work">', 1)[1].split("</details>", 1)[0]
        self.assertNotIn("Beads Git Graph", folded)
        self.assertIn("RFC learning guide", folded)
        self.assertIn('id="beads-git-graph"', self.html)
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

    def test_beads_copy_leads_with_local_cross_provider_task_work(self):
        self.assertIn("Released VS Code extension for coordinating local tasks across AI providers.", self.html)
        self.assertNotIn("Git history and task dependencies in VS Code.", self.html)
        for name in ("llms.txt", "llms-full.txt"):
            with self.subTest(name=name):
                text = (ROOT / name).read_text(encoding="utf-8")
                self.assertIn("across AI providers", text)

    def test_technical_updates_match_editorial_record_and_primary_sources(self):
        text = (ROOT / "news.html").read_text(encoding="utf-8")
        entries = NewsEntries(text).entries
        approved = {
            "zk-license-demo-2026-10": {
                "source": "https://github.com/ToppyMicroServices/zk-license-demo",
                "datetime": "2026-10-04",
                "date": "October 4, 2026",
                "title": "ZK license demo: reject weakened proof conditions",
                "body": "This synthetic-credential demo uses AnonCreds to check driving entitlement and expiry without disclosing names, addresses or licence numbers. The verifier matches proof conditions to its stored request before cryptographic verification, rejects weakened conditions, and records successful requests to prevent reuse.",
                "link_text": "Source and verification",
                "related_links": [
                    {"attrs": {"href": "zk-license-demo.html", "lang": "ja", "hreflang": "ja"}, "text": "日本語の技術解説"},
                    {"attrs": {"href": "zk-license-demo-en.html", "lang": "en", "hreflang": "en"}, "text": "English technical explanation"},
                ],
            },
            "yolozu-v4-11-0": {
                "source": "https://github.com/ToppyMicroServices/YOLOZU/releases/tag/v4.11.0",
                "datetime": "2026-09-28",
                "date": "September 28, 2026",
                "title": "YOLOZU v4.11.0: portable qualification gates",
                "body": "Release qualification can now run as a reusable GitHub Action from a versioned YAML contract. When a pack is produced, the Action records the decision and uploads the verified Qualification Pack. The optional MCP integration now uses the official Python SDK v2 while retaining legacy-client checks.",
                "link_text": "Release notes and source",
            },
            "beads-git-graph-v0-9-2": {
                "source": "https://github.com/ToppyMicroServices/beads-git-graph/releases/tag/v0.9.2",
                "datetime": "2026-09-26",
                "date": "September 26, 2026",
                "title": "Beads Git Graph v0.9.2: bounded task execution",
                "body": "Task execution now limits runtime and captured output for Git, Beads, and helper processes. Provider requests are cancelled when the extension host shuts down, and retained session identifiers are capped.",
                "link_text": "Release notes and verification",
            },
            "eiml-2026-poster": {
                "source": "https://sites.google.com/view/eimlicml2026/accepted-papers_1",
                "datetime": "2026-07",
                "date": "July 2026",
                "title": "Poster accepted at the EIML workshop, ICML 2026",
                "body": "Our founder’s paper, “Stable Miscalibration in Large Language Models: A Practical View of High-Confidence Errors,” is listed among the accepted posters for the July 10 workshop in Seoul.",
                "link_text": "Official workshop listing",
            },
        }
        self.assertEqual(len(entries), len(approved))
        self.assertEqual({entry["attrs"].get("data-entry-id") for entry in entries}, set(approved))
        self.assertIn("We publish an update only when readers can inspect the released artifact or primary source.", text)
        for entry_id, expected in approved.items():
            with self.subTest(entry_id=entry_id):
                entry = next(item for item in entries if item["attrs"].get("data-entry-id") == entry_id)
                expected_tags = ["time", "h2", "p", "a"]
                if expected.get("related_links"):
                    expected_tags += ["div", "a", "a"]
                self.assertEqual(entry["tags"], expected_tags)
                self.assertEqual(entry["related_links"], expected.get("related_links", []))
                self.assertEqual(entry["loose_text"], [])
                self.assertEqual(entry["attrs"].get("data-primary-source"), expected["source"])
                self.assertEqual(entry["time_attrs"], {"datetime": expected["datetime"]})
                self.assertEqual(entry["time"], expected["date"])
                self.assertEqual(entry["h2"], expected["title"])
                self.assertEqual(entry["p"], expected["body"])
                self.assertEqual(entry["link_text"], expected["link_text"])
                self.assertEqual(entry["link_attrs"].get("href"), expected["source"])
                self.assertEqual(entry["link_attrs"].get("target"), "_blank")
                self.assertEqual(entry["link_attrs"].get("class"), "source-link")
                self.assertTrue({"noopener", "noreferrer"} <= set(entry["link_attrs"].get("rel", "").split()))
        for low_signal in ("Agent-to-Agent RFC quizzes added", "LaTeX Workspace Security", "integrated PDF viewer"):
            self.assertNotIn(low_signal, text)

    def test_main_navigation_labels_and_destinations_agree(self):
        names = (
            "index.html", "news.html", "contact.html", "agents-secure-binding.html",
            "zk-license-demo.html", "zk-license-demo-en.html", "Economy_AI_ERA.html",
            "Economy_AI_ERA_ja.html", "theory.html", "security-policy.html",
            "privacy-policy.html", "terms-legal-notice.html", "auditloop.html",
        )
        expected = [("R&D", "/#work"), ("Resources", "/#publications"),
                    ("Updates", "/news.html"), ("Company", "/#contact")]
        for name in names:
            with self.subTest(page=name):
                links = NavigationLinks((ROOT / name).read_text(encoding="utf-8")).links
                actual = [(link["text"].strip(), "/" + link["attrs"]["href"].lstrip("/"))
                          for link in links[:4]]
                self.assertEqual(actual, expected)
                for link in links:
                    if link["attrs"].get("aria-current") == "page":
                        self.assertEqual(urlsplit(link["attrs"]["href"]).path, "/" + name)

    def test_asb_flow_keeps_its_steps_accessible(self):
        page = Page(ROOT / "agents-secure-binding.html")
        self.assertFalse(any(attrs.get("role") == "img" for _, attrs in page.elements))
        flows = [attrs for attrs in page.select("section")
                 if "flow-lane" in attrs.get("class", "").split()]
        self.assertEqual(len(flows), 2)
        for attrs in flows:
            self.assertIn(attrs["aria-labelledby"], page.ids)
        lists = [attrs for attrs in page.select("ol")
                 if "flow-steps" in attrs.get("class", "").split()]
        self.assertEqual(len(lists), 2)

    def test_unsubstantiated_supporting_work_is_not_promoted(self):
        for name in ("index.html", "news.html", "llms.txt", "llms-full.txt", "README.md"):
            with self.subTest(name=name):
                text = (ROOT / name).read_text(encoding="utf-8")
                self.assertNotIn("LaTeX Workspace Security", text)
                self.assertNotIn("AuditLoop", text)
        auditloop = Page(ROOT / "auditloop.html")
        robots = [attrs for _, attrs in auditloop.elements if attrs.get("name") == "robots"]
        self.assertEqual(robots[0].get("content"), "noindex,nofollow")
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        self.assertNotIn("auditloop.html", sitemap)

    def test_deployment_runs_public_content_checks(self):
        workflow = (ROOT / ".github/workflows/static.yml").read_text(encoding="utf-8")
        self.assertIn("python3 -m unittest discover -s scripts -p 'test_*.py'", workflow)

    def test_pdf_viewer_is_not_promoted_or_indexed(self):
        for name in ("index.html", "news.html", "contact.html", "llms.txt", "llms-full.txt", "README.md"):
            with self.subTest(name=name):
                text = (ROOT / name).read_text(encoding="utf-8")
                self.assertNotIn("VSCode PDF Viewer Secure", text)
        product = Page(ROOT / "products/vscode-pdfviewer-secure/index.html")
        robots = [attrs for _, attrs in product.elements if attrs.get("name") == "robots"]
        self.assertEqual(robots[0].get("content"), "noindex,nofollow")
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        self.assertNotIn("products/vscode-pdfviewer-secure", sitemap)


if __name__ == "__main__":
    unittest.main()
