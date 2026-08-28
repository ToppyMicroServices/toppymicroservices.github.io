#!/usr/bin/env python3
"""Export a Beads issue snapshot without silently dropping existing records."""

from __future__ import annotations

import argparse
from collections import Counter
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from typing import Any


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Export regular Beads issues to a guarded JSONL interoperability "
            "snapshot. Existing issue IDs, dependencies, and comments may not "
            "disappear silently."
        )
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(".beads/issues.jsonl"),
        help="Snapshot to replace atomically (default: .beads/issues.jsonl).",
    )
    parser.add_argument(
        "--candidate",
        type=Path,
        help="Validate this JSONL instead of invoking 'bd export' (test/recovery use).",
    )
    return parser


def _load(
    path: Path,
    *,
    label: str,
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    records: list[dict[str, Any]] = []
    by_id: dict[str, dict[str, Any]] = {}
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise SystemExit(f"{label} cannot be read: {path}: {exc}") from exc
    for line_number, line in enumerate(lines, start=1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            raise SystemExit(
                f"{label} contains invalid JSON at {path}:{line_number}: {exc}"
            ) from exc
        if not isinstance(record, dict):
            raise SystemExit(f"{label} record at {path}:{line_number} is not an object")
        issue_id = record.get("id")
        if not isinstance(issue_id, str) or not issue_id:
            raise SystemExit(f"{label} record at {path}:{line_number} has no string id")
        if issue_id in by_id:
            raise SystemExit(f"{label} contains duplicate issue id: {issue_id}")
        records.append(record)
        by_id[issue_id] = record
    return records, by_id


def _dependency_keys(record: dict[str, Any]) -> set[tuple[str, str]]:
    keys: set[tuple[str, str]] = set()
    for dependency in record.get("dependencies") or []:
        if not isinstance(dependency, dict):
            continue
        target = dependency.get("depends_on_id")
        relation = dependency.get("type")
        if isinstance(target, str) and isinstance(relation, str):
            keys.add((target, relation))
    return keys


def _comment_keys(record: dict[str, Any]) -> Counter[tuple[str, str, str]]:
    keys: Counter[tuple[str, str, str]] = Counter()
    for comment in record.get("comments") or []:
        if not isinstance(comment, dict):
            continue
        author = str(comment.get("author", ""))
        text = str(comment.get("text", ""))
        created_at = str(comment.get("created_at", ""))
        # Schema migrations may re-key a comment ID while preserving the
        # comment itself. Count the stable semantic fields so a one-for-one
        # re-key passes, but content, timestamp, or multiplicity loss fails.
        keys[(author, text, created_at)] += 1
    return keys


def _assert_lossless(
    baseline: dict[str, dict[str, Any]],
    candidate: dict[str, dict[str, Any]],
) -> None:
    missing_ids = sorted(set(baseline) - set(candidate))
    if missing_ids:
        raise SystemExit(
            "refusing snapshot export: candidate is missing existing issue IDs: "
            + ", ".join(missing_ids)
        )
    losses: list[str] = []
    for issue_id, previous in baseline.items():
        current = candidate[issue_id]
        missing_dependencies = _dependency_keys(previous) - _dependency_keys(current)
        missing_comments = _comment_keys(previous) - _comment_keys(current)
        if missing_dependencies:
            losses.append(f"{issue_id}: dependencies {sorted(missing_dependencies)!r}")
        if missing_comments:
            losses.append(f"{issue_id}: comments {sorted(missing_comments.items())!r}")
    if losses:
        raise SystemExit(
            "refusing snapshot export: candidate drops existing nested records:\n"
            + "\n".join(losses)
        )


def _export_candidate(output: Path) -> Path:
    output.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(
        prefix=f".{output.name}.candidate.",
        dir=output.parent,
        text=True,
    )
    os.close(descriptor)
    candidate = Path(temporary)
    try:
        subprocess.run(
            ["bd", "export", "--output", str(candidate)],
            check=True,
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        candidate.unlink(missing_ok=True)
        raise SystemExit(f"bd export failed; snapshot was not changed: {exc}") from exc
    return candidate


def _atomic_replace(output: Path, records: list[dict[str, Any]]) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(
        prefix=f".{output.name}.merged.",
        dir=output.parent,
        text=True,
    )
    replacement = Path(temporary)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            for record in records:
                stream.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")))
                stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        if output.exists():
            os.chmod(replacement, output.stat().st_mode)
        os.replace(replacement, output)
    finally:
        replacement.unlink(missing_ok=True)


def main() -> int:
    args = _parser().parse_args()
    output = args.output.resolve()
    baseline_by_id: dict[str, dict[str, Any]] = {}
    if output.exists():
        _, baseline_by_id = _load(output, label="baseline snapshot")

    generated = args.candidate is None
    candidate_path = _export_candidate(output) if generated else args.candidate.resolve()
    try:
        records, candidate_by_id = _load(candidate_path, label="candidate snapshot")
        _assert_lossless(baseline_by_id, candidate_by_id)
        _atomic_replace(output, records)
    finally:
        if generated:
            candidate_path.unlink(missing_ok=True)

    print(f"wrote {len(records)} issues to {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
