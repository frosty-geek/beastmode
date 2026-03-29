#!/bin/sh
# generate-output-json.sh — Stop hook that reads artifact frontmatter
# and generates output.json completion contracts.
#
# Runs after Claude finishes responding. Scans .beastmode/artifacts/<phase>/
# for ALL .md files with YAML frontmatter, parses each, and writes the
# corresponding output.json file if the artifact is newer than its output.
#
# Idempotent: safe to run multiple times; same input produces same output.
# Exits 0 always — hook failure must never block Claude.

set -e

# Resolve repo root so the hook works regardless of cwd
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$REPO_ROOT"

ARTIFACTS_DIR=".beastmode/artifacts"

# Bail if artifacts dir doesn't exist (not in a beastmode worktree)
if [ ! -d "$ARTIFACTS_DIR" ]; then
  exit 0
fi

# --- Frontmatter parser ---
# Extracts a YAML frontmatter value by key from a file.
# Usage: fm_get <file> <key>
# Returns empty string if not found.
fm_get() {
  _file="$1"
  _key="$2"
  sed -n '/^---$/,/^---$/p' "$_file" 2>/dev/null \
    | grep "^${_key}:" \
    | head -1 \
    | sed "s/^${_key}:[[:space:]]*//" \
    | sed 's/^["'"'"']//' \
    | sed 's/["'"'"']$//' \
    | tr -d '\r'
}

# Check if a file has YAML frontmatter (starts with ---)
has_frontmatter() {
  head -1 "$1" 2>/dev/null | grep -q '^---$'
}

# Get file mtime (portable: macOS stat -f, Linux stat -c)
get_mtime() {
  if stat -f %m "$1" >/dev/null 2>&1; then
    stat -f %m "$1"
  else
    stat -c %Y "$1" 2>/dev/null || echo 0
  fi
}

# --- Generate output.json for a single artifact ---
generate_output() {
  _artifact="$1"

  phase=$(fm_get "$_artifact" "phase")
  # Phase is required
  [ -n "$phase" ] || return 0

  artifact_basename=$(basename "$_artifact" .md)
  output_file="$ARTIFACTS_DIR/$phase/${artifact_basename}.output.json"

  # Skip if output.json exists and is newer than the artifact
  if [ -f "$output_file" ]; then
    art_mtime=$(get_mtime "$_artifact")
    out_mtime=$(get_mtime "$output_file")
    [ "$art_mtime" -gt "$out_mtime" ] || return 0
  fi

  slug=$(fm_get "$_artifact" "slug")
  epic=$(fm_get "$_artifact" "epic")
  feature=$(fm_get "$_artifact" "feature")
  status=$(fm_get "$_artifact" "status")
  bump=$(fm_get "$_artifact" "bump")

  case "$phase" in
    design)
      _status="${status:-completed}"
      cat > "${output_file}.tmp" <<ENDJSON
{
  "status": "$_status",
  "artifacts": {
    "design": "$_artifact"
  }
}
ENDJSON
      ;;

    plan)
      # Scan all plan artifacts for this epic to build feature list
      _epic="${epic:-$slug}"
      _features="[]"

      if [ -n "$_epic" ] && [ -d "$ARTIFACTS_DIR/plan" ]; then
        _feat_json=""
        for pf in "$ARTIFACTS_DIR/plan/"*"-${_epic}-"*.md; do
          [ -f "$pf" ] || continue
          has_frontmatter "$pf" || continue
          _f_feature=$(fm_get "$pf" "feature")
          [ -n "$_f_feature" ] || continue
          _f_basename=$(basename "$pf" .md)
          if [ -n "$_feat_json" ]; then
            _feat_json="${_feat_json},"
          fi
          _feat_json="${_feat_json}
      {\"slug\": \"${_f_feature}\", \"plan\": \"${_f_basename}.md\"}"
        done
        if [ -n "$_feat_json" ]; then
          _features="[${_feat_json}
    ]"
        fi
      fi

      cat > "${output_file}.tmp" <<ENDJSON
{
  "status": "${status:-completed}",
  "artifacts": {
    "features": $_features
  }
}
ENDJSON
      ;;

    implement)
      _status="${status:-completed}"
      _feature="${feature:-unknown}"
      cat > "${output_file}.tmp" <<ENDJSON
{
  "status": "$_status",
  "artifacts": {
    "features": [
      {"slug": "$_feature", "status": "$_status"}
    ]
  }
}
ENDJSON
      ;;

    validate)
      _status="${status:-passed}"
      _passed="true"
      if [ "$_status" = "failed" ]; then
        _passed="false"
        _status="error"
      else
        _status="completed"
      fi
      cat > "${output_file}.tmp" <<ENDJSON
{
  "status": "$_status",
  "artifacts": {
    "report": "$_artifact",
    "passed": $_passed
  }
}
ENDJSON
      ;;

    release)
      _bump="${bump:-patch}"
      cat > "${output_file}.tmp" <<ENDJSON
{
  "status": "${status:-completed}",
  "artifacts": {
    "version": "$_bump",
    "changelog": "$_artifact"
  }
}
ENDJSON
      ;;

    *)
      return 0
      ;;
  esac

  # Atomic write: tmp -> final
  mv "${output_file}.tmp" "$output_file"
}

# --- Scan all artifacts with frontmatter ---
for phase_dir in "$ARTIFACTS_DIR"/design "$ARTIFACTS_DIR"/plan "$ARTIFACTS_DIR"/implement "$ARTIFACTS_DIR"/validate "$ARTIFACTS_DIR"/release; do
  [ -d "$phase_dir" ] || continue

  for f in "$phase_dir"/*.md; do
    [ -f "$f" ] || continue
    has_frontmatter "$f" || continue
    generate_output "$f"
  done
done

exit 0
