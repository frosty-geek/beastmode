# iTerm2 tmux Integration Mode — Research

**Date:** 2026-03-30
**Topic:** iTerm2 tmux control mode (`-CC`), protocol, programmatic control, limitations

---

## 1. How iTerm2 tmux Integration Mode Works

### Overview

iTerm2 can act as a native GUI client for tmux sessions using tmux's **control mode protocol**. Instead of rendering tmux's text-based UI inside a terminal, iTerm2 translates tmux windows into native tabs/windows and tmux panes into native split panes. The tmux server still runs independently (possibly on a remote machine), providing session persistence across disconnects.

### The `-CC` Flag

The `-CC` flag starts tmux in **control mode** with canonical terminal mode disabled:

```bash
# Local
tmux -CC new-session -A -s main

# Remote (typical usage)
ssh server -t tmux -CC new-session -A -s main
```

- Single `-C`: control mode with echo enabled (useful for testing/debugging)
- Double `-CC`: control mode with echo disabled, sends DCS entry sequence `\033P1000p`
- On exit, tmux sends `%exit` followed by ST sequence `\033\\`

### Communication Model

iTerm2 and tmux communicate via **in-band signaling** in the terminal stream. There is no separate socket or side-channel. The protocol is a simple **line-based text protocol** over stdin/stdout:

1. **Client -> tmux**: Standard tmux commands sent as plain text lines on stdin
2. **tmux -> Client**: Structured responses wrapped in `%begin`/`%end` blocks, plus async `%`-prefixed notifications
3. **Entry signal**: DCS escape `\033P1000p` (sent by tmux in `-CC` mode)
4. **Exit signal**: `%exit` followed by ST `\033\\`

### Gateway Session

When `tmux -CC` connects, iTerm2 opens a "gateway" session that shows a control menu (esc to detach, X to force-quit). The actual tmux windows appear as new iTerm2 tabs/windows. The gateway can be auto-buried via iTerm2 preferences.

---

## 2. The Control Mode Protocol

### Command/Response Format

Commands are standard tmux commands sent as lines. Responses are synchronous per command:

```
# Client sends:
list-sessions

# Server responds:
%begin 1578920019 258 1
0: main: 2 windows (created Mon Mar 30 10:00:00 2026)
%end 1578920019 258 1
```

**Block structure:**
- `%begin <timestamp> <command-id> <flags>` — start of response
- (output lines)
- `%end <timestamp> <command-id> <flags>` — success
- `%error <timestamp> <command-id> <flags>` — failure

The `<timestamp>` is seconds since epoch, `<command-id>` is a unique sequential integer, and `<flags>` is currently always 0 or 1.

### Async Notification Types (Complete List)

These `%`-prefixed messages arrive asynchronously between command responses:

| Notification | Trigger | Arguments |
|---|---|---|
| `%output %<pane> <data>` | Pane produces output | pane ID, output data |
| `%extended-output %<pane> <ms> :` | Output with flow control enabled | pane ID, ms behind, terminated by `:` |
| `%window-add @<window>` | Window added to attached session | window ID |
| `%window-close @<window>` | Window closed in attached session | window ID |
| `%window-renamed @<window> <name>` | Window renamed in attached session | window ID, new name |
| `%window-pane-changed @<window> %<pane>` | Active pane changed in window | window ID, pane ID |
| `%unlinked-window-add @<window>` | Window added in other session | window ID |
| `%unlinked-window-close @<window>` | Window closed in other session | window ID |
| `%unlinked-window-renamed @<window> <name>` | Window renamed in other session | window ID, new name |
| `%session-changed $<session> <name>` | Attached session changed | session ID, name |
| `%session-renamed $<session> <name>` | Any session renamed | session ID, new name |
| `%sessions-changed` | Session created or destroyed | (none) |
| `%client-session-changed <client> $<session> <name>` | Other client changed session | client, session ID, name |
| `%layout-change` | Window layout changed (splits, resizes) | (none) |
| `%pane-mode-changed %<pane>` | Pane mode changed (copy mode, etc.) | pane ID |
| `%exit` | Control client exiting | (none) |

**ID conventions:** `$session` for sessions, `@window` for windows, `%pane` for panes.

### Flow Control Flags

Set via `refresh-client -f <flag>`:

| Flag | Effect |
|---|---|
| `no-output` | Suppress `%output` notifications entirely |
| `pause-after=<seconds>` | Pause pane output if client lags; resume with `capture-pane` |
| `wait-exit` | Wait for empty line after `%exit` before closing |
| `read-only` | Restrict to read-only mode |

