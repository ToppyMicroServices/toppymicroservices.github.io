#!/usr/bin/env python3
"""Quiz authoring policy checker.

The checker evaluates the explanation and optional hint authored in each quiz
HTML file.  It checks for substantive reasoning, not a prescribed
option-by-option template.  Runtime-generated text must not be used to make
incomplete content pass.

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
from collections import Counter
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from statistics import median
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
DATA_HINT_RE = re.compile(r"\bdata-hint=\"(?P<hint>[^\"]*)\"", re.IGNORECASE)
DATA_ANSWER_RE = re.compile(r"\bdata-answer=\"(?P<answer>[^\"]*)\"", re.IGNORECASE)
H4_RE = re.compile(r"<h4\b[^>]*>(?P<text>[\s\S]*?)</h4>", re.IGNORECASE)
CHOICE_CONTENT_RE = re.compile(
    r"<label\b[^>]*class=\"[^\"]*\bchoice\b[^\"]*\"[^>]*>\s*"
    r"<input\b(?=[^>]*\bvalue=\"(?P<value>[a-z])\")[^>]*>\s*"
    r"(?P<text>[\s\S]*?)</label>",
    re.IGNORECASE,
)


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


def _find_question_articles(text: str) -> list[tuple[str, str, str, str, str]]:
    out: list[tuple[str, str, str, str, str]] = []
    for m in ARTICLE_RE.finditer(text):
        attrs = m.group("attrs") or ""
        body = m.group("body") or ""
        qid = DATA_ID_RE.search(attrs)
        qtype = DATA_TYPE_RE.search(attrs)
        hint = DATA_HINT_RE.search(attrs)
        answer = DATA_ANSWER_RE.search(attrs)
        qid_s = qid.group("id") if qid else "?"
        qtype_s = qtype.group("t") if qtype else "?"
        hint_s = html.unescape(hint.group("hint")).strip() if hint else ""
        answer_s = html.unescape(answer.group("answer")).strip() if answer else ""
        if 'class="q ' not in attrs and 'class="q' not in attrs:
            continue
        out.append((qid_s, qtype_s, hint_s, answer_s, body))
    return out


def _check_hint(hint_text: str) -> list[CheckResult]:
    if not hint_text:
        return []

    answer_leak_patterns = (
        r"\b(?:correct|incorrect|right answer|wrong answer)\b",
        r"\b(?:the\s+)?answer\s+(?:is|:)",
        r"\b(?:option|choice)\s+[A-D]\b",
        r"(?:正解|不正解|正答|誤答)",
        r"答え\s*(?:は|:|：)",
        r"選択肢\s*[A-DＡ-Ｄ]",
    )
    if any(re.search(pattern, hint_text, flags=re.IGNORECASE) for pattern in answer_leak_patterns):
        return [
            CheckResult(
                False,
                "FAIL_HINT_REVEALS_ANSWER",
                "Hint names correctness, the answer, or an option label",
            )
        ]
    return []


def _choice_texts(body: str) -> dict[str, str]:
    choices: dict[str, str] = {}
    for match in CHOICE_CONTENT_RE.finditer(body):
        value = match.group("value").lower()
        text = _strip_tags_preserve_breaks(match.group("text"))
        text = re.sub(r"^\s*[A-Z]\s*[.．:：]\s*", "", text, flags=re.IGNORECASE)
        choices[value] = re.sub(r"\s+", " ", text).strip()
    return choices


def _compact_comparison_text(text: str) -> str:
    plain = re.sub(r"^\s*Q\d+\s*:\s*", "", text, flags=re.IGNORECASE)
    return re.sub(
        r"[^0-9A-Za-z\u3040-\u30ff\u3400-\u9fff]+",
        "",
        plain,
    ).lower()


def _check_question_shape(
    *,
    body: str,
    is_ja: bool,
    qtype: str,
    answer_text: str,
    hint_text: str,
) -> list[CheckResult]:
    results: list[CheckResult] = []
    choices = _choice_texts(body)
    answers = {
        value.strip().lower()
        for value in answer_text.split(",")
        if value.strip()
    }

    question_markup = EXPLAIN_RE.sub("", body)
    visible_question_text = _strip_tags_preserve_breaks(question_markup) + "\n" + hint_text
    if is_ja and "意味論" in visible_question_text:
        results.append(
            CheckResult(
                False,
                "WARN_JA_SEMANTICS_WORDING",
                "Question or hint contains '意味論'; prefer a more specific description of the rule or meaning",
            )
        )

    if qtype.lower() == "ms" and len(choices) >= 2 and answers == set(choices):
        results.append(
            CheckResult(
                False,
                "FAIL_MULTI_SELECT_ALL_CORRECT",
                "Every Multi-Select option is correct, so selecting all requires no discrimination",
            )
        )

    compact_hint = _compact_comparison_text(hint_text)
    leaked_options: list[str] = []
    for value in sorted(answers):
        compact_option = _compact_comparison_text(choices.get(value, ""))
        if 4 <= len(compact_option) <= 40 and compact_option in compact_hint:
            leaked_options.append(value.upper())
    if leaked_options:
        results.append(
            CheckResult(
                False,
                "FAIL_HINT_CONTAINS_CORRECT_OPTION",
                "Hint contains the full text of correct option(s): "
                + ", ".join(leaked_options),
            )
        )

    if qtype.lower() != "mc" or len(answers) != 1:
        return results

    correct_value = next(iter(answers))
    correct_text = choices.get(correct_value, "")
    correct_compact = _compact_comparison_text(correct_text)
    heading = H4_RE.search(body)
    stem_text = _strip_tags_preserve_breaks(heading.group("text")) if heading else ""
    stem_compact = _compact_comparison_text(stem_text)

    if len(correct_compact) >= 24 and stem_compact:
        similarity = SequenceMatcher(None, stem_compact, correct_compact).ratio()
        if correct_compact in stem_compact or similarity >= 0.56:
            results.append(
                CheckResult(
                    False,
                    "WARN_CORRECT_OPTION_ECHOES_STEM",
                    "Correct option substantially restates the question stem",
                )
            )

    wrong_lengths = [
        len(_compact_comparison_text(text))
        for value, text in choices.items()
        if value != correct_value
    ]
    if wrong_lengths:
        correct_length = len(correct_compact)
        typical_wrong_length = median(wrong_lengths)
        if (
            correct_length >= typical_wrong_length * 2.1
            and correct_length - typical_wrong_length >= 20
        ):
            results.append(
                CheckResult(
                    False,
                    "WARN_CORRECT_OPTION_LENGTH_CUE",
                    "Correct option is much longer than the typical distractor",
                )
            )

    return results


def _option_reason(explain_text: str, letter: str) -> str | None:
    pattern = re.compile(
        r"(?im)^\s*(?:[-*]\s*)?(?:Option\s+)?"
        + re.escape(letter)
        + r"\s*(?:\([^)\n]+\))?\s*[:：]\s*(?P<reason>[^\n]+)"
    )
    match = pattern.search(explain_text)
    return match.group("reason").strip() if match else None


def _is_generic_option_reason(reason: str) -> bool:
    plain = re.sub(r"[*_`]+", "", reason)
    plain = re.sub(r"\s+", " ", plain).strip()
    compact = re.sub(r"[\s.!?。！？、,]+$", "", plain).lower()

    if len(re.sub(r"[^0-9A-Za-z\u3040-\u30ff\u3400-\u9fff]+", "", plain)) < 8:
        return True

    generic_patterns = (
        r"(?:this|it)?\s*(?:is\s*)?(?:the\s*)?(?:correct|incorrect|right|wrong)(?:\s+(?:answer|choice|option))?",
        r"(?:this\s+)?(?:matches|does not match)\s+(?:the\s+)?(?:definition|requirement|specification)(?:\s*/\s*(?:definition|requirement|specification))*",
        r"(?:this\s+)?(?:describes|refers to)\s+(?:a\s+)?(?:different|another)\s+(?:concept|condition)",
        r"(?:これ|この選択肢)?(?:が|は)?(?:正解|不正解|正しい|誤り|間違い)(?:です|である)?",
        r"(?:定義|要件)(?:\s*/\s*(?:定義|要件))?に合致(?:します|する)?",
        r"別の(?:概念|条件)(?:\s*/\s*(?:概念|条件))?を指して(?:います|いる)?",
    )
    return any(re.fullmatch(pattern, compact, flags=re.IGNORECASE) for pattern in generic_patterns)


def _check_explain_block(explain_html: str, *, is_ja: bool, qtype: str, choice_letters: Sequence[str]) -> list[CheckResult]:
    results: list[CheckResult] = []

    if not explain_html.strip():
        results.append(CheckResult(False, "FAIL_EXPLAIN_EMPTY", "Explanation block is empty"))
        return results

    explain_text = _strip_tags_preserve_breaks(explain_html)

    # Require enough authored reasoning to explain the governing distinction.
    # Source-line wrapping is an authoring detail, so a well-developed paragraph
    # is valid even when it occupies one HTML line.
    if is_ja:
        sentence_endings = len(
            re.findall(
                r"[。！？]|(?<!\d)[.!?](?=$|\s|[A-Za-z\u3040-\u30ff\u3400-\u9fff])",
                explain_text,
            )
        )
    else:
        sentence_endings = len(re.findall(r"[.!?](?:\s|$)", explain_text))
    has_reasoning_shape = sentence_endings >= 2 or "\n" in explain_text
    if len(explain_text) < 100 or not has_reasoning_shape:
        results.append(
            CheckResult(
                False,
                "FAIL_EXPLAIN_TOO_SHORT",
                "Explanation needs a substantive reason and enough context to be independently readable",
            )
        )

    # Option-by-option labels are optional.  When authors use them, reject
    # placeholder statements such as merely saying that an option is wrong.
    if qtype.lower() in {"mc", "ms"} and len(choice_letters) >= 2:
        generic: list[str] = []
        for letter in choice_letters:
            reason = _option_reason(explain_text, letter)
            if reason is not None and _is_generic_option_reason(reason):
                generic.append(letter)
        if generic:
            results.append(
                CheckResult(
                    False,
                    "FAIL_GENERIC_OPTION_EXPLAIN",
                    "Per-option explanation is only a generic correctness statement for: "
                    + ", ".join(generic),
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
    return results


def _check_file_level(text: str, *, is_ja: bool) -> list[CheckResult]:
    # File metadata and comments can follow normal Japanese typography. Wording
    # rules are applied to the authored question, hint, and explanation content.
    return []


def check_file(path: Path) -> FileReport:
    text = path.read_text(encoding="utf-8")
    is_quiz = _is_quiz_html(text)
    is_ja = _is_ja_file(path, text)
    file_results = _check_file_level(text, is_ja=is_ja)
    if not is_quiz:
        return FileReport(path=path, is_quiz=False, is_ja=is_ja, questions=tuple(), file_results=tuple(file_results))

    articles = _find_question_articles(text)
    mc_answers = [
        answer_text.lower()
        for _, qtype, _, answer_text, _ in articles
        if qtype.lower() == "mc" and re.fullmatch(r"[a-z]", answer_text, flags=re.IGNORECASE)
    ]
    if len(mc_answers) >= 6:
        answer_counts = Counter(mc_answers)
        most_common_count = answer_counts.most_common(1)[0][1]
        if most_common_count / len(mc_answers) >= 0.70:
            file_results.append(
                CheckResult(
                    False,
                    "WARN_ANSWER_POSITION_BIAS",
                    "At least 70% of Multiple Choice answers use the same option position",
                )
            )

    questions: list[QuestionReport] = []
    for qid, qtype, hint_text, answer_text, body in articles:
        question_results = _check_hint(hint_text)
        question_results += _check_question_shape(
            body=body,
            is_ja=is_ja,
            qtype=qtype,
            answer_text=answer_text,
            hint_text=hint_text,
        )
        explain_m = EXPLAIN_RE.search(body)
        if not explain_m:
            questions.append(
                QuestionReport(
                    qid=qid,
                    qtype=qtype,
                    results=tuple(question_results)
                    + (CheckResult(False, "FAIL_NO_EXPLAIN", "Missing .explain block"),),
                )
            )
            continue

        explain_html = explain_m.group("body") or ""
        choice_letters = [m.group("label").upper() for m in CHOICE_RE.finditer(body)]
        results = question_results + _check_explain_block(
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
    lines.append("This checks the explanations and optional hints authored in the quiz HTML files.")
    lines.append("Runtime-generated text is not considered.")
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
