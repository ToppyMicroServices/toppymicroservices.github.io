#!/usr/bin/env python3
"""Regression tests for the repository Beads hook and snapshot workflow."""

from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
EXPORTER = ROOT / "scripts" / "export_beads_snapshot.py"
HOOKS = ROOT / ".beads-hooks"


def _write_jsonl(path: Path, records: list[dict[str, object]]) -> None:
    path.write_text(
        "".join(
            json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n"
            for record in records
        ),
        encoding="utf-8",
    )


class BeadsWorkflowTests(unittest.TestCase):
    def test_tracked_hooks_are_current_thin_shims(self) -> None:
        expected = {
            "pre-commit",
            "post-merge",
            "pre-push",
            "post-checkout",
            "prepare-commit-msg",
        }
        self.assertEqual({path.name for path in HOOKS.iterdir()}, expected)
        for hook_name in expected:
            hook = HOOKS / hook_name
            content = hook.read_text(encoding="utf-8")
            self.assertTrue(os.access(hook, os.X_OK), hook_name)
            self.assertIn("BEADS INTEGRATION v1.1.0", content)
            self.assertIn(f"bd hooks run {hook_name}", content)
            self.assertNotIn("bd sync", content)

    def test_ordinary_commit_passes_and_uses_current_hook_surface(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copytree(HOOKS, root / ".beads-hooks")
            fake_bin = root / "bin"
            fake_bin.mkdir()
            log = root / "bd.log"
            fake_bd = fake_bin / "bd"
            fake_bd.write_text(
                "#!/bin/sh\n"
                "printf '%s\\n' \"$*\" >> \"$FAKE_BD_LOG\"\n"
                "exit \"${FAKE_BD_EXIT:-0}\"\n",
                encoding="utf-8",
            )
            fake_bd.chmod(fake_bd.stat().st_mode | stat.S_IXUSR)
            subprocess.run(["git", "init", "-q"], cwd=root, check=True)
            subprocess.run(
                ["git", "config", "core.hooksPath", ".beads-hooks"],
                cwd=root,
                check=True,
            )
            subprocess.run(
                ["git", "config", "user.name", "Hook Test"],
                cwd=root,
                check=True,
            )
            subprocess.run(
                ["git", "config", "user.email", "hook-test@example.invalid"],
                cwd=root,
                check=True,
            )
            (root / "README.md").write_text("documentation only\n", encoding="utf-8")
            subprocess.run(["git", "add", "README.md"], cwd=root, check=True)
            env = {
                **os.environ,
                "PATH": f"{fake_bin}{os.pathsep}{os.environ.get('PATH', '')}",
                "FAKE_BD_LOG": str(log),
                "FAKE_BD_EXIT": "3",
            }
            subprocess.run(
                ["git", "commit", "-q", "-m", "docs: hook smoke"],
                cwd=root,
                env=env,
                check=True,
            )
            calls = log.read_text(encoding="utf-8")
            self.assertIn("hooks run pre-commit", calls)
            self.assertIn("hooks run prepare-commit-msg", calls)
            self.assertNotIn("sync", calls)

    def test_snapshot_export_preserves_ids_dependencies_comments_and_interactions(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            output = root / "issues.jsonl"
            interactions = root / "interactions.jsonl"
            interactions.write_text('{"id":"int-1"}\n', encoding="utf-8")
            baseline = [
                {
                    "id": "site-a",
                    "title": "A",
                    "dependencies": [
                        {"depends_on_id": "site-root", "type": "blocks"}
                    ],
                    "comments": [{"id": 1, "author": "dev", "text": "keep"}],
                }
            ]
            candidate = [
                {
                    "id": "site-a",
                    "title": "A updated",
                    "dependencies": [
                        {"depends_on_id": "site-root", "type": "blocks"}
                    ],
                    "comments": [{"id": 1, "author": "dev", "text": "keep"}],
                },
                {"id": "site-b", "title": "B"},
            ]
            candidate_path = root / "candidate.jsonl"
            _write_jsonl(output, baseline)
            _write_jsonl(candidate_path, candidate)
            subprocess.run(
                [
                    sys.executable,
                    str(EXPORTER),
                    "--output",
                    str(output),
                    "--candidate",
                    str(candidate_path),
                ],
                cwd=ROOT,
                check=True,
            )
            records = [
                json.loads(line)
                for line in output.read_text(encoding="utf-8").splitlines()
            ]
            self.assertEqual([record["id"] for record in records], ["site-a", "site-b"])
            self.assertEqual(
                interactions.read_text(encoding="utf-8"),
                '{"id":"int-1"}\n',
            )

    def test_snapshot_export_refuses_record_loss_without_changing_baseline(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            output = root / "issues.jsonl"
            candidate_path = root / "candidate.jsonl"
            baseline = [
                {
                    "id": "site-a",
                    "dependencies": [
                        {"depends_on_id": "site-root", "type": "blocks"}
                    ],
                    "comments": [{"id": 1, "author": "dev", "text": "keep"}],
                }
            ]
            _write_jsonl(output, baseline)
            original = output.read_bytes()
            for candidate in (
                [],
                [
                    {
                        "id": "site-a",
                        "dependencies": [],
                        "comments": baseline[0]["comments"],
                    }
                ],
                [
                    {
                        "id": "site-a",
                        "dependencies": baseline[0]["dependencies"],
                        "comments": [],
                    }
                ],
            ):
                _write_jsonl(candidate_path, candidate)
                proc = subprocess.run(
                    [
                        sys.executable,
                        str(EXPORTER),
                        "--output",
                        str(output),
                        "--candidate",
                        str(candidate_path),
                    ],
                    cwd=ROOT,
                    text=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=False,
                )
                self.assertNotEqual(proc.returncode, 0)
                self.assertEqual(output.read_bytes(), original)

    def test_tracked_guidance_has_no_legacy_sync_command(self) -> None:
        for relative in ("AGENTS.md", ".beads/README.md", ".beads/config.yaml"):
            content = (ROOT / relative).read_text(encoding="utf-8")
            self.assertNotIn("bd sync", content.replace("`bd sync`", ""))


if __name__ == "__main__":
    unittest.main()
