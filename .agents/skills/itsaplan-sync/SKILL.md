---
name: itsaplan-sync
description: "Sync the Dustzm/itsaplan fork with croffasia/itsaplan: mirror upstream main, then integrate updates into custom through a temporary branch and reviewed PR. Use for this project's Git requests such as 同步下, 同步官方更新, or explicit $itsaplan-sync. Excludes application data sync and deployment. Analysis-only requests remain read-only."
---

# Itsaplan Sync

Keep official behavior as the baseline and preserve personal features with the smallest necessary adaptations. A clean Git merge is only the first compatibility check.

## Scope and invocation

- Repository: `github.com/Dustzm/itsaplan`; upstream: `github.com/croffasia/itsaplan`.
- Fork `main` and local `main` mirror upstream `main`. Personal development belongs on `custom`.
- A request to execute this configured sync workflow authorizes its scoped commits, pushes, PR creation, and compatible PR merge. Loading the skill, asking for analysis, or asking to create the skill does not authorize a sync. Respect narrower requests such as preparing a PR without merging.
- Keep this skill on `custom`. A checkout containing only official `main` may not contain it. Natural-language selection depends on skill discovery; explicit invocation is `$itsaplan-sync`.
- Sync does not deploy, migrate a live database, change repository settings or branch protections, sign agreements, or modify upstream. Deployment must separately use code or images built from `custom` to include personal features.

## 1. Inspect and synchronize main

Read the applicable repository instructions. Verify the repository, remote URLs, GitHub CLI authentication, fork parent, current branches, dirty files, and other worktrees. Inspect existing sync PRs and current branch rules before making changes. Use explicit repository and branch arguments for GitHub operations; do not rely on the current default branch or an assumed `upstream` remote.

Fetch the fork and official `main`, recording their full commit IDs and `origin/custom`. Fetch official `main` into a temporary remote-tracking ref if no upstream remote exists. Use ancestry checks to distinguish a fast-forward from divergence before updating anything.

When fork `main` is an ancestor of official `main`, synchronize it with:

```bash
gh repo sync Dustzm/itsaplan --source croffasia/itsaplan --branch main
git fetch origin
```

Verify the resulting commit against upstream; upstream may advance during the operation. Update local `main` only by fast-forward. If it is checked out, update through that clean worktree; otherwise advance its ref with an expected-old-commit check. Leave unrelated work untouched. A unique local or remote `main` commit, upstream history rewrite, or identity mismatch requires reporting the evidence and waiting for a decision. Never use force sync, force push, or a destructive reset to make the branches match.

Use a separate worktree for integration when the user's checkout has unrelated work. Do not stash, discard, or include that work in the sync. Reuse a matching existing sync PR and its branch after checking ownership and content; do not overwrite another person's branch or create duplicate PRs.

If the selected official commit is already an ancestor of `origin/custom`, reconcile any existing sync PR and report that no integration is needed. Main synchronization may still have been necessary.

## 2. Review and integrate into custom

Compare incoming commits and the current custom delta relative to their merge base. Read both commit messages and actual code changes, including relevant callers, tests, permissions, API contracts, dependencies, and migrations. Derive personal features from current history and code; do not rely on a fixed list of MCP tools or changed files.

Create a uniquely named `codex/sync-upstream-*` branch from the latest `origin/custom` in the integration worktree. Merge the selected official commit there, preserving ancestry. All conflict resolution and custom adaptation commits belong on this temporary branch. The PR head is this branch and its base is `custom`; never write conflict resolutions back to `main`.

Apply these decisions even when Git reports no textual conflict:

