# pi-agent-evals

## PALS Workflow

This project uses [PALS](https://github.com/coctostan/pals) — a project automation & lifecycle system.

- **Lifecycle:** PLAN → APPLY → UNIFY loop
- **State:** `.paul/STATE.md` tracks current position
- **Commands:** `/paul:plan`, `/paul:apply`, `/paul:unify`, `/paul:fix`
- **Git workflow:** github-flow
- **Active modules:** carl, todd, walt, dean, iris, skip, dave, ruby, arch, seth, pete, gabe, luke, aria, dana, omar, reed, vera, docs, rev

## Boundaries

### Always Do
- Run tests before marking work complete
- Follow the PLAN → APPLY → UNIFY loop
- Check `.paul/STATE.md` for current project position before starting work

### Ask First
- Before modifying files outside the current plan scope
- Before adding new dependencies
- Before changing architecture patterns

### Never Do
- Commit secrets, API keys, or credentials
- Skip the UNIFY phase after APPLY
- Modify `.paul/` files directly — use `/paul:*` commands

## Project Conventions

<!-- Add project-specific conventions that AI agents should follow. -->
<!-- Examples: naming patterns, import style, architecture decisions, domain terms. -->
<!-- This section is yours — PALS won't overwrite it during regeneration. -->

- [Add your conventions here]
