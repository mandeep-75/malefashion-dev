# AGENTS.md

## Repo access boundary

Do not read, write, or otherwise access any folder outside this repository's root.

This includes, but is not limited to:

- Sibling directories in the parent folder
- `/tmp`, `/var`, and other OS temp/scratch directories
- Global `node_modules`, global npm prefixes, and other user-level tool installs
- `~/.config`, `~/.cache`, `~/Library/Caches`, and other dotfolders

Only step outside this boundary when the task genuinely requires it, and when it
does, say so explicitly first so the user can approve it. Preference order:

1. Keep everything inside the repo. Scratch files, screenshots, and build
   artifacts belong in a gitignored path inside this project.
2. If a tool insists on writing outside the repo (a browser cache, a global
   install), stop and ask instead of working around it.

Tooling installed globally (Playwright MCP, Vercel CLI, etc.) may be *invoked*,
but its caches and install directories are off limits for reading and writing.