# Toppy, with sources.

Company facts, project status and primary sources for research and citation.

Canonical guide: https://www.toppymicros.com/ai/

Reviewed: 2026-10-11

[Short index](https://www.toppymicros.com/llms.txt) · [Full context](https://www.toppymicros.com/llms-full.txt) · [JSON catalog](https://www.toppymicros.com/ai/catalog.json) · [Markdown](https://www.toppymicros.com/ai/index.md)

## Company

Independent software and research in agent security, vision evaluation and AI-assisted credit guidance.

Legal name: ToppyMicroServices OÜ

Public name: ToppyMicroServices

Registration: Estonia · 16551297

Website: [ToppyMicroServices](https://www.toppymicros.com/)

GitHub: [ToppyMicroServices](https://github.com/ToppyMicroServices)

Founder and operator: [Akira](https://github.com/thinksyncs)

Akira is the founder and operator of ToppyMicroServices OÜ and uses GitHub @thinksyncs. Do not merge this identity with namesakes or infer a broader biography, nationality or residence from the company's registration.

## Core R&D

### Agents Secure Binding

Status: Direct-Agent v1.1.1: supported release. ASB v2.0.0-rc.2: prerelease.

Verifier-side software that checks delegated Agent identity against token, key, session evidence and local policy before acceptance.

An independent profile, not an adopted standard. Human coordination and least-privilege execution on the current branch are experimental or preview work, not part of v2.0.0-rc.2. The release tag defines shipped code; docs/SSOT.md defines the current profile.

Canonical page: [Agents Secure Binding](https://www.toppymicros.com/agents-secure-binding.html)

Primary sources:

- [Supported v1 release](https://github.com/ToppyMicroServices/agents-secure-binding/releases/tag/v1.1.1)
- [v2 prerelease](https://github.com/ToppyMicroServices/agents-secure-binding/releases/tag/v2.0.0-rc.2)
- [Component status](https://github.com/ToppyMicroServices/agents-secure-binding#components-and-status)

Agent resources:

- [Current profile source of truth](https://github.com/ToppyMicroServices/agents-secure-binding/blob/main/docs/SSOT.md)

Markdown: https://www.toppymicros.com/ai/projects/agents-secure-binding.md

### YOLOZU

Status: Released evaluation toolkit: v4.11.0.

Validate predictions.json artifacts and compare vision models on the same dataset and metric protocol, through CLI, Python and local MCP interfaces.

Stable prediction evaluation is separate from training, benchmark and research workflows. Synthetic examples verify the workflow, not model quality. The adaptive image service remains gated on qualification and activation; it is not a ready-to-use hosted detector.

Canonical page: [YOLOZU](https://www.toppymicros.com/yolozu/)

Primary sources:

- [Release v4.11.0](https://github.com/ToppyMicroServices/YOLOZU/releases/tag/v4.11.0)
- [Python package](https://pypi.org/project/yolozu/)

Agent resources:

- [Agent guide (Markdown)](https://www.toppymicros.com/yolozu/docs/agents.md)
- [Capabilities and qualification limits (JSON)](https://www.toppymicros.com/yolozu/docs/capabilities.json)
- [Documentation index](https://www.toppymicros.com/yolozu/docs/llms.txt)

Markdown: https://www.toppymicros.com/ai/projects/yolozu.md

### mAI Economy / Thermo-Credit

Status: Measurement code available. Closed-loop simulator and AI controller planned.

Research on credit creation and AI-assisted window guidance. Thermo-Credit supplies reproducible measurements of Japanese bank-loan borrower composition.

Borrower composition does not identify final credit use. Measurement results do not establish effective lending guidance or real-world policy benefits. The research plan distinguishes available data and code from the proposed simulator.

Canonical page: [mAI Economy / Thermo-Credit](https://www.toppymicros.com/Economy_AI_ERA.html)

Primary sources:

- [Research and evaluation plan](https://github.com/ToppyMicroServices/2025_11_Thermo_Credit/blob/main/docs/mai_research_program.md)
- [Measurement code](https://github.com/ToppyMicroServices/2025_11_Thermo_Credit)
- [Thermo-Credit versions (DOI)](https://doi.org/10.5281/zenodo.17563220)

Agent resources:

- [Measurement scope](https://www.toppymicros.com/theory.html)
- [日本語の研究計画](https://www.toppymicros.com/Economy_AI_ERA_ja.html)

Markdown: https://www.toppymicros.com/ai/projects/mai-economy.md

## Public resources

### Ransomware Observatory

Status: Public observation service; Japanese-language records.

Structured observations of ransomware-site listings involving Japan-linked organizations, with source references and observation history.

A listing is a claim, not confirmation of a breach, attribution or data authenticity. The JSON, CSV and feed are published snapshots, not an API for requesting investigations or obtaining leaked data.

Canonical page: [Ransomware Observatory](https://observatory.toppymicros.com/)

Primary sources:

- [Public records](https://observatory.toppymicros.com/records.json)
- [Record schema](https://observatory.toppymicros.com/schema.json)

Agent resources:

- [Observatory machine-readable guide](https://observatory.toppymicros.com/llms.txt)
- [Observation feed](https://observatory.toppymicros.com/feed.xml)

Markdown: https://www.toppymicros.com/ai/projects/observatory.md

### Beads Git Graph

Status: Released VS Code extension: v0.9.2.

A local VS Code workspace for coordinating tasks across AI providers, following dependencies and reviewing results alongside Git history.

Built-in local task management does not require the Beads CLI; existing Beads workspaces use bd. MIT-licensed software derived from Git Graph, with upstream attribution retained. Provider credentials and local tool permissions remain the operator's responsibility.

Canonical page: [Beads Git Graph](https://marketplace.visualstudio.com/items?itemName=ToppyMicroServices.beads-git-graph)

Primary sources:

- [Release v0.9.2](https://github.com/ToppyMicroServices/beads-git-graph/releases/tag/v0.9.2)
- [Source and license](https://github.com/ToppyMicroServices/beads-git-graph)

Agent resources:

- [User guide](https://github.com/ToppyMicroServices/beads-git-graph/blob/main/docs/user-guide.md)

Markdown: https://www.toppymicros.com/ai/projects/beads-git-graph.md

### Identity-data minimization

Status: Synthetic-credential demonstrator with recorded cryptographic tests.

An AnonCreds demonstration that checks entitlement and recorded expiry without disclosing names, addresses or licence numbers, and rejects proofs with weakened conditions.

Uses fictional credentials, verifier-configured issuer keys, stored-policy checks and replay rejection. It does not establish a person's identity or current licence status and is not a production identity service.

Canonical page: [Identity-data minimization](https://www.toppymicros.com/zk-license-demo-en.html)

Primary sources:

- [Source](https://github.com/ToppyMicroServices/zk-license-demo)
- [Validation and reproduction](https://github.com/ToppyMicroServices/zk-license-demo/blob/main/docs/validation.md)

Agent resources:

- [日本語の技術説明](https://www.toppymicros.com/zk-license-demo.html)

Markdown: https://www.toppymicros.com/ai/projects/identity-data-minimization.md

### High-confidence errors in language models

Status: Public preprint; related work accepted as an EIML 2026 workshop poster.

Research on stable high-confidence errors in language models and why local robustness need not imply correctness.

The workshop lists Stable Miscalibration in Large Language Models: A Practical View of High-Confidence Errors. The related preprint is titled False Fixed Points: Kantian Feedback, Stable Miscalibration, and Representational Compression in LLMs. Workshop acceptance is not ICML main-conference acceptance or evidence of attendance; the listing does not identify a paper version.

Canonical page: [High-confidence errors in language models](https://sites.google.com/view/eimlicml2026/accepted-papers_1)

Primary sources:

- [Official workshop listing](https://sites.google.com/view/eimlicml2026/accepted-papers_1)
- [Related preprint](https://arxiv.org/abs/2510.14925)

Markdown: https://www.toppymicros.com/ai/projects/model-reliability.md

## Further reading

- [Technical updates](https://www.toppymicros.com/news.html): Owner-approved releases and research announcements with primary sources.
- [RFC learning guide](https://www.toppymicros.com/education/rfc_quizzes.html): English protocol-design learning paths and quizzes; not certification exams.
- [RFC学習ガイド](https://www.toppymicros.com/education/rfc_quizzes_ja.html): 日本語のプロトコル設計教材とクイズ。
- [DMARC4all](https://dmarc4all.toppymicros.com/): Public email-configuration diagnostic tool; DNS results do not prove real-message authentication.

## Policies

- [Contact](https://www.toppymicros.com/contact.html): Project support and inquiry routes.
- [Security policy](https://www.toppymicros.com/security-policy.html): Current reporting routes, scope and disclosure terms.
- [Privacy policy](https://www.toppymicros.com/privacy-policy.html): Current data-handling policy; this summary does not replace it.
- [Terms and legal notice](https://www.toppymicros.com/terms-legal-notice.html): Company identity and site terms.

For current releases, exact implementation details and policy terms, use the linked primary sources.
