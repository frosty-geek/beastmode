# 1. Execute

## 1. Assert Worktree

Call [worktree-manager.md](../_shared/worktree-manager.md) → "Assert Worktree". If it fails, STOP.

## 2. Run Tests

```bash
<test-command>
```

Capture output and exit code.

## 3. Run Lint (if configured)

```bash
<lint-command>
```

## 4. Run Type Check (if configured)

```bash
<type-check-command>
```

## 5. Run Custom Gates

Execute any custom gates defined in `.beastmode/meta/VALIDATE.md`.
