<div align="center">

# toppymicroservices.github.io

**ToppyMicroServices OÜ** — Software and independent research.

This repository contains the source for the public website of ToppyMicroServices OÜ.  
The README is written for readers who want to understand the site structure, intent, and scope.

</div>

## Contents
- [toppymicroservices.github.io](#toppymicroservicesgithubio)
  - [Contents](#contents)
  - [Overview](#overview)
  - [Public Pages](#public-pages)
  - [Concept Notes](#concept-notes)
  - [Interactive Quizzes](#interactive-quizzes)
  - [Research References](#research-references)
  - [Compliance & Governance Mapping](#compliance--governance-mapping)
  - [Local Development](#local-development)
  - [Deployment](#deployment)
  - [Contact](#contact)
  - [Changelog](#changelog)

## Overview
This repository hosts the static website for **ToppyMicroServices OÜ**, deployed via GitHub Pages.

The homepage features software for agent authorization, vision-model evaluation, and developer workflows. It links to public source code and distribution pages, alongside the founder's research and English and Japanese RFC learning materials.

Featured software: Agents Secure Binding, YOLOZU, LaTeX Workspace Security, and Beads Git Graph. The two extensions retain their LaTeX Workshop and Git Graph attribution. Research notes and experimental profiles are not presented as adopted standards or production guarantees.

## Public Pages
The site consists of standalone product, research, education, and policy pages.

Primary site: https://toppymicroservices.github.io (CNAME → https://www.toppymicros.com)

Selected standalone pages:

- `index.html` — selected public software, research, learning materials, and company information
- `news.html` — dated releases and research updates, linked to primary sources
- `agents-secure-binding.html` — ASB technical introduction and source links
- `yolozu/` — vision-prediction validation and evaluation toolkit
- `education/rfc_quizzes.html` and `education/rfc_quizzes_ja.html` — RFC learning guides and quizzes
- `contact.html` — business contact and product support information
- `products/vscode-pdfviewer-secure/` — VSCode PDF Viewer Secure product page
- `Economy_AI_ERA.html` — AI Economy / Window Guidance as Code (EN) — research note published as a proof artifact
- `Economy_AI_ERA_ja.html` — 同上（JA）
- `theory.html` — summary of Thermo-Credit (QTC) theory, published as a proof artifact
- `education/quiz_finance_terms.html` — Finance terminology quiz (JA)
- `education/quiz_finance_terms_en.html` — Finance terminology quiz (EN)

## Concept Notes
Concept notes are early-stage research notes and design documents published as static pages.

These pages describe research ideas and assumptions. They are not operational products, policy tools, or production systems.

## Interactive Quizzes
This repository includes client-side quizzes for RFCs, protocol design, and finance terminology in Japanese and English.

These quizzes are educational materials, not certification exams.

### Quiz authoring policy (required)
These quizzes are not designed for certifications or rote memorization. Their purpose is to help developers build durable engineering skill in an AI-first era.

**Purpose**
- Organize what developers should already understand when using AI to implement or review related themes.
- Prioritize learning-by-reading the explanations: the explanation is part of the curriculum, not just an answer key.

**Question policy**
- Avoid memorization of commands/flags/options as a primary goal (AI can look these up). Instead, test the meanings behind them: concepts, design philosophy, thought frameworks, key terms, metric meanings, common misconceptions, and typical errors.
- When a new reference URL or a new small theme is added, create **10 questions**.
- For a large theme, create **25 questions**.

**Explanation policy (must)**
- Explanations are learning-first: a reader should be able to study by reading them.
- Include (at minimum):
  - (1) Context / why the question exists ("問題を出した背景") and what skill it trains
  - (2) What is being asked (definitions + the core concept)
  - (3) Real-world usage: when/where you would face this in practice
  - (4) Term/word explanations (mini glossary when needed)
  - (5) Especially important keywords must be **bold**
  - (6) A careful explanation for every option (including why each incorrect option is wrong); do not end with a one-line summary
  - (7) Related topics / adjacent concepts to connect the learning (briefly)
- Author the question and explanation blocks so Markdown-like formatting is safely/consistently rendered by the quiz template.

## Research References
Some pages reference external research outputs associated with ToppyMicroServices.

- EIML workshop at ICML 2026: [official accepted-papers listing](https://sites.google.com/view/eimlicml2026/accepted-papers_1), including the founder's accepted poster. This is workshop acceptance, not an ICML main-conference paper or evidence of attendance.
- Related preprint: https://arxiv.org/abs/2510.14925. Keep this source distinct from the workshop listing; the listing does not link a paper version.
- Related artifacts include AuditLoop evaluation metrics and Thermo-Credit indicators, which are referenced from the site pages where relevant

## Compliance & Governance Mapping
Selected pages reference external frameworks such as the EU AI Act, ISO/IEC 42001, and the NIST AI Risk Management Framework.

These references are provided for alignment and context only. They do not imply certification, regulatory approval, or formal compliance claims.

## Local Development
The site can be served locally for inspection using a simple static file server:

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

Or with Node:

```bash
npx serve .
```

Lint / format suggestions (optional, not enforced yet):
```bash
brew install tidy-html5
tidy -qe Economy_AI_ERA.html
```

## Deployment
The site is deployed automatically using GitHub Actions and GitHub Pages.

Automated via GitHub Actions (`.github/workflows/static.yml`). Workflow:
1. Trigger: push to `main` or manual dispatch.
2. Steps: checkout → prepare a publish-only `_site/` directory → configure Pages → upload artifact → deploy.
3. Concurrency group `pages` ensures serialized deployments without canceling in-progress.
4. Internal-only files such as `.github/`, `.beads/`, scripts, and repository metadata are excluded from the publish artifact.

Custom domain configured via `CNAME` (`www.toppymicros.com`). Keep `www` as the canonical host and redirect the apex domain there at the DNS/CDN edge.

## Contact
For inquiries: **info@toppymicros.com**

## Changelog
This changelog records major structural or publication-related updates to the site.

- 2026-02: Added YOLOZU release links (PyPI + Zenodo software/manual records) to the homepage.
- 2025-11: Added bilingual AI Economy proof-artifact pages and Thermo-Credit theory summary.
- 2025-10: Initial public site structure and deployment workflow.

---
© 2026 ToppyMicroServices OÜ — Registry code 16551297 — Tallinn, Estonia.
