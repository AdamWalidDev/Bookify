# Repository workflow

## Choose the branch for the requested section

The user wants section-specific changes made on that section's existing branch.
Before editing, identify the section from the request and switch to its branch.
This is a standing instruction; do not ask for confirmation for a routine switch.

| Requested area | Branch |
| --- | --- |
| Resources | `style/resources-page` |
| Customers | `style/customers-page` |
| Bookings, including booking availability | `style/bookings-page` |
| Login | `style/login-page` |
| Shared buttons and inputs | `style/buttons-and-inputs` |
| Shared colors and visual foundation | `style/color-foundation` |

- Choose the branch from the requested change, even when the active editor file
  or current branch belongs to another section.
- Check `git status` and available branches before switching. Preserve existing
  staged, unstaged, and untracked work. Do not discard, commit, or stash unrelated
  work merely to switch branches. If unrelated edits would travel with the switch
  or prevent it, use an isolated worktree for the target branch when practical.
- Verify the active branch in the working directory before making changes.
- For an area not listed here, inspect existing local and remote branch names for
  a clear match. If the branch is missing or the intended destination is ambiguous,
  ask the user instead of silently choosing `main` or creating a replacement.
- For a request spanning sections, use the corresponding branches when the changes
  can be separated. Clarify the destination if a combined change has no clear home.
- A request to update workflow preferences alone does not require switching to a
  section branch.
