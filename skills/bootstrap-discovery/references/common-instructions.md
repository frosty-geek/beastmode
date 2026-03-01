# Common Agent Instructions

Include this section at the end of every agent prompt.

## Output Format

Return ONLY valid JSON matching this schema:

```json
{
  "prime": "[PRIME_NAME]",
  "confidence": "high|medium|low",
  "sections": {
    "Section Name": {
      "action": "replace|merge|keep",
      "content": "markdown content for this section"
    }
  },
  "sources": ["file1.json", "path/to/file2.ts"]
}
```

## Action Rules

- Use `replace` when: section has only placeholders like `[e.g., ...]` or `[command]`
- Use `merge` when: section has real content but you found additional items (tables, lists)
- Use `keep` when: section has accurate content that matches your findings

## Safety Rules

- NEVER read: `.env`, `*.pem`, `credentials*`, `secrets*`, `*.key`
- Always cite source files in the `sources` array
- Set `confidence` to `low` if findings are ambiguous
