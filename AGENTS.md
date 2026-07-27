# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim               # Claim work
bd close <id>         # Complete work
bd vc status          # Inspect pending Dolt issue changes
bd dolt pull          # Pull the shared Dolt issue history
bd dolt push          # Push committed Dolt issue history
```

`bd sync` is not a supported command in Beads 1.1.0. Do not add it to hooks or
automation.

## Hooks

This repository tracks the Beads 1.1.0 thin hooks in `.beads-hooks/`. Install or
refresh them after cloning or upgrading `bd`:

```bash
bd hooks install --shared
```

The hooks delegate to `bd hooks run`; they do not directly call legacy
`bd sync` commands. An ordinary documentation commit must remain possible when
no Beads state changed.

## Beads State and Files to Track

The remote-backed Dolt database is the live issue store. The tracked
`.beads/issues.jsonl` file is an interoperability snapshot, not a full database
backup. Refresh it through the loss guard:

```bash
python3 scripts/export_beads_snapshot.py
```

When working in this repo, commit Beads project files that should be shared across clones:

- `.beads/config.yaml`
- `.beads/metadata.json`
- `.beads/interactions.jsonl` (if present)
- `.beads/.gitignore`
- `.beads/README.md`
- `.gitattributes` (for Beads merge driver)

Do **not** commit machine/runtime artifacts such as `beads.db*`, `bd.sock`, `daemon.*`, `.local_version`, or merge temporary files.

Before a Beads write, run `bd dolt pull`. After the write, inspect
`bd vc status`, create a Dolt commit with `bd dolt commit -m "<summary>"`, and
publish it with `bd dolt push`. Then refresh the tracked snapshot with the
repository helper and commit any append-only interaction records.

If `bd` reports pending migrations on a remote-backed database, stop. Exactly
one designated clone may migrate and push the shared schema; other clones must
adopt the published database with `bd bootstrap`. Do not independently migrate
multiple clones.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt pull
   bd vc status
   bd dolt commit -m "<issue summary>"  # only when issue changes are pending
   bd dolt push                         # only after a Dolt commit
   python3 scripts/export_beads_snapshot.py
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
