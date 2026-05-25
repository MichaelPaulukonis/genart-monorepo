# Commit with mandatory code review

Run `/code-review` on the current diff, present findings, then proceed through the standard Git Commit Workflow from CLAUDE.md.

Steps:
1. Invoke the `code-review` skill on the most recent changes (staged + unstaged diff against HEAD, or against main if nothing staged)
2. Present the findings. If there are CONFIRMED findings, summarize them and ask the user whether to fix them first or commit anyway
3. Once the user decides, proceed with the Git Commit Workflow from CLAUDE.md (steps 1–8), skipping step 0 since review is already done
