#!/usr/bin/env python3
"""Build the public source guide from ai/catalog.json, without dependencies."""

import argparse
from datetime import date
import html
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE = "https://www.toppymicros.com"
GROUPS = ("Core R&D", "Public resources")
DESCRIPTION = "Company facts, project status and primary sources for research and citation."
FORMATS = (
    ("Short index", "/llms.txt"),
    ("Full context", "/llms-full.txt"),
    ("JSON catalog", "/ai/catalog.json"),
    ("Markdown", "/ai/index.md"),
)


def require_text(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label} must be a nonempty string")
    if any(ord(char) < 32 for char in value):
        raise ValueError(f"{label} must be a single line without control characters")
    return value


def require_url(value, label):
    require_text(value, label)
    parsed = urlsplit(value)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username
            or parsed.password or parsed.port not in (None, 443)
            or any(char.isspace() or char in '<>"\\' for char in value)):
        raise ValueError(f"{label} must be an absolute HTTPS URL without credentials")
    if parsed.hostname == "toppymicros.com":
        raise ValueError(f"{label} must use the canonical www.toppymicros.com host")
    return value


def validate_links(items, label, descriptions=False):
    if not isinstance(items, list):
        raise ValueError(f"{label} must be a list")
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValueError(f"{label}[{index}] must be an object")
        require_text(item.get("label"), f"{label}[{index}].label")
        require_url(item.get("url"), f"{label}[{index}].url")
        if descriptions:
            require_text(item.get("description"), f"{label}[{index}].description")


def validate_catalog(catalog):
    if not isinstance(catalog, dict) or type(catalog.get("schema_version")) is not int:
        raise ValueError("schema_version must be the integer 1")
    if catalog["schema_version"] != 1:
        raise ValueError("Unsupported catalog schema_version")
    reviewed = require_text(catalog.get("reviewed"), "reviewed")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", reviewed):
        raise ValueError("reviewed must use YYYY-MM-DD")
    date.fromisoformat(reviewed)
    company = catalog.get("company")
    if not isinstance(company, dict):
        raise ValueError("company must be an object")
    for key in ("name", "short_name", "description", "registry_code", "jurisdiction", "identity_note"):
        require_text(company.get(key), f"company.{key}")
    for key in ("url", "github"):
        require_url(company.get(key), f"company.{key}")
    if company["url"] != SITE + "/":
        raise ValueError("company.url must match the canonical site URL")
    founder = company.get("founder")
    if not isinstance(founder, dict):
        raise ValueError("company.founder must be an object")
    require_text(founder.get("name"), "company.founder.name")
    require_url(founder.get("url"), "company.founder.url")
    projects = catalog.get("projects")
    if not isinstance(projects, list) or not projects:
        raise ValueError("projects must be a nonempty list")
    ids = set()
    for index, project in enumerate(projects):
        if not isinstance(project, dict):
            raise ValueError(f"projects[{index}] must be an object")
        identifier = require_text(project.get("id"), f"projects[{index}].id")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", identifier) or identifier in ids:
            raise ValueError(f"Invalid or duplicate project ID: {identifier}")
        ids.add(identifier)
        for key in ("name", "status", "summary", "scope_note"):
            require_text(project.get(key), f"projects[{index}].{key}")
        if project.get("group") not in GROUPS:
            raise ValueError(f"Invalid project group: {project.get('group')}")
        require_url(project.get("url"), f"projects[{index}].url")
        validate_links(project.get("sources"), f"projects[{index}].sources")
        if not project["sources"]:
            raise ValueError(f"{identifier} must link at least one primary source")
        validate_links(project.get("agent_resources", []), f"projects[{index}].agent_resources")
    validate_links(catalog.get("resources"), "resources", descriptions=True)
    validate_links(catalog.get("policies"), "policies", descriptions=True)
    return catalog


def md_text(value):
    """Keep catalog text literal when Markdown is rendered as HTML."""
    escaped = html.escape(value, quote=False).replace("\\", "\\\\")
    return re.sub(r"([\[\]*_`])", r"\\\1", escaped)


