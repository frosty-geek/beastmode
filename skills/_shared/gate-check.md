# Gate Check

Evaluate a HITL gate by reading `.beastmode/config.yaml` and branching on the gate's mode.

## Usage

At any gate point in a phase file, after the `<!-- HITL-GATE: ... -->` annotation:

1. Read `.beastmode/config.yaml`
2. Look up the gate ID under `gates.<phase>.<gate-name>`
3. If config file not found or gate ID not found → default to `human`

## Behavior by Mode

### human
Execute the gate's original behavior:
- For APPROVAL gates: use AskUserQuestion with approval options
- For INTERACTIVE gates: use AskUserQuestion with discussion options
- For CONDITIONAL gates: present the decision to the user

### auto
Claude makes the decision and continues without asking:
- For APPROVAL gates: self-approve and proceed
- For INTERACTIVE gates: make reasonable choices (pick areas, answer own design questions, approve sections)
- For CONDITIONAL gates: make the judgment call based on context (e.g., fix the issue, pick the version, handle the deviation)

Log auto decisions inline: "Gate `<gate-id>` → auto: <decision made>"
