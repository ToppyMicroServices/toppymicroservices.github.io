#!/usr/bin/env python3
"""Audit structure and bilingual parity across the RFC quiz corpus."""

from __future__ import annotations

import argparse
import html
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


RFC_FILE_RE = re.compile(r"quiz_rfc(?P<rfc>\d+)(?P<ja>_ja)?\.html$")
ARTICLE_RE = re.compile(
    r'<article\b(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</article>', re.IGNORECASE
)
CHOICE_RE = re.compile(
    r'<label\b[^>]*class="[^"]*\bchoice\b[^"]*"[^>]*>\s*'
    r'<input\b(?=[^>]*\bvalue="(?P<value>[a-z])")[^>]*>', re.IGNORECASE
)
ALLOWED_LEVELS = {"L1", "L2", "L3", "L4"}
ALLOWED_TYPES = {"mc", "ms", "text"}
FORMULAIC_STEMS = (
    "A design review cites RFC",
    "設計reviewでRFC",
    "Which implementation behavior creates the clearest interoperability risk",
    "Which relationship to nearby specifications is the most accurate",
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

    for match in ARTICLE_RE.finditer(text):
        attrs = match.group("attrs")
        body = match.group("body")
        if not re.search(r'class="[^"]*\bq\b', attrs, re.IGNORECASE):
            continue
        heading = re.search(r"<h4\b[^>]*>([\s\S]*?)</h4>", body, re.IGNORECASE)
        answers = tuple(
            sorted(value.strip().lower() for value in attr(attrs, "data-answer").split(",") if value.strip())
        )
        questions.append(
            Question(
                qid=attr(attrs, "data-id"),
                qtype=attr(attrs, "data-type").lower(),
                answers=answers,
                difficulty=attr(attrs, "data-difficulty").upper(),
                choices=tuple(m.group("value").lower() for m in CHOICE_RE.finditer(body)),
                stem=plain(heading.group(1)) if heading else "",
                has_premise=bool(
                    re.search(r'class="[^"]*\bquestion-premise\b', body, re.IGNORECASE)
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
        if question.difficulty == "L4" and not question.has_premise:
            errors.append(f"{label}: L4 composition question needs an explicit premise")

    return questions, errors


def audit(root: Path) -> tuple[list[str], int, int]:
    pages: dict[tuple[int, bool], tuple[Path, list[Question]]] = {}
    errors: list[str] = []
    stems: dict[tuple[bool, str], list[tuple[int, Path, str, str]]] = defaultdict(list)

    for path in sorted((root / "education").glob("quiz_rfc*.html")):
        match = RFC_FILE_RE.fullmatch(path.name)
        if not match:
            continue
        key = (int(match.group("rfc")), bool(match.group("ja")))
        questions, page_errors = parse_questions(path)
        pages[key] = (path, questions)
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
        f"RFC quiz audit passed: {rfc_count} RFCs, "
        f"{question_pair_count} EN/JA question pairs, parity confirmed."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