def md_link(label, url):
    destination = url.replace("(", "%28").replace(")", "%29")
    return f"[{md_text(label)}]({destination})"


def html_link(label, url, **attributes):
    extra = "".join(f' {key.replace("_", "-")}="{html.escape(value, quote=True)}"'
                    for key, value in attributes.items())
    return f'<a href="{html.escape(url, quote=True)}"{extra}>{html.escape(label)}</a>'


def project_markdown(project, reviewed, heading=1, include_guide=False):
    lines = [f'{"#" * heading} {md_text(project["name"])}', "",
             f'Status: {md_text(project["status"])}', "",
             md_text(project["summary"]), "", md_text(project["scope_note"]), "",
             f'Canonical page: {md_link(project["name"], project["url"])}', "",
             "Primary sources:", ""]
    lines.extend(f'- {md_link(item["label"], item["url"])}' for item in project["sources"])
    if project.get("agent_resources"):
        lines += ["", "Agent resources:", ""]
        lines.extend(f'- {md_link(item["label"], item["url"])}'
                     for item in project["agent_resources"])
    if include_guide:
        lines += ["", f"Reviewed: {reviewed}", "",
                  f'Source guide: {md_link("Toppy AI resources", SITE + "/ai/")}', ""]
    return "\n".join(lines)


def company_markdown(company):
    return "\n".join([
        "## Company", "", md_text(company["description"]), "",
        f'Legal name: {md_text(company["name"])}', "",
        f'Public name: {md_text(company["short_name"])}', "",
        f'Registration: {md_text(company["jurisdiction"])} · {md_text(company["registry_code"])}', "",
        f'Website: {md_link(company["short_name"], company["url"])}', "",
        f'GitHub: {md_link(company["short_name"], company["github"])}', "",
        f'Founder and operator: {md_link(company["founder"]["name"], company["founder"]["url"])}', "",
        md_text(company["identity_note"]),
    ])


def markdown_links(title, items):
    lines = [f"## {title}", ""]
    lines.extend(f'- {md_link(item["label"], item["url"])}: {md_text(item["description"])}'
                 for item in items)
    return "\n".join(lines)


def render_guide_markdown(catalog, full_context=False):
    company = catalog["company"]
    title = f'{company["name"]} — Full context' if full_context else "Toppy, with sources."
    parts = [f"# {md_text(title)}", DESCRIPTION,
             f'Canonical guide: {SITE}/ai/', f'Reviewed: {catalog["reviewed"]}',
             " · ".join(md_link(label, SITE + path) for label, path in FORMATS),
             company_markdown(company)]
    for group in GROUPS:
        parts.append(f"## {group}")
        for project in catalog["projects"]:
            if project["group"] == group:
                parts.append(project_markdown(project, catalog["reviewed"], heading=3))
                parts.append(f'Markdown: {SITE}/ai/projects/{project["id"]}.md')
    parts += [markdown_links("Further reading", catalog["resources"]),
              markdown_links("Policies", catalog["policies"]),
              "For current releases, exact implementation details and policy terms, use the linked primary sources."]
    return "\n\n".join(parts) + "\n"


def render_index(catalog):
    company = catalog["company"]
    parts = [f'# {md_text(company["name"])}', f'> {md_text(company["description"])}',
             f'Canonical site: {company["url"]} · Reviewed: {catalog["reviewed"]}',
             md_text(company["identity_note"]),
             "## Source guide", "\n".join([
                 f'- {md_link("AI resources", SITE + "/ai/")}: Company facts, project status and primary sources.',
                 f'- {md_link("Full context", SITE + "/llms-full.txt")}: Combined project and policy summaries.',
                 f'- {md_link("JSON catalog", SITE + "/ai/catalog.json")}: Structured source data for this guide.',
             ])]
    for group in GROUPS:
        parts.append(f"## {group}")
        parts.append("\n".join(
            f'- {md_link(project["name"], SITE + "/ai/projects/" + project["id"] + ".md")}: '
            f'{md_text(project["status"].rstrip("."))}. {md_text(project["summary"])}'
            for project in catalog["projects"] if project["group"] == group))
    parts += ["## Policies", "\n".join(
                  f'- {md_link(item["label"], item["url"])}' for item in catalog["policies"])]
    return "\n\n".join(parts) + "\n"