---

## 3. Window, Tab, and Pane Handling

### Mapping Model

| tmux concept | iTerm2 rendering |
|---|---|
| tmux session | Connected integration (gateway session) |
| tmux window | iTerm2 tab (or window, configurable) |
| tmux pane | iTerm2 split pane |

### Behavior Details

- tmux windows map to iTerm2 tabs by default (configurable to open as windows)
- On reconnect (`tmux -CC attach`), iTerm2 restores the exact prior state
- Dashboard opens when window count exceeds threshold (default ~10), requiring manual instantiation
- Dashboard threshold is configurable: Prefs > General > tmux > "Open dashboard if more than X tmux windows"

### Pane Restrictions

- A tab with a tmux window **cannot mix tmux panes with native iTerm2 split panes**
- tmux requires uniform window sizes, which can cause "empty" areas in splits that don't align with iTerm2's flexible dividers
- Pane resizing is constrained by tmux's grid model, not iTerm2's pixel-level layout

---

## 4. Programmatic Control

### Method 1: Raw tmux Control Mode (No iTerm2 Required)

Any program can connect to tmux in control mode by spawning the process and communicating over stdin/stdout:

```python
import subprocess
import re

proc = subprocess.Popen(
    ['tmux', '-L', 'mysocket', '-CC', 'new-session', '-d', '-s', 'work'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    text=True,
    bufsize=0
)

def send(cmd):
    proc.stdin.write(cmd + '\n')
    proc.stdin.flush()

def read_response():
    """Read until %end or %error block completes."""
    lines = []
    while True:
        line = proc.stdout.readline().strip()
        if line.startswith('%begin'):
            lines = [line]
        elif line.startswith(('%end', '%error')):
            lines.append(line)
            return lines
        elif line.startswith('%'):
            pass  # async notification — handle separately
        else:
            lines.append(line)

# Create a window
send('new-window -n editor')
response = read_response()

# Split it
send('split-window -h')
response = read_response()

# Send keystrokes to a pane
send('send-keys -t %1 "vim" Enter')

# List panes
send('list-panes -F "#{pane_id} #{pane_width}x#{pane_height}"')
response = read_response()

# Detach
send('')  # empty line detaches
```

**Key commands for programmatic use:**

| Operation | Command |
|---|---|
| Create window | `new-window [-n name] [command]` |
| Kill window | `kill-window -t @<id>` |
| Split pane horizontally | `split-window -h [-t %<pane>]` |
| Split pane vertically | `split-window [-t %<pane>]` |
| Kill pane | `kill-pane -t %<id>` |
| Resize pane | `resize-pane -x <w> -y <h> -t %<id>` |
| Select pane | `select-pane -t %<id>` |
| Send keys | `send-keys -t %<id> "text" Enter` |
| List sessions | `list-sessions -F "#{session_id} #{session_name}"` |
| List windows | `list-windows -F "#{window_id} #{window_name}"` |
| List panes | `list-panes -F "#{pane_id} #{pane_index}"` |
| Set layout | `select-layout [-t @<window>] tiled` |
| Rename window | `rename-window -t @<id> <name>` |

### Method 2: iTerm2 Python API (Requires iTerm2)

iTerm2 exposes a Python API for controlling tmux integration connections:

```python
import iterm2

async def main(connection):
    # Get active tmux connections
    tmux_conns = await iterm2.async_get_tmux_connections(connection)
    tmux_conn = tmux_conns[0]

    # Create a new tmux window (appears as iTerm2 tab)
    window = await tmux_conn.async_create_window()

    # Add a second tab
    tab2 = await window.async_create_tmux_tab(tmux_conn)

    # Send arbitrary tmux commands
    result = await tmux_conn.async_send_command("list-sessions")

    # Control visibility of tmux windows
    await tmux_conn.async_set_tmux_window_visible(tmux_window_id, True)

iterm2.run_until_complete(main)
```

**Available TmuxConnection methods:**

| Method | Description |
|---|---|
| `async_create_window()` | Create new tmux window (iTerm2 tab) |
| `async_send_command(cmd)` | Send raw tmux command, returns output string |
| `async_set_tmux_window_visible(id, visible)` | Show/hide tmux window as iTerm2 tab |
| `connection_id` | Unique connection identifier (property) |
| `owning_session` | Gateway session (property) |

