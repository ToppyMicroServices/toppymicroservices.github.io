"""Content, safety and regeneration checks for the public AI source guide."""

import copy
from datetime import date
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import tempfile
import unittest
import xml.etree.ElementTree as ET
from unittest import mock
from urllib.parse import unquote, urlsplit

import build_ai_context as build


ROOT = Path(__file__).resolve().parents[1]


class Guide(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.text = []
        self.ids = []
        self.scripts = []
        self.script = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "script":
            self.script = [attrs, ""]

    def handle_endtag(self, tag):
        if tag == "script" and self.script is not None:
            self.scripts.append(self.script)
            self.script = None

    def handle_data(self, data):
        if self.script is not None:
            self.script[1] += data
        else:
            self.text.append(data)

    @property
    def visible_text(self):
        return " ".join(self.text)

    @property
    def links(self):
        return {attrs["href"] for _, attrs in self.elements if "href" in attrs}


def catalog_links(catalog):
    yield catalog["company"]["url"]
    yield catalog["company"]["github"]
    yield catalog["company"]["founder"]["url"]
    for project in catalog["projects"]:
        yield project["url"]
        for item in project["sources"] + project.get("agent_resources", []):
            yield item["url"]
    for item in catalog["resources"] + catalog["policies"]:
        yield item["url"]


class AIContextTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads((ROOT / "ai/catalog.json").read_text(encoding="utf-8"))
        cls.outputs = build.render_outputs(cls.catalog)
        cls.guide = Guide(cls.outputs["ai/index.html"])

    def test_generated_files_match_catalog(self):
        self.assertEqual(build.stale_outputs(ROOT, self.outputs), [],
                         "Run python3 scripts/build_ai_context.py after editing ai/catalog.json")

    def test_output_is_deterministic(self):
        self.assertEqual(build.render_outputs(copy.deepcopy(self.catalog)), self.outputs)
        for text in self.outputs.values():
            self.assertTrue(text.endswith("\n"))
            self.assertNotIn("\r", text)
            self.assertFalse(any(line.endswith(" ") for line in text.splitlines()))

    def test_public_schema_and_dates(self):
        self.assertEqual(self.catalog["schema_version"], 1)
        self.assertEqual(date.fromisoformat(self.catalog["reviewed"]).isoformat(), self.catalog["reviewed"])
        for name, text in self.outputs.items():
            with self.subTest(name=name):
                self.assertIn(self.catalog["reviewed"], text)

    def test_unique_project_and_html_ids(self):
        identifiers = [project["id"] for project in self.catalog["projects"]]
        self.assertEqual(len(identifiers), len(set(identifiers)))
        self.assertEqual(len(self.guide.ids), len(set(self.guide.ids)))
        for identifier in identifiers:
            self.assertRegex(identifier, r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
            self.assertIn(identifier, self.guide.ids)

    def test_company_facts_match_visible_html_and_markdown(self):
        company = self.catalog["company"]
        facts = [company[key] for key in ("name", "short_name", "description", "registry_code",
                                         "jurisdiction", "identity_note")]
        facts.append(company["founder"]["name"])
        for fact in facts:
            with self.subTest(fact=fact):
                self.assertIn(fact, self.guide.visible_text)
                self.assertIn(build.md_text(fact), self.outputs["ai/index.md"])
                self.assertIn(build.md_text(fact), self.outputs["llms-full.txt"])

    def test_project_facts_match_all_detailed_formats(self):
        for project in self.catalog["projects"]:
            project_text = self.outputs[f'ai/projects/{project["id"]}.md']
            for key in ("name", "status", "summary", "scope_note"):
                with self.subTest(project=project["id"], key=key):
                    self.assertIn(project[key], self.guide.visible_text)
                    for text in (self.outputs["ai/index.md"], self.outputs["llms-full.txt"], project_text):
                        self.assertIn(build.md_text(project[key]), text)
            self.assertIn(project["url"], project_text)
            self.assertIn(project["url"], self.guide.links)

    def test_all_primary_links_are_exposed(self):
        for url in catalog_links(self.catalog):
            with self.subTest(url=url):
                self.assertIn(url, self.guide.links)
                self.assertIn(url, self.outputs["ai/index.md"])
                self.assertIn(url, self.outputs["llms-full.txt"])
        for project in self.catalog["projects"]:
            project_text = self.outputs[f'ai/projects/{project["id"]}.md']
            self.assertTrue(project["sources"])
            for item in project["sources"] + project.get("agent_resources", []):
                self.assertIn(item["url"], project_text)
        for item in self.catalog["resources"] + self.catalog["policies"]:
            self.assertIn(item["description"], self.guide.visible_text)
            self.assertIn(build.md_text(item["description"]), self.outputs["ai/index.md"])

    def test_index_routes_to_project_files_without_duplicating_full_context(self):
        text = self.outputs["llms.txt"]
        for project in self.catalog["projects"]:
            url = f'{build.SITE}/ai/projects/{project["id"]}.md'
            self.assertIn(url, text)
            self.assertIn(build.md_text(project["summary"]), text)
            self.assertNotIn(build.md_text(project["scope_note"]), text)
        self.assertLess(len(text), len(self.outputs["llms-full.txt"]))
        for name in ("llms.txt", "llms-full.txt"):
            self.assertIn("across AI providers", self.outputs[name])

    def test_short_index_matches_reference_parser_file_lists(self):
        # Link and section patterns from https://llmstxt.org/core.html.
        link = re.compile(r'-\s*\[(?P<title>[^\]]+)\]\((?P<url>[^\)]+)\)(?::\s*(?P<desc>.*))?')
        start, *sections = re.split(r'^##\s*(.*?$)', self.outputs["llms.txt"], flags=re.MULTILINE)
        self.assertIn(build.md_text(self.catalog["company"]["identity_note"]), start)
        self.assertEqual(len(sections) % 2, 0)
        parsed_urls = set()
        for heading, content in zip(sections[::2], sections[1::2]):
            lines = [line for line in content.splitlines() if line.strip()]
            self.assertTrue(lines, heading)
            for line in lines:
                with self.subTest(heading=heading, line=line):
                    match = link.fullmatch(line)
                    self.assertIsNotNone(match)
                    self.assertTrue(match["url"].startswith("https://"))
                    self.assertNotIn("<", match["url"])
                    self.assertNotIn(">", match["url"])
                    parsed_urls.add(match["url"])
        for project in self.catalog["projects"]:
            self.assertIn(f'{build.SITE}/ai/projects/{project["id"]}.md', parsed_urls)
        encoded = build.md_link("Example", "https://example.org/topic_(details)?query=(one)")
        match = link.fullmatch("- " + encoded)
        self.assertIsNotNone(match)
        self.assertEqual(match["url"], "https://example.org/topic_%28details%29?query=%28one%29")

    def test_review_date_is_visible_in_hero_and_source_links_have_no_separators(self):
        text = self.outputs["ai/index.html"]
        hero = text.split('<section class="hero"', 1)[1].split("</section>", 1)[0]
        self.assertIn('<p class="note">Reviewed <time', hero)
        self.assertIn(self.catalog["reviewed"], Guide(hero).visible_text)
        for links in re.findall(r'<p class="source-links">(.*?)</p>', text):
            self.assertNotIn(" · ", links)

    def test_required_machine_readable_entry_points(self):
        for path in ("/llms.txt", "/llms-full.txt", "/ai/catalog.json", "/ai/index.md"):
            self.assertIn(path, self.guide.links)
            self.assertIn(build.SITE + path, self.outputs["ai/index.md"])
        all_links = set(catalog_links(self.catalog))
        self.assertIn(build.SITE + "/yolozu/docs/llms.txt", all_links)
        self.assertIn(build.SITE + "/yolozu/docs/capabilities.json", all_links)
        self.assertIn("https://observatory.toppymicros.com/llms.txt", all_links)
        self.assertIn("https://github.com/ToppyMicroServices/agents-secure-binding/blob/main/docs/SSOT.md", all_links)

    def test_project_pages_describe_their_summaries_without_claiming_equivalence(self):
        pages = {
            "agents-secure-binding.html": "agents-secure-binding",
            "Economy_AI_ERA.html": "mai-economy",
            "Economy_AI_ERA_ja.html": "mai-economy",
            "theory.html": "mai-economy",
            "zk-license-demo.html": "identity-data-minimization",
            "zk-license-demo-en.html": "identity-data-minimization",
        }
        for name, identifier in pages.items():
            with self.subTest(name=name):
                page = Guide((ROOT / name).read_text(encoding="utf-8"))
                links = [attrs for tag, attrs in page.elements
                         if tag == "link" and attrs.get("type") == "text/markdown"]
                self.assertEqual(len(links), 1)
                self.assertEqual(links[0]["rel"], "describedby")
                self.assertEqual(links[0]["href"], f"{build.SITE}/ai/projects/{identifier}.md")

    def test_source_guide_is_in_sitemap_but_verification_file_is_not(self):
        tree = ET.parse(ROOT / "sitemap.xml")
        urls = {element.text for element in tree.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
        self.assertIn(build.SITE + "/ai/", urls)
        verification = "google4386f603eb3252c6.html"
        self.assertNotIn(build.SITE + "/" + verification, urls)
        self.assertTrue((ROOT / verification).is_file())
        workflow = (ROOT / ".github/workflows/sitemap.yml").read_text(encoding="utf-8")
        self.assertIn("exclude-paths: /" + verification, workflow)

    def test_retired_private_and_unapproved_surfaces_are_absent(self):
        forbidden = ("admin-observatory.toppymicros.com", "vault.toppymicros.com", "ui.kanariya.toppymicros.com",
                     "observatory.toppymicros.com/research", "products/vscode-pdfviewer-secure", "pdf viewer",
                     "auditloop", "latex workspace security")
        for name, text in self.outputs.items():
            for value in forbidden:
                with self.subTest(name=name, value=value):
                    self.assertNotIn(value, text.lower())

    def test_namesake_and_nationality_safeguards_remain(self):
        note = self.catalog["company"]["identity_note"]
        for token in ("namesakes", "nationality", "residence", "registration"):
            self.assertIn(token, note)
        self.assertIn(note, self.guide.visible_text)
        for name in ("llms.txt", "llms-full.txt", "ai/index.md"):
            self.assertIn(build.md_text(note), self.outputs[name])

    def test_urls_are_https_and_use_canonical_main_host(self):
        for url in catalog_links(self.catalog):
            with self.subTest(url=url):
                parsed = urlsplit(url)
                self.assertEqual(parsed.scheme, "https")
                self.assertNotEqual(parsed.hostname, "toppymicros.com")
                self.assertFalse(parsed.username or parsed.password)
                self.assertNotIn("..", unquote(parsed.path).split("/"))
        canonical = [attrs["href"] for _, attrs in self.guide.elements if attrs.get("rel") == "canonical"]
        self.assertEqual(canonical, [build.SITE + "/ai/"])
        alternate = [attrs for _, attrs in self.guide.elements if attrs.get("rel") == "alternate"]
        self.assertEqual(alternate[0]["href"], "/ai/index.md")
        self.assertEqual(alternate[0]["type"], "text/markdown")

    def test_local_link_targets_and_fragments_exist(self):
        urls = set(catalog_links(self.catalog)) | self.guide.links
        urls.update(attrs["src"] for _, attrs in self.guide.elements if "src" in attrs)
        for url in urls:
            parsed = urlsplit(url)
            if parsed.hostname and parsed.hostname != "www.toppymicros.com":
                continue
            # This report is mounted by a separate GitHub Pages repository.
            if parsed.path.startswith("/2025_11_Thermo_Credit/"):
                continue
            path = unquote(parsed.path).lstrip("/") or "ai/index.html"
            if parsed.path == "/":
                path = "index.html"
            elif path.endswith("/"):
                path += "index.html"
            with self.subTest(url=url):
                self.assertTrue(path in self.outputs or (ROOT / path).is_file(), path)
                if parsed.fragment:
                    content = self.outputs.get(path)
                    if content is None:
                        content = (ROOT / path).read_text(encoding="utf-8")
                    self.assertIn(unquote(parsed.fragment), Guide(content).ids)

    def test_structured_data_matches_visible_projects(self):
        self.assertEqual(len(self.guide.scripts), 1)
        attrs, text = self.guide.scripts[0]
        self.assertEqual(attrs.get("type"), "application/ld+json")
        schema = json.loads(text)
        self.assertEqual(schema["@type"], "CollectionPage")
        self.assertEqual(schema["publisher"]["@id"], build.SITE + "/#organization")
        self.assertIn({"@id": build.SITE + "/#founder"}, schema["about"])
        self.assertEqual(schema["dateModified"], self.catalog["reviewed"])
        items = schema["mainEntity"]["itemListElement"]
        self.assertEqual([item["url"] for item in items], [project["url"] for project in self.catalog["projects"]])
        self.assertEqual([item["position"] for item in items], list(range(1, len(items) + 1)))
        self.assertNotIn("aggregateRating", text)
        self.assertNotIn("SearchAction", text)
        self.assertFalse(any(key.startswith("on") for _, attrs in self.guide.elements for key in attrs))

    def test_template_escapes_html_and_json_script_endings(self):
        catalog = copy.deepcopy(self.catalog)
        payload = '</script><script>alert("x")</script><img src=x onerror=alert(1)> & [text]'
        catalog["projects"][0]["name"] = payload
        catalog["projects"][0]["summary"] = payload
        catalog["company"]["identity_note"] = payload
        outputs = build.render_outputs(catalog)
        page = Guide(outputs["ai/index.html"])
        self.assertEqual(len(page.scripts), 1)
        self.assertEqual(sum(tag == "img" for tag, _ in page.elements), 1)
        self.assertIn(payload, page.visible_text)
        self.assertNotIn(payload, outputs["ai/index.html"])
        self.assertEqual(json.loads(page.scripts[0][1])["mainEntity"]["itemListElement"][0]["name"], payload)
        self.assertNotIn("<script>", outputs["ai/index.md"])
        self.assertIn("&lt;script&gt;", outputs["ai/index.md"])

    def test_invalid_catalog_values_are_rejected(self):
        variants = []
        for url in ("http://example.org/", "javascript:alert(1)", "https://user:password@example.org/",
                    "https://toppymicros.com/", 'https://example.org/\"bad', "https://example.org/has space"):
            bad = copy.deepcopy(self.catalog)
            bad["projects"][0]["url"] = url
            variants.append(bad)
        for value in ("../escape", "UPPER", "", self.catalog["projects"][1]["id"]):
            bad = copy.deepcopy(self.catalog)
            bad["projects"][0]["id"] = value
            variants.append(bad)
        for value in ("2026-02-30", "2026-1-1", "tomorrow"):
            bad = copy.deepcopy(self.catalog)
            bad["reviewed"] = value
            variants.append(bad)
        for value in (True, "1", 2):
            bad = copy.deepcopy(self.catalog)
            bad["schema_version"] = value
            variants.append(bad)
        for index, bad in enumerate(variants):
            with self.subTest(index=index), self.assertRaises(ValueError):
                build.render_outputs(bad)

    def test_check_mode_detects_stale_and_orphan_files_without_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "ai").mkdir()
            (root / "ai/catalog.json").write_text(json.dumps(self.catalog), encoding="utf-8")
            with mock.patch.object(build, "ROOT", root), mock.patch("sys.stdout", new_callable=io.StringIO), mock.patch("sys.stderr", new_callable=io.StringIO):
                self.assertEqual(build.main([]), 0)
                self.assertEqual(build.main(["--check"]), 0)
                (root / "llms.txt").write_text("stale\n", encoding="utf-8")
                (root / "ai/projects/retired.md").write_text("orphan\n", encoding="utf-8")
                before = {str(path.relative_to(root)): (path.read_bytes(), path.stat().st_mtime_ns)
                          for path in root.rglob("*") if path.is_file()}
                self.assertEqual(build.main(["--check"]), 1)
                self.assertEqual(set(build.stale_outputs(root, self.outputs)), {"llms.txt", "ai/projects/retired.md"})
                self.assertEqual(build.main([]), 1, "Retired project files require an explicit removal")
                after = {str(path.relative_to(root)): (path.read_bytes(), path.stat().st_mtime_ns)
                         for path in root.rglob("*") if path.is_file()}
                self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()