def render_project_html(project):
    sources = " ".join(html_link(item["label"], item["url"]) for item in project["sources"])
    agents = ""
    if project.get("agent_resources"):
        agents = '\n      <p class="source-links"><span>Agent resources:</span> ' + " ".join(
            html_link(item["label"], item["url"]) for item in project["agent_resources"]) + "</p>"
    return f'''    <article class="project" id="{html.escape(project["id"], quote=True)}">
      <p class="status">{html.escape(project["status"])}</p>
      <h3>{html_link(project["name"], project["url"])}</h3>
      <p class="summary">{html.escape(project["summary"])}</p>
      <p class="scope">{html.escape(project["scope_note"])}</p>
      <p class="source-links"><span>Primary sources:</span> {sources}</p>{agents}
      <p class="source-links">{html_link("Project Markdown", "/ai/projects/" + project["id"] + ".md")}</p>
    </article>'''


def render_guide_html(catalog):
    company = catalog["company"]
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": SITE + "/ai/#page",
        "url": SITE + "/ai/",
        "name": "AI resources | ToppyMicroServices",
        "description": DESCRIPTION,
        "inLanguage": "en",
        "dateModified": catalog["reviewed"],
        "publisher": {"@id": SITE + "/#organization"},
        "about": [{"@id": SITE + "/#organization"}, {"@id": SITE + "/#founder"}],
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": [
                {"@type": "ListItem", "position": index, "name": project["name"], "url": project["url"]}
                for index, project in enumerate(catalog["projects"], 1)
            ],
        },
    }
    schema_text = json.dumps(schema, ensure_ascii=False, indent=2)
    for literal, escaped in (("<", "\\u003c"), (">", "\\u003e"), ("&", "\\u0026"),
                             ("\u2028", "\\u2028"), ("\u2029", "\\u2029")):
        schema_text = schema_text.replace(literal, escaped)
    sections = []
    for group, identifier in zip(GROUPS, ("core-rd", "public-resources")):
        projects = "\n".join(render_project_html(project) for project in catalog["projects"]
                             if project["group"] == group)
        sections.append(f'''  <section aria-labelledby="{identifier}">
    <h2 class="section-heading" id="{identifier}">{html.escape(group)}</h2>
    <div class="project-list">
{projects}
    </div>
  </section>''')
    formats = "\n".join("        " + html_link(label, path) for label, path in FORMATS)
    resources = "\n".join(
        f'      <li>{html_link(item["label"], item["url"])} — {html.escape(item["description"])}</li>'
        for item in catalog["resources"])
    policies = "\n".join(
        f'      <li>{html_link(item["label"], item["url"])} — {html.escape(item["description"])}</li>'
        for item in catalog["policies"])
    section_html = "\n".join(sections)
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI resources | ToppyMicroServices</title>
  <meta name="description" content="{html.escape(DESCRIPTION, quote=True)}">
  <link rel="canonical" href="{SITE}/ai/">
  <link rel="describedby" href="/llms.txt" type="text/plain">
  <link rel="alternate" href="/ai/index.md" type="text/markdown" title="Markdown source guide">
  <meta property="og:type" content="website">
  <meta property="og:title" content="AI resources | ToppyMicroServices">
  <meta property="og:description" content="{html.escape(DESCRIPTION, quote=True)}">
  <meta property="og:url" content="{SITE}/ai/">
  <meta property="og:image" content="{SITE}/og-brand-clean.png">
  <link rel="icon" href="/216722720.png" type="image/png">
  <link rel="stylesheet" href="/assets/ai-resources.css">
  <script type="application/ld+json">
{schema_text}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="ToppyMicroServices home"><img src="/216722720.png" width="32" height="32" alt=""><span>ToppyMicroServices</span></a>
      <nav aria-label="Main navigation">
        <a href="/">Home</a>
        <a href="/#work">Projects</a>
        <a href="/ai/" aria-current="page">AI resources</a>
      </nav>
    </div>
  </header>
  <main class="container" id="main">
    <section class="hero" aria-labelledby="title">
      <p class="eyebrow">SOURCE GUIDE</p>
      <h1 id="title">Toppy, with sources.</h1>
      <p class="lead">{html.escape(DESCRIPTION)}</p>
      <p class="note">Reviewed <time datetime="{html.escape(catalog["reviewed"], quote=True)}">{html.escape(catalog["reviewed"])}</time>.</p>
      <nav class="formats" aria-label="Available formats">
{formats}
      </nav>
    </section>
    <section class="company" aria-labelledby="company">
      <h2 class="section-heading" id="company">Company</h2>
      <p>{html.escape(company["description"])}</p>
      <dl>
        <div><dt>Legal name</dt><dd>{html.escape(company["name"])}</dd></div>
        <div><dt>Public name</dt><dd>{html.escape(company["short_name"])}</dd></div>
        <div><dt>Registration</dt><dd>{html.escape(company["jurisdiction"])} · {html.escape(company["registry_code"])}</dd></div>
        <div><dt>Website</dt><dd>{html_link(company["short_name"], company["url"])}</dd></div>
        <div><dt>GitHub</dt><dd>{html_link(company["short_name"], company["github"])}</dd></div>
        <div><dt>Founder and operator</dt><dd>{html_link(company["founder"]["name"], company["founder"]["url"])}</dd></div>
      </dl>
      <p class="note">{html.escape(company["identity_note"])}</p>
    </section>
{section_html}
    <section aria-labelledby="further-reading">
      <h2 class="section-heading" id="further-reading">Further reading</h2>
      <ul class="source-links">
{resources}
      </ul>
    </section>
  </main>
  <footer class="container">
    <h2 class="section-heading" id="policies">Policies</h2>
    <ul class="footer-links" aria-labelledby="policies">
{policies}
    </ul>
    <p class="note">For current releases, exact implementation details and policy terms, use the linked primary sources.</p>
  </footer>
