# init

Populate `.beastmode/` context hierarchy by discovering and organizing all existing project knowledge.

## Preconditions

If `.beastmode/` directory doesn't exist, run the install step automatically:
1. Find the plugin directory (this skill's parent path)
2. Copy `assets/.beastmode` skeleton to project root
3. Report: ".beastmode/ skeleton installed."
4. Continue to discovery

## Mode Detection

Examine the project:
- If the project has existing source files (beyond `.beastmode/`) → run full 3-phase discovery
- If the project is empty or only has `.beastmode/` → report "Empty project — skeleton installed. Start with /design." and STOP

No `--greenfield` or `--brownfield` flags. Empty projects evolve through /design sessions.

## Phase 1: Inventory (Single Orchestrator)

### 1. Announce

"Scanning project for existing knowledge."

### 2. Spawn inventory agent

```yaml
Agent:
  subagent_type: "beastmode:init-inventory"
  description: "Inventory project knowledge"
  prompt: |
    Analyze this project and produce a structured knowledge map.
    Working directory: {project root}
    Today's date: {YYYY-MM-DD}
```

### 3. Receive knowledge map

Parse the JSON knowledge map returned by the inventory agent. If the agent fails or returns invalid JSON, report the error and STOP.

### 4. Report inventory summary

Print the agent's summary field and the number of items per topic:

```
Discovery complete: {summary}

Topics found:
- product: {N} items
- architecture: {N} items
- tech-stack: {N} items
- conventions: {N} items
- structure: {N} items
- testing: {N} items
[- dynamic-topic: {N} items]
```

## Phase 2: Populate (Parallel Writers)

### 1. Announce

"Writing context files."

### 2. Ensure L3 directories exist

For each topic in the knowledge map:

```bash
mkdir -p .beastmode/context/<phase>/<topic>/
```

### 3. Spawn writer agents in parallel

Launch ALL writer agents in a SINGLE message. One agent per topic:

```yaml
# For each topic in knowledge_map.topics:
Agent:
  subagent_type: "beastmode:init-writer"
  description: "Write {topic} context"
  prompt: |
    Write L2 and L3 files for topic: {topic}
    L2 path: .beastmode/{l2Path}
    Phase: {phase}
    Today's date: {YYYY-MM-DD}

    Knowledge items:
    {JSON array of items for this topic}
```

### 4. Verify writer outputs

For each topic, confirm the L2 file exists and has content:

```bash
test -s .beastmode/context/<phase>/<topic>.md && echo "OK: <topic>" || echo "WARN: <topic> empty"
```

### 5. Handle errors

If any writer agent fails:
- Log warning: "Writer for {topic} failed — preserving existing content"
- Continue with remaining topics
- Do not abort the entire init

## Phase 3: Synthesize (Single Agent)

### 1. Announce

"Generating summaries and updating CLAUDE.md."

### 2. Spawn synthesize agent

```yaml
Agent:
  subagent_type: "beastmode:init-synthesize"
  description: "Synthesize L1 summaries"
  prompt: |
    Generate L1 summaries from L2 files and rewrite CLAUDE.md.
    Working directory: {project root}
    Today's date: {YYYY-MM-DD}

    Topics written: {list of topic names that succeeded in Phase 2}
    CLAUDE.md residual items: {claudeMdResidual from knowledge map}
```

### 3. Verify outputs

Confirm L1 files were generated:

```bash
for f in DESIGN PLAN IMPLEMENT; do
  test -s .beastmode/context/$f.md && echo "OK: $f.md" || echo "WARN: $f.md empty"
done
```

## Report

Print final summary:

```
Init complete.

Files created/updated:
- .beastmode/context/DESIGN.md
- .beastmode/context/PLAN.md
- .beastmode/context/IMPLEMENT.md
- .beastmode/context/design/product.md ({N} L3 records)
- .beastmode/context/design/architecture.md ({N} L3 records)
- .beastmode/context/design/tech-stack.md ({N} L3 records)
- .beastmode/context/plan/conventions.md ({N} L3 records)
- .beastmode/context/plan/structure.md ({N} L3 records)
- .beastmode/context/implement/testing.md ({N} L3 records)
[- .beastmode/context/<phase>/<dynamic-topic>.md ({N} L3 records)]
- CLAUDE.md (rewritten)

Total: {N} L2 files, {M} L3 records

Review the generated context, then /design your first feature.
```