**Limitations of Python API:**
- Requires active `tmux -CC` connection in iTerm2
- No direct pane/session objects (use `async_send_command` for complex operations)
- All methods are async
- Cannot be called within a Transaction

### Method 3: Standard tmux CLI (Always Available)

Even with iTerm2 integration active, the standard `tmux` CLI works:

```bash
tmux new-window -t mysession
tmux split-window -h -t mysession
tmux send-keys -t mysession:0.1 "echo hello" Enter
```

iTerm2 picks up changes through the control mode notifications and updates its UI accordingly.

---

## 5. Comparison: iTerm2 Integration vs Raw tmux

| Aspect | iTerm2 tmux Integration | Raw tmux | Raw Control Mode |
|---|---|---|---|
| **UI** | Native macOS tabs/splits | Terminal-based UI | No UI (text protocol) |
| **Navigation** | Cmd-T, Cmd-W, mouse | Prefix keys | Programmatic only |
| **Pane flexibility** | Constrained by tmux grid | Full tmux grid | N/A |
| **Programmatic control** | Python API + tmux commands | tmux CLI | Full protocol access |
| **Latency** | Higher (rendering pipeline) | Lower (direct) | Lowest (no rendering) |
| **Flow control** | Can lag behind tmux output | Terminal-limited | Manual (`pause-after`) |
| **Persistence** | Yes (tmux server) | Yes (tmux server) | Yes (tmux server) |
| **Multi-client** | Single client per session | Multiple clients | Multiple clients |
| **Platform** | macOS only | Any terminal | Any environment |
| **Shell integration** | Supported (disabled by default) | Supported | N/A |
| **TERM handling** | Rewrites screen -> xterm | Uses screen/tmux | N/A |

---

## 6. Limitations

### Performance
- No flow control between tmux and iTerm2 by default — causes lag when tmux outputs faster than iTerm2 renders
- 3-second delay reported when stopping high-output commands (e.g., `tree`, `find /`) with Ctrl-C
- Sessions auto-pause if catch-up exceeds configurable threshold

### Structural
- Cannot mix tmux panes with native iTerm2 splits in the same tab
- Uniform window sizing causes empty areas in asymmetric layouts
- Dashboard required for sessions with many windows (slows connection)
- Single-client limit per tmux session in integration mode

### Connection
- Running `tmux -CC` directly in shell (vs. via Profile > General > Command) can cause "random commands" reaching the shell on detach
- Multiple `-CC` flags confuse iTerm2
- Crashes may require `stty sane` or `X` force-quit to recover

### Compatibility
- macOS + iTerm2 only (not available in Terminal.app, other terminals, or other OSes)
- Requires compatible tmux version (control mode available since tmux 1.8, `-CC` since ~2.0)
- TERM=screen translation may cause issues with applications expecting xterm-256color

### API Gaps
- No official tmux client library for any language — must implement protocol parsing yourself
- iTerm2 Python API has no direct pane/session objects for tmux
- `%layout-change` notification lacks detail about what changed

---

## 7. Key Takeaways for Programmatic Use

1. **Control mode is the real API.** The `-C`/`-CC` protocol is the underlying mechanism. iTerm2 is just one client implementation. Any program can be a control mode client.

2. **The protocol is simple.** Line-based, text-only, parseable with basic string matching. No binary encoding, no complex framing.

3. **Full tmux command set is available.** Anything you can do with `tmux <command>` works in control mode. Windows, panes, send-keys, layouts, options — all of it.

4. **Async notifications are the event system.** `%output`, `%window-add`, `%layout-change` etc. give you a reactive event stream without polling.

5. **Flow control matters.** For production use, implement `pause-after` handling to avoid unbounded buffering.

6. **No official client library.** You roll your own parser. The protocol is simple enough that this is ~100-200 lines in most languages.

7. **iTerm2 adds GUI convenience, not capability.** Everything iTerm2 does through the Python API ultimately sends tmux commands through control mode. Going direct gives you more control with fewer moving parts.

---

## Sources

- [tmux Control Mode Wiki](https://github.com/tmux/tmux/wiki/Control-Mode)
- [iTerm2 tmux Integration Documentation](https://iterm2.com/documentation-tmux-integration.html)
- [iTerm2 Python API — tmux](https://iterm2.com/python-api/tmux.html)
- [iTerm2 Python API — tmux Examples](https://iterm2.com/python-api/examples/tmux.html)
- [iTerm2 Preferences — General](https://iterm2.com/documentation-preferences-general.html)
- [tmux man page](https://man7.org/linux/man-pages/man1/tmux.1.html)