</body>
</html>
'''


def render_outputs(catalog):
    validate_catalog(catalog)
    outputs = {
        "llms.txt": render_index(catalog),
        "llms-full.txt": render_guide_markdown(catalog, full_context=True),
        "ai/index.md": render_guide_markdown(catalog),
        "ai/index.html": render_guide_html(catalog),
    }
    for project in catalog["projects"]:
        outputs[f'ai/projects/{project["id"]}.md'] = project_markdown(
            project, catalog["reviewed"], include_guide=True)
    return outputs


def stale_outputs(root, outputs):
    stale = [name for name, body in outputs.items()
             if not (root / name).is_file() or (root / name).read_text(encoding="utf-8") != body]
    expected = {root / name for name in outputs}
    stale.extend(str(path.relative_to(root)) for path in sorted((root / "ai/projects").glob("*.md"))
                 if path not in expected)
    return stale


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Report stale generated files without writing")
    args = parser.parse_args(argv)
    try:
        catalog = json.loads((ROOT / "ai/catalog.json").read_text(encoding="utf-8"))
        outputs = render_outputs(catalog)
        if args.check:
            stale = stale_outputs(ROOT, outputs)
            if stale:
                print("Stale AI resources: " + ", ".join(stale), file=sys.stderr)
                return 1
            print(f"AI resources are current ({len(outputs)} files).")
            return 0
        extras = set(stale_outputs(ROOT, outputs)) - set(outputs)
        if extras:
            print("Retired project files need explicit removal: " + ", ".join(sorted(extras)), file=sys.stderr)
            return 1
        for name, body in outputs.items():
            path = ROOT / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(body, encoding="utf-8", newline="\n")
        print(f"Built {len(outputs)} AI resource files.")
        return 0
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f"Cannot build AI resources: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
