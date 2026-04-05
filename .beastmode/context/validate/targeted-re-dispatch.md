# Targeted Re-Dispatch

## Pattern

When validate identifies specific failing features (integration tests map to feature slugs), write `failedFeatures` in the artifact frontmatter. The pipeline reads this field and sends `REGRESS_FEATURES` to the epic machine, resetting only failing features to pending while passing features retain their completed status.

## Artifact Frontmatter

```yaml
phase: validate
slug: <hex>
epic: <name>
status: failed
failedFeatures: feat-a,feat-b
```

`failedFeatures` is a comma-separated list of feature slugs. Omit when status is passed or when feature-level identification is impossible.

## Feature Identification

Map test failures to feature slugs using naming conventions:
- File naming: `<feature-slug>.integration.test.ts` or `<feature-slug>.feature`
- Tags: `@<feature-slug>` on Gherkin features or test groups
- Describe blocks: feature slug in the describe/Feature block name

When identification is not possible, omit `failedFeatures` — pipeline falls back to blanket REGRESS.

## Budget

Each feature has a maximum of 2 re-dispatch cycles (reDispatchCount 1 and 2). On the third failure (reDispatchCount would become 3), the pipeline marks the feature as `blocked` instead of `pending`. Report blocked features with cycle counts to the user.

context/validate/targeted-re-dispatch/
