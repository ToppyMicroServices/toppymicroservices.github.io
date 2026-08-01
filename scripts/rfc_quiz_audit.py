#!/usr/bin/env python3
"""Audit quiz structure, known boilerplate, and bilingual parity.

This is a deterministic lint, not a semantic review of RFC correctness.
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


RFC_FILE_RE = re.compile(r"quiz_rfc(?P<rfc>\d+)(?P<ja>_ja)?\.html$")
PROGRESS_VERSION_RE = re.compile(
    r'["\']?PROGRESS_VERSION["\']?\s*:\s*(?P<version>\d+)'
)
ARTICLE_RE = re.compile(
    r'<article\b(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</article>', re.IGNORECASE
)
CHOICE_RE = re.compile(
    r'<label\b[^>]*class="[^"]*\bchoice\b[^"]*"[^>]*>\s*'
    r'<input\b(?=[^>]*\bvalue="(?P<value>[a-z])")[^>]*>', re.IGNORECASE
)
CHOICE_TEXT_RE = re.compile(
    r'<label\b[^>]*class="[^"]*\bchoice\b[^"]*"[^>]*>\s*'
    r'<input\b(?=[^>]*\bvalue="(?P<value>[a-z])")[^>]*>'
    r'(?P<text>[\s\S]*?)</label>',
    re.IGNORECASE,
)
ALLOWED_LEVELS = {"L1", "L2", "L3", "L4"}
ALLOWED_TYPES = {"mc", "ms", "text"}
FORMULAIC_STEMS = (
    "A design review cites RFC",
    "設計reviewでRFC",
    "Which implementation behavior creates the clearest interoperability risk",
    "Which relationship to nearby specifications is the most accurate",
)
LEGACY_TEMPLATE_PHRASES = (
    "Does RFC 5056 make channel binding sufficient for A2A authorization?",
    "だけでA2A authorizationまで確定できるか",
    "Observed production behavior:",
    "productionで観測した動作:",
    "Correct the observed defect using the profile construction and RFC-specific check",
    "profile constructionとRFC固有のcheckで観測した欠陥を直し",
    "The relationship identifies the layers.",
    "記載された関係はlayerを識別する.",
    "Judgment point:",
    "判定ポイント:",
    "Related keywords:",
    "関連キーワード:",
)
LEGACY_META_HEADING_RE = re.compile(
    r"\*\*(?:"
    r"Why (?:it|this) matters|Terms|Related|Options|Real-world usage|"
    r"Correct(?:\s*\([^)]*\))?|Why others are wrong|"
    r"判断のポイント|用語|関連|選択肢|実務での機会|各選択肢|"
    r"正解(?:\s*\([^)]*\))?"
    r")\s*:\*\*",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Question:
    qid: str
    qtype: str
    answers: tuple[str, ...]
    difficulty: str
    choices: tuple[str, ...]
    stem: str
    has_premise: bool
    has_section_reference: bool


def attr(attrs: str, name: str) -> str:
    match = re.search(rf'\b{re.escape(name)}="([^"]*)"', attrs, re.IGNORECASE)
    return html.unescape(match.group(1)).strip() if match else ""


def plain(fragment: str) -> str:
    text = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def normalized_stem(stem: str) -> str:
    value = re.sub(r"^Q\d+\s*:\s*", "", stem, flags=re.IGNORECASE)
    value = re.sub(r"RFC\s*\d+", "RFC", value, flags=re.IGNORECASE)
    return re.sub(
        r"[^0-9A-Za-z\u3040-\u30ff\u3400-\u9fff]+", "", value
    ).lower()


def parse_questions(path: Path) -> tuple[list[Question], list[str]]:
    text = path.read_text(encoding="utf-8")
    questions: list[Question] = []
    errors: list[str] = []

    for phrase in FORMULAIC_STEMS:
        if phrase in text:
            errors.append(f"legacy formulaic stem remains: {phrase!r}")
    for phrase in LEGACY_TEMPLATE_PHRASES:
        if phrase in text:
            errors.append(f"legacy content template remains: {phrase!r}")
    legacy_headings = sorted(set(LEGACY_META_HEADING_RE.findall(text)))
    if legacy_headings:
        errors.append(
            "legacy explanation meta headings remain: "
            + ", ".join(repr(value) for value in legacy_headings[:4])
        )

    for match in ARTICLE_RE.finditer(text):
        attrs = match.group("attrs")
        body = match.group("body")
        if not re.search(r'class="[^"]*\bq\b', attrs, re.IGNORECASE):
            continue
        heading = re.search(r"<h4\b[^>]*>([\s\S]*?)</h4>", body, re.IGNORECASE)
        answers = tuple(
            sorted(value.strip().lower() for value in attr(attrs, "data-answer").split(",") if value.strip())
        )
        qtype = attr(attrs, "data-type").lower()
        difficulty = attr(attrs, "data-difficulty").upper()
        body_text = plain(body)
        marked_answers: set[str] = set()
        for group in re.findall(
            r"(?:Correct|正解)\s*\(([A-Z](?:\s*,\s*[A-Z])*)\)",
            body_text,
            re.IGNORECASE,
        ):
            marked_answers.update(value.strip().lower() for value in group.split(","))
        marked_answers.update(
            value.lower()
            for value in re.findall(
                r"\b([A-Z])\s*\((?:correct|正解)\)", body_text, re.IGNORECASE
            )
        )
        if marked_answers and tuple(sorted(marked_answers)) != answers:
            label = attr(attrs, "data-id") or "?"
            errors.append(
                f"{label}: data-answer {answers} disagrees with explanation markers "
                f"{tuple(sorted(marked_answers))}"
            )
        choice_lengths = {
            choice.group("value").lower(): len(plain(choice.group("text")))
            for choice in CHOICE_TEXT_RE.finditer(body)
        }
        if qtype == "mc" and len(answers) == 1:
            correct_length = choice_lengths.get(answers[0], 0)
            longest_distractor = max(
                (
                    length
                    for value, length in choice_lengths.items()
                    if value != answers[0]
                ),
                default=0,
            )
            advanced = difficulty in {"L3", "L4"}
            ratio_limit = 1.25 if advanced else 1.35
            delta_limit = 12 if advanced else 15
            if (
                longest_distractor
                and correct_length >= longest_distractor * ratio_limit
                and correct_length - longest_distractor >= delta_limit
            ):
                label = attr(attrs, "data-id") or "?"
                errors.append(
                    f"{label}: correct choice is an answer-length clue "
                    f"({correct_length} vs {longest_distractor} characters)"
                )
        questions.append(
            Question(
                qid=attr(attrs, "data-id"),
                qtype=qtype,
                answers=answers,
                difficulty=difficulty,
                choices=tuple(m.group("value").lower() for m in CHOICE_RE.finditer(body)),
                stem=plain(heading.group(1)) if heading else "",
                has_premise=bool(
                    re.search(r'class="[^"]*\bquestion-premise\b', body, re.IGNORECASE)
                ),
                has_section_reference=bool(
                    re.search(
                        r"(?:RFC\s*\d+\s*)?(?:Sections?|§)\s*\d",
                        plain(body),
                        re.IGNORECASE,
                    )
                ),
            )
        )

    if not questions:
        errors.append("no quiz questions found")
        return questions, errors

    ids = [question.qid for question in questions]
    if len(ids) != len(set(ids)):
        errors.append("duplicate question IDs")
    expected_ids = [f"Q{index}" for index in range(1, len(questions) + 1)]
    if ids != expected_ids:
        errors.append(f"question IDs are not sequential: {ids}")

    for question in questions:
        label = question.qid or "?"
        if question.qtype not in ALLOWED_TYPES:
            errors.append(f"{label}: invalid data-type {question.qtype!r}")
        if question.difficulty not in ALLOWED_LEVELS:
            errors.append(f"{label}: missing or invalid data-difficulty {question.difficulty!r}")
        if not question.stem:
            errors.append(f"{label}: missing question heading")
        if question.qtype == "mc":
            if len(question.choices) < 3:
                errors.append(f"{label}: Multiple Choice needs at least three choices")
            if len(question.answers) != 1:
                errors.append(f"{label}: Multiple Choice needs exactly one answer")
        elif question.qtype == "ms":
            if len(question.choices) < 3:
                errors.append(f"{label}: Multi-Select needs at least three choices")
            if len(question.answers) < 2:
                errors.append(f"{label}: Multi-Select needs at least two answers")
        if question.qtype in {"mc", "ms"} and not set(question.answers) <= set(question.choices):
            errors.append(f"{label}: answer refers to a missing choice")
        if question.difficulty in {"L3", "L4"} and not question.has_premise:
            errors.append(
                f"{label}: {question.difficulty} review question needs an explicit premise"
            )
        if question.difficulty in {"L3", "L4"} and not question.has_section_reference:
            errors.append(
                f"{label}: {question.difficulty} explanation needs an RFC section reference"
            )

    return questions, errors


def parse_progress_version(path: Path) -> int | None:
    match = PROGRESS_VERSION_RE.search(path.read_text(encoding="utf-8"))
    return int(match.group("version")) if match else None


def audit(root: Path) -> tuple[list[str], int, int]:
    pages: dict[tuple[int, bool], tuple[Path, list[Question]]] = {}
    progress_versions: dict[tuple[int, bool], int] = {}
    errors: list[str] = []
    stems: dict[tuple[bool, str], list[tuple[int, Path, str, str]]] = defaultdict(list)

    for path in sorted((root / "education").glob("quiz_rfc*.html")):
        match = RFC_FILE_RE.fullmatch(path.name)
        if not match:
            continue
        key = (int(match.group("rfc")), bool(match.group("ja")))
        questions, page_errors = parse_questions(path)
        pages[key] = (path, questions)
        progress_version = parse_progress_version(path)
        if progress_version is None:
            page_errors.append("missing PROGRESS_VERSION for saved-answer invalidation")
        else:
            progress_versions[key] = progress_version
        errors.extend(f"{path.name}: {message}" for message in page_errors)
        for question in questions:
            stems[(key[1], normalized_stem(question.stem))].append(
                (key[0], path, question.qid, question.stem)
            )

    rfcs = sorted({rfc for rfc, _ in pages})
    for rfc in rfcs:
        en = pages.get((rfc, False))
        ja = pages.get((rfc, True))
        if en is None or ja is None:
            errors.append(f"RFC {rfc}: missing {'English' if en is None else 'Japanese'} page")
            continue
        en_path, en_questions = en
        ja_path, ja_questions = ja
        if progress_versions.get((rfc, False)) != progress_versions.get((rfc, True)):
            errors.append(
                f"RFC {rfc}: EN/JA PROGRESS_VERSION differs "
                f"({progress_versions.get((rfc, False))} vs "
                f"{progress_versions.get((rfc, True))})"
            )
        if len(en_questions) != len(ja_questions):
            errors.append(
                f"RFC {rfc}: EN/JA question counts differ "
                f"({len(en_questions)} vs {len(ja_questions)})"
            )
            continue
        for en_q, ja_q in zip(en_questions, ja_questions):
            en_shape = (
                en_q.qid,
                en_q.qtype,
                en_q.answers,
                en_q.difficulty,
                en_q.choices,
            )
            ja_shape = (
                ja_q.qid,
                ja_q.qtype,
                ja_q.answers,
                ja_q.difficulty,
                ja_q.choices,
            )
            if en_shape != ja_shape:
                errors.append(
                    f"RFC {rfc} {en_q.qid}: EN/JA structure differs "
                    f"({en_path.name} vs {ja_path.name})"
                )

    for (_, normalized), occurrences in stems.items():
        distinct_rfcs = {rfc for rfc, _, _, _ in occurrences}
        if normalized and len(distinct_rfcs) >= 3:
            sample = ", ".join(
                f"{path.name}:{qid}" for _, path, qid, _ in occurrences[:4]
            )
            errors.append(
                f"formulaic stem reused across {len(distinct_rfcs)} RFCs: {sample}"
            )

    question_pairs = sum(
        len(questions) for (rfc, is_ja), (_, questions) in pages.items() if not is_ja
    )
    return errors, len(rfcs), question_pairs


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Repository root (default: inferred from this script)",
    )
    args = parser.parse_args(argv)
    errors, rfc_count, question_pair_count = audit(args.root.resolve())
    if errors:
        for error in errors:
            print(f"[FAIL] {error}")
        print(
            f"RFC quiz audit failed: {len(errors)} issue(s), "
            f"{rfc_count} RFCs, {question_pair_count} EN/JA question pairs."
        )
        return 1
    print(
        f"RFC quiz structural audit passed: {rfc_count} RFCs, "
        f"{question_pair_count} EN/JA question pairs, parity confirmed. "
        "Semantic RFC correctness requires separate review."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
