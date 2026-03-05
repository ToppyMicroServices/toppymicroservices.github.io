#!/usr/bin/env python3
"""Quiz authoring policy checker.

This is a static checker for quiz HTML pages.
It does NOT execute the runtime template JS, so it focuses on what is authored in HTML.

Exit code:
  0: no failures
  1: failures found

Examples:
  python3 scripts/quiz_policy_check.py
  python3 scripts/quiz_policy_check.py --format markdown > quiz_policy_report.md
  python3 scripts/quiz_policy_check.py --paths education/quiz_rfc9110_ja.html --strict
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence


ARTICLE_RE = re.compile(
    r"<article\b(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</article>", re.IGNORECASE
)
EXPLAIN_RE = re.compile(
    r"<div\b[^>]*class=\"[^\"]*\bexplain\b[^\"]*\"[^>]*>(?P<body>[\s\S]*?)</div>",
    re.IGNORECASE,
)
CHOICE_RE = re.compile(
    r"<label\b[^>]*class=\"[^\"]*\bchoice\b[^\"]*\"[^>]*>\s*<input\b[^>]*value=\"(?P<value>[a-z])\"[^>]*>\s*(?P<label>[A-Z])\.",
    re.IGNORECASE,
)
DATA_TYPE_RE = re.compile(r"\bdata-type=\"(?P<t>[^\"]+)\"", re.IGNORECASE)
DATA_ID_RE = re.compile(r"\bdata-id=\"(?P<id>[^\"]+)\"", re.IGNORECASE)


@dataclass(frozen=True)
class CheckResult:
    ok: bool
    code: str
    message: str


@dataclass(frozen=True)
class QuestionReport:
    qid: str
    qtype: str
    results: tuple[CheckResult, ...]

    @property
    def failures(self) -> tuple[CheckResult, ...]:
        return tuple(r for r in self.results if not r.ok and r.code.startswith("FAIL_"))

    @property
    def warnings(self) -> tuple[CheckResult, ...]:
        return tuple(r for r in self.results if not r.ok and r.code.startswith("WARN_"))


@dataclass(frozen=True)
class FileReport:
    path: Path
    is_quiz: bool
    is_ja: bool
    questions: tuple[QuestionReport, ...]
    file_results: tuple[CheckResult, ...]

    @property
    def failures(self) -> tuple[CheckResult, ...]:
        out: list[CheckResult] = []
        out.extend([r for r in self.file_results if not r.ok and r.code.startswith("FAIL_")])
        for q in self.questions:
            out.extend(q.failures)
        return tuple(out)

    @property
    def warnings(self) -> tuple[CheckResult, ...]:
        out: list[CheckResult] = []
        out.extend([r for r in self.file_results if not r.ok and r.code.startswith("WARN_")])
        for q in self.questions:
            out.extend(q.warnings)
        return tuple(out)


def _strip_tags_preserve_breaks(fragment_html: str) -> str:
    s = str(fragment_html or "")
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"</p\s*>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"</li\s*>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"<li\b[^>]*>", "- ", s, flags=re.IGNORECASE)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = s.replace("\r\n", "\n")
    s = re.sub(r"\n{3,}", "\n\n", s)
    s = re.sub(r"[ \t]{2,}", " ", s)
    return s.strip()


def _is_quiz_html(text: str) -> bool:
    return 'id="questions"' in text and re.search(r"class=\"[^\"]*\bq\b", text) is not None


def _is_ja_file(path: Path, text: str) -> bool:
    if path.name.endswith("_ja.html"):
        return True
    m = re.search(r"<html\b[^>]*\blang=\"([^\"]+)\"", text, flags=re.IGNORECASE)
    return bool(m and m.group(1).lower().startswith("ja"))


def _find_question_articles(text: str) -> list[tuple[str, str, str]]:
    out: list[tuple[str, str, str]] = []
    for m in ARTICLE_RE.finditer(text):
        attrs = m.group("attrs") or ""
        body = m.group("body") or ""
        qid = DATA_ID_RE.search(attrs)
        qtype = DATA_TYPE_RE.search(attrs)
        qid_s = qid.group("id") if qid else "?"
        qtype_s = qtype.group("t") if qtype else "?"
        if 'class="q ' not in attrs and 'class="q' not in attrs:
            continue
        out.append((qid_s, qtype_s, body))
    return out


def _check_explain_block(explain_html: str, *, is_ja: bool, qtype: str, choice_letters: Sequence[str]) -> list[CheckResult]:
    results: list[CheckResult] = []

    if not explain_html.strip():
        results.append(CheckResult(False, "FAIL_EXPLAIN_EMPTY", "Explanation block is empty"))
        return results

    explain_text = _strip_tags_preserve_breaks(explain_html)

    # Length / not one-liner
    if len(explain_text) < 120 or "\n" not in explain_text:
        results.append(
            CheckResult(
                False,
                "FAIL_EXPLAIN_TOO_SHORT",
                "Explanation looks too short (should not be a one-liner and should be readable)",
            )
        )

    # Context
    if not re.search(r"問題を出した背景|Context\s*\(why chosen\)|why\s+this\s+question", explain_text, flags=re.IGNORECASE):
        results.append(CheckResult(False, "FAIL_NO_CONTEXT", "Missing context / why-chosen section"))

    # Terms / glossary
    if not re.search(r"\b(用語|Terms)\b", explain_text, flags=re.IGNORECASE):
        results.append(CheckResult(False, "FAIL_NO_TERMS", "Missing Terms/用語 section"))

    # Related / topics
    if not re.search(r"\b(関連|Related|Topic|Topics)\b", explain_text, flags=re.IGNORECASE):
        results.append(CheckResult(False, "FAIL_NO_RELATED", "Missing Related/関連/Topic section"))

    # Bold keywords
    if "<strong>" not in explain_html and "**" not in explain_html:
        results.append(CheckResult(False, "FAIL_NO_BOLD", "No emphasized keywords (expected **bold** or <strong>)"))

    # Real-world usage hint
    if is_ja:
        if not re.search(r"(現場|実運用|運用|実務|実際|インシデント|障害|レビュー|設計|デプロイ)", explain_text):
            results.append(CheckResult(False, "FAIL_NO_REAL_WORLD", "Missing real-world usage/scenario hint"))
    else:
        if not re.search(r"(in\s+practice|real-?world|production|deploy|operator|incident|review|design)", explain_text, flags=re.IGNORECASE):
            results.append(CheckResult(False, "FAIL_NO_REAL_WORLD", "Missing real-world usage/scenario hint"))

    # Option-by-option
    if qtype.lower() in {"mc", "ms"} and len(choice_letters) >= 2:
        missing: list[str] = []
        for letter in choice_letters:
            # looks for lines like "- A (incorrect):" or "A (correct):" or "A:".
            pat = re.compile(r"(^|\n)\s*(?:[-*]\s*)?" + re.escape(letter) + r"\s*(?:\(|:|\.)", re.IGNORECASE)
            if not pat.search(explain_text):
                missing.append(letter)
        if missing:
            results.append(
                CheckResult(
                    False,
                    "FAIL_NO_OPTION_EXPLAIN",
                    "Missing per-option explanation for: " + ", ".join(missing),
                )
            )

    # JA cultural/naturalness heuristics
    if is_ja:
        if "意味論" in explain_text:
            results.append(
                CheckResult(
                    False,
                    "WARN_JA_SEMANTICS_WORDING",
                    "Found '意味論'. Consider more natural wording like 'セマンティクス(意味/ルール)' or simply '意味'.",
                )
            )
        if "。" in explain_text or "、" in explain_text:
            results.append(
                CheckResult(
                    False,
                    "WARN_JA_PUNCTUATION",
                    "Found Japanese punctuation (。/、). Project policy prefers '.' and ','.",
                )
            )

    return results


def _check_file_level(text: str, *, is_ja: bool) -> list[CheckResult]:
    results: list[CheckResult] = []
    if is_ja and ("。" in text or "、" in text):
        results.append(
            CheckResult(
                False,
                "WARN_JA_PUNCTUATION_FILE",
                "File contains Japanese punctuation (。/、). Policy prefers '.' and ','.",
            )
        )
    if is_ja and "意味論" in text:
        results.append(
            CheckResult(
                False,
                "WARN_JA_SEMANTICS_WORDING_FILE",
                "File contains '意味論'. Consider 'セマンティクス(意味/ルール)' or '意味'.",
            )
        )
    return results


def check_file(path: Path) -> FileReport:
    text = path.read_text(encoding="utf-8")
    is_quiz = _is_quiz_html(text)
    is_ja = _is_ja_file(path, text)
    file_results = _check_file_level(text, is_ja=is_ja)
    if not is_quiz:
        return FileReport(path=path, is_quiz=False, is_ja=is_ja, questions=tuple(), file_results=tuple(file_results))

    questions: list[QuestionReport] = []
    for qid, qtype, body in _find_question_articles(text):
        explain_m = EXPLAIN_RE.search(body)
        if not explain_m:
            questions.append(
                QuestionReport(
                    qid=qid,
                    qtype=qtype,
                    results=(CheckResult(False, "FAIL_NO_EXPLAIN", "Missing .explain block"),),
                )
            )
            continue

        explain_html = explain_m.group("body") or ""
        choice_letters = [m.group("label").upper() for m in CHOICE_RE.finditer(body)]
        results = _check_explain_block(
            explain_html,
            is_ja=is_ja,
            qtype=qtype,
            choice_letters=choice_letters,
        )
        questions.append(QuestionReport(qid=qid, qtype=qtype, results=tuple(results)))

    return FileReport(path=path, is_quiz=True, is_ja=is_ja, questions=tuple(questions), file_results=tuple(file_results))


def iter_default_paths(repo_root: Path) -> Iterable[Path]:
    education = repo_root / "education"
    # Focus on quiz-like pages. Hubs and templates are excluded.
    globs = [
        "quiz_*.html",
        "**/quiz_*.html",
    ]
    seen: set[Path] = set()
    for g in globs:
        for p in education.glob(g):
            if p.name in {"quiz_template_skeleton.html"}:
                continue
            if p in seen:
                continue
            seen.add(p)
            yield p


def render_text(reports: Sequence[FileReport], *, strict: bool) -> tuple[str, int]:
    lines: list[str] = []
    fail_count = 0

    def _file_failure_codes(fr: FileReport) -> list[str]:
        codes: set[str] = set()
        for r in fr.failures:
            codes.add(r.code)
        for q in fr.questions:
            for r in q.failures:
                codes.add(r.code)
        return sorted(codes)

    def _file_warning_codes(fr: FileReport) -> list[str]:
        codes: set[str] = set()
        for r in fr.warnings:
            codes.add(r.code)
        for q in fr.questions:
            for r in q.warnings:
                codes.add(r.code)
        return sorted(codes)

    for fr in reports:
        if not fr.is_quiz:
            continue
        failures = fr.failures
        warnings = fr.warnings
        status = "PASS" if not failures and (strict is False or not warnings) else "FAIL" if failures else "WARN"
        fail_codes = _file_failure_codes(fr)
        warn_codes = _file_warning_codes(fr)
        suffix = ""
        if fail_codes:
            suffix += " | fail: " + ", ".join(fail_codes[:6]) + (" ..." if len(fail_codes) > 6 else "")
        if warn_codes and (not strict):
            suffix += " | warn: " + ", ".join(warn_codes[:6]) + (" ..." if len(warn_codes) > 6 else "")
        lines.append(f"[{status}] {fr.path.as_posix()}{suffix}")

        # Text output is intentionally file-level. Use --format markdown for a checklist.

        if failures or (strict and warnings):
            fail_count += 1

    summary = f"Checked {sum(1 for r in reports if r.is_quiz)} quiz files. "
    summary += f"Files with failures: {sum(1 for r in reports if r.is_quiz and r.failures)}. "
    summary += f"Files with warnings: {sum(1 for r in reports if r.is_quiz and r.warnings)}."
    lines.append(summary)

    exit_code = 1 if any(r.failures for r in reports if r.is_quiz) else 0
    if strict and any(r.warnings for r in reports if r.is_quiz):
        exit_code = 1

    return "\n".join(lines) + "\n", exit_code


def render_markdown(reports: Sequence[FileReport], *, strict: bool) -> tuple[str, int]:
    lines: list[str] = []

    lines.append("# Quiz policy check report")
    lines.append("")
    lines.append("This is a static check against the quiz authoring policy.")
    lines.append("It does not execute runtime JS, so it checks what is authored in HTML.")
    lines.append("")

    def _summarize(fr: FileReport) -> str:
        fail_codes = sorted({r.code for r in fr.failures})
        warn_codes = sorted({r.code for r in fr.warnings})
        parts: list[str] = []
        if fail_codes:
            parts.append("fail: " + ", ".join(fail_codes[:6]) + (" ..." if len(fail_codes) > 6 else ""))
        if warn_codes and (not strict):
            parts.append("warn: " + ", ".join(warn_codes[:6]) + (" ..." if len(warn_codes) > 6 else ""))
        return (" (" + "; ".join(parts) + ")") if parts else ""

    for fr in reports:
        if not fr.is_quiz:
            continue
        failures = fr.failures
        warnings = fr.warnings
        ok = not failures and (not strict or not warnings)
        box = "[x]" if ok else "[ ]"
        lines.append(f"- {box} {fr.path.as_posix()}{_summarize(fr)}")

    exit_code = 1 if any(r.failures for r in reports if r.is_quiz) else 0
    if strict and any(r.warnings for r in reports if r.is_quiz):
        exit_code = 1

    return "\n".join(lines) + "\n", exit_code


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--paths",
        nargs="*",
        default=None,
        help="Optional list of files/dirs to check. Default: education quiz html files.",
    )
    parser.add_argument(
        "--format",
        choices=["text", "markdown"],
        default="text",
        help="Output format.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as failures.",
    )

    args = parser.parse_args(argv)

    repo_root = Path(__file__).resolve().parents[1]

    paths: list[Path] = []
    if args.paths:
        for raw in args.paths:
            p = (repo_root / raw).resolve() if not Path(raw).is_absolute() else Path(raw)
            if p.is_dir():
                paths.extend([x for x in p.rglob("*.html")])
            elif p.is_file():
                paths.append(p)
    else:
        paths = list(iter_default_paths(repo_root))

    paths = sorted({p for p in paths if p.suffix.lower() == ".html"})

    reports = [check_file(p) for p in paths]

    if args.format == "markdown":
        out, code = render_markdown(reports, strict=args.strict)
    else:
        out, code = render_text(reports, strict=args.strict)

    sys.stdout.write(out)
    return code


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
