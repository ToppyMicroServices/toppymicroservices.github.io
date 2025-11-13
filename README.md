<div align="center">

# toppymicroservices.github.io

**ToppyMicroServices OÜ** — Independent AI & Control research studio (Tallinn, Estonia). We study epistemic stability, calibration & reliability, and build closed-loop tooling (AuditLoop) plus structured financial system modeling (Thermo-Credit / QTC).

</div>

## Contents
- [toppymicroservices.github.io](#toppymicroservicesgithubio)
  - [Contents](#contents)
  - [Overview](#overview)
  - [Public Pages](#public-pages)
  - [Concept Notes](#concept-notes)
  - [Interactive Quizzes](#interactive-quizzes)
  - [Research \& Roadmap](#research--roadmap)
  - [Compliance \& Governance Mapping](#compliance--governance-mapping)
  - [Local Development](#local-development)
  - [Deployment](#deployment)
  - [Contributing \& Pilots](#contributing--pilots)
  - [Changelog](#changelog)

## Overview
This repository hosts the static research site (GitHub Pages). Focus areas:

| Track | Description |
|-------|-------------|
| AI Reliability | AuditLoop: prompt → critique → revision loop; calibration & hallucination control; loop metrics (G/A/S). |
| Financial System | Thermo-Credit (QTC) — structured view of credit allocation, safety buffers & liquidity state for policy & supervision. |
| Transparent Concepts | Bilingual concept notes to make frameworks inspectable & critique-friendly. |

## Public Pages
Primary site: https://toppymicroservices.github.io (CNAME → https://toppymicros.com)

Key standalone pages:
- `Economy_AI_ERA.html` — mAI Economy / Window Guidance as Code (EN)
- `Economy_AI_ERA_ja.html` — AI時代の経済・金融アーキテクチャ（試案） (JA)
- `theory.html` — Thermo-Credit (QTC ↔ Thermodynamics) theory summary (EN, equations via MathJax)
- `education/quiz_finance_terms.html` — 金融用語クイズ (JA)
- `education/quiz_finance_terms_en.html` — Finance terms quiz (EN)

Each bilingual concept page includes reciprocal `hreflang` links (`en`, `ja`, `x-default`) for SEO and proper language discovery.

## Concept Notes
We publish early R&D drafts as “Concept Notes” instead of polished whitepapers. Goals:
- Invite critique before ossifying assumptions.
- Provide traceability: every indicator / metric accompanied by text or equation reference.
- Keep clear disclaimers (non-investment advice, not formal policy tools).

## Interactive Quizzes
Located under `education/` for learning finance terminology in JP/EN. Features:
- Mixed question types (MC, multi-select, classify, regex/text, segmentation).
- Per-question “Answer / Explain” buttons and global score reveal.
- Dark/Light theme toggle with persistence (localStorage).
- Brand logo & consistent header controls across languages.

## Research & Roadmap
**Preprint:** https://arxiv.org/abs/2510.14925 (Kantian stability & miscalibration; preliminary).  
AuditLoop metrics implemented / planned:
- Calibration: ECE, Brier, LogLoss (+ confidence introspection)
- Hallucination control: citation / evidence cross-check
- Refusal validity: abstention F1 under structured uncertainty prompts
- Stability: variance shrinkage, Prompt Sensitivity Index (PSI), self-consistency variance
- Loop metrics: LoopGain (G), Innovation Amplification (A), Dispersion Shrinkage (S)

**Timeline (snapshot)**
- Nov 2025–Jan 2026: Black-box suite build-out & parity tests
- Q1 2026: Full factorial evaluation (Model × Protocol × PromptVar × Seed × Temp × Lang)
- Q2 2026: Gray-box methods (logit lens, activation patching, Lipschitz approx) + compliance clause mapping
- Q3 2026: Dashboard beta & governance review
- Q4 2026: White-box PoC; release dataset/code v1

## Compliance & Governance Mapping
Alignment targets:
- EU AI Act (risk-based duties, transparency)
- ISO/IEC 42001 (AIMS) linkage artifacts
- NIST AI RMF (risk profiles, measurement & mitigation)

## Local Development
No build step required (pure static). To preview locally:

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
Automated via GitHub Actions (`.github/workflows/static.yml`). Workflow:
1. Trigger: push to `main` or manual dispatch.
2. Steps: checkout → configure Pages → upload entire repo as artifact → deploy.
3. Concurrency group `pages` ensures serialized deployments without canceling in-progress.

Custom domain configured via `CNAME` (toppymicros.com). Ensure DNS A/ALIAS records point to GitHub Pages.

## Contributing & Pilots
Seeking small structured pilots (central banks, supervisors, G-SIBs) and cloud credits for reproducible large-scale evaluation.  
Email: **info@toppymicros.com**

## Changelog
**Nov 2025**
- Added bilingual mAI Economy concept pages (`Economy_AI_ERA.html`, `Economy_AI_ERA_ja.html`) with reciprocal hreflang.
- Integrated finance terminology quizzes (JP/EN) with answer reveal & theme toggle.
- Added Thermo-Credit theory summary `theory.html` and Zenodo DOI link on site index/news.

**Oct 2025**
- Vision section expansion (LLM reliability & compliance mapping). 
- Research roadmap card & preprint link positioning.
- Header brand logo + GitHub icon.
- Restored Targets & roadmap (product track).

---
© 2025 ToppyMicroServices OÜ — Registry code 16551297 — Tallinn, Estonia.