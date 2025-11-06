# toppymicroservices.github.io
Independent AI &amp; Control research studio in Tallinn, Estonia. Research in epistemic stability, AI safety, and financial system modeling.

## Website updates (Oct 2025)
- Added a Vision section outlining commercialization: reliability & governance layer for LLMs (AuditLoop), compliance mapping (EU AI Act, ISO/IEC 42001, NIST AI RMF), and pilot CTA.
- Strengthened Research status: explicit cloud-only experiments (TB-scale RAG eval, multi-provider comparison, reproducibility across clouds) and impact note tying to a full journal submission.
- Added Vision callout: seeking cloud credits and collaborations to scale evaluations responsibly.

# ToppyMicroServices OÜ — Research Site

Independent AI & Control research studio in Tallinn, Estonia. We study epistemic stability, calibration, and reliability for ML systems and build closed-loop tooling to operationalize them.

## Quick links
- Website: https://toppymicroservices.github.io
- Preprint: https://arxiv.org/abs/2510.14925 (Kantian stability & miscalibration; preliminary)
- Contact: info@toppymicros.com

## What we build
- **AuditLoop** — a closed-loop reliability layer (Prompt → Critique → Revision) focused on:
  - Calibration: ECE, Brier, LogLoss (with model-reported confidence)
  - Hallucination control: citation-based checks against external evidence
  - Refusal validity: abstention F1 under uncertainty
  - Stability: variance shrinkage, Prompt Sensitivity Index (PSI), self-consistency variance
  - Kant-inspired loop metrics: **G/A/S** (LoopGain, pre/post-KL “Innovation Amplification”, Dispersion Shrinkage)

## Research roadmap (to Dec 2026)
- **Nov 2025-Jan 2026** — Implement black-box suite (ECE/Brier/LogLoss; citation-based hallucination; refusal F1; PSI; self-consistency variance; G/A/S). Enforce token-budget parity; shakedown run.
- **Q1 2026** — Full factorial: Model × Protocol {Baseline, Critique, Critique+Retrieval} × PromptVar (30) × Seed (≥3) × Temp {0, 0.7} × Lang {JP, EN}. Auto-generate PDF/JSON (ΔECE, ΔBrier, ΔHallucination, ΔPSI, G/A/S).
- **Q2 2026** — Add gray-box: logit-lens / linear probe, activation patching, small-perturbation sensitivity (output-KL Lipschitz approx). Clause mapping α (EU AI Act / ISO/IEC 42001 / NIST AI RMF).
- **Q3 2026** — Strengthen closed-loop middleware under cost parity. Track KPIs (ΔECE, ΔBrier, ΔHallucination, ΔPSI, G/A/S). Dashboard beta; privacy & red-team review.
- **Q4 2026** — White-box PoC (selected layers): local Jacobian spectral approx → H-Risk (spectral margin, condition number). Release dataset/code v1.

## Compliance & governance mapping
We align our metrics and artifacts to major frameworks:
- **EU AI Act** — risk-based obligations and GPAI transparency
- **ISO/IEC 42001** — AI management system (AIMS)
- **NIST AI RMF** — voluntary AI risk management framework

## Services (by request)
- **Research & Modeling** — Control-theoretic analysis, simulation studies, quantitative metrics (stability, calibration, H-Risk).
- **Prototyping** — Lightweight tools and reproducible experiments for data, figures, and evaluation.
- **Advisory & Workshops** — Short briefings and internal workshops on uncertainty, evaluation, and reliability in AI.

## Contributing & pilots
We welcome small pilots and cloud credits to run large-scale, reproducible experiments (GCP / Azure / AWS).  
→ Email: **info@toppymicros.com**

## Changelog
**Oct 2025**
- Added **Research roadmap** card and moved “Read the preprint” next to the Vision title.
- Tuned the Kant motto callout; reduced emphasis.
- Added header brand logo and a GitHub icon link (top-right).
- Restored the original **Targets & roadmap** (product track).