| Finding | Action |
| --- | --- |
| No textual or identified semantic conflict | Validate, create or update the PR, and merge when checks pass. |
| Overlapping code with compatible behavior | Follow official interfaces and behavior; adapt the personal extension with a minimal change. Preserve intended personal functionality, then validate and merge. |
| Official and custom independently implement the same feature or fix the same bug | Present the commits, affected code, behavior differences, and options. Wait for the user to choose reuse, adaptation, or removal; do not silently delete either implementation. |
| Incompatible functionality, permission rules, API contracts, or migration/data behavior | Prepare the safe portion and a concrete decision report. Keep a draft PR or temporary branch pending the user's decision. |
| Regression caused by this integration | Fix it within the sync's scope and rerun affected validation. Escalate an unresolved or out-of-scope problem with evidence. |

A commit already present in ancestry is normal synchronization history, not an independently duplicated fix. Do not resolve conflicts with blanket `ours`, `theirs`, or whole-file replacement: official-first adaptation still needs to preserve personal behavior. Never commit conflict markers or an unresolved merge as a finished integration.

For a required decision, show concrete commits/files, user-visible consequences, and a recommended option with its tradeoff. Complete independent safe preparation first; do not merge dependent changes while waiting. A confirmed high-risk bug or an unexplained check failure also prevents automatic merge. Verify whether a reported issue is introduced by the integration or inherited from upstream, and report material inherited issues without silently broadening the patch to repair them.

## 3. Validate and prepare the PR

Before pushing changed code, apply the repository's [tidy](../tidy/SKILL.md) skill, followed by [code-review](../code-review/SKILL.md), to the final changes. Run focused checks for affected official and personal behavior. Follow the current repository's CI gate for formatting, lint, type checking, builds, and tests; passing compilation alone does not establish compatibility.

Use Bun and the repository's test setup. Integration tests need an isolated test database; use a distinct Docker Compose project when needed. Do not use production data or run the interactive setup command for synchronization. Diagnose environment failures before bounded retries, and do not alter unrelated official code merely to satisfy a broken local environment. Successful CI can supply the full validation gate without duplicating the same full suite locally; report local limits separately.

Commit only sync-related files and push the temporary branch normally. Create or update the PR with explicit `--repo Dustzm/itsaplan`, `--base custom`, and the verified head branch. Use a Conventional Commit title. For CLI bodies, use a file via `--body-file` with actual newlines. Describe:

- The selected upstream commit and incoming behavior changes.
- Personal features retained, adaptations made, and any decisions still needed.
- Validation results, material limitations, and review findings.

Read CI results and review feedback for the final pushed commit. Required checks and code validation must pass before merging; do not bypass protection rules. This fork's inherited CLA check may be documented as an exception only when it is still non-required and is solely asking for an upstream contributor agreement. Do not sign it, edit workflows to suppress it, use administrator bypass, or treat other failures as covered by that exception.

## 4. Merge and verify

Immediately before merging, refresh upstream, fork `main`, `custom`, and the PR head. If any relevant commit changed since review, reconcile the new state and repeat affected review and checks. Confirm there are no pending semantic decisions and that the checks apply to the commit being merged.

Merge using a merge commit, preserving the official and custom histories:

```bash
gh pr merge PR_NUMBER --repo Dustzm/itsaplan --merge --match-head-commit VERIFIED_HEAD_SHA
```

Replace placeholders with verified values. Do not squash or rebase this sync PR. If repository settings prevent a merge commit, report the blocker rather than changing settings or selecting a different merge method. Do not report success merely because a PR has been queued for merging; verify its merged state and resulting commit.

Fetch again and verify that the merged `custom` contains both the pre-sync custom commit and the selected official commit, and that the final custom delta matches the reviewed result. Confirm fork and local `main` match the selected upstream state, reporting any later upstream advancement. Fast-forward local `custom` only when its worktree and ancestry permit it; otherwise preserve local work and report that local alignment remains pending.

Remove only this run's temporary branches, worktree, and test resources after confirming they are no longer needed and their commits are included. Preserve branches and evidence for unfinished work. Never force-push or delete `main` or `custom`.

Finish with the upstream/main/custom commit IDs, PR link and actual merge state, personal adaptations, validation results and limits, and any unresolved decision or local alignment step.
