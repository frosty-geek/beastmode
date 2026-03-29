import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import {
  CmuxClient,
  CmuxError,
  CmuxConnectionError,
  CmuxProtocolError,
  cmuxAvailable,
} from "../cmux-client";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/**
 * Build a fake Bun subprocess with piped stdout/stderr as ReadableStreams.
 * `new Response(stream).text()` works on these, matching how exec() reads them.
 */
function mockProc(
  stdout: string,
  stderr: string,
  exitCode: number,
): Record<string, unknown> {
  return {
    stdout: new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(stdout));
        c.close();
      },
    }),
    stderr: new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(stderr));
        c.close();
      },
    }),
    exited: Promise.resolve(exitCode),
    pid: 99999,
    kill: () => {},
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let spawnSpy: ReturnType<typeof spyOn<typeof Bun, "spawn">> | undefined;

afterEach(() => {
  spawnSpy?.mockRestore();
  spawnSpy = undefined;
});

describe("CmuxClient", () => {
  let client: CmuxClient;

  beforeEach(() => {
    client = new CmuxClient({ timeoutMs: 1000 });
  });

  // -----------------------------------------------------------------------
  // ping
  // -----------------------------------------------------------------------

  describe("ping", () => {
    test("returns true when cmux responds with exit 0", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "", 0) as any,
      );

      expect(await client.ping()).toBe(true);
      expect(spawnSpy).toHaveBeenCalledWith(["cmux", "ping"], {
        stdout: "pipe",
        stderr: "pipe",
      });
    });

    test("returns false when cmux binary is not found", async () => {
      const err = new Error("spawn ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      spawnSpy = spyOn(Bun, "spawn").mockImplementation(() => {
        throw err;
      });

      expect(await client.ping()).toBe(false);
    });

    test("returns false when cmux exits non-zero", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "not running", 1) as any,
      );

      expect(await client.ping()).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // createWorkspace
  // -----------------------------------------------------------------------

  describe("createWorkspace", () => {
    test("passes name and parses workspace from JSON", async () => {
      const ws = { name: "my-epic", surfaces: [] };
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc(JSON.stringify(ws), "", 0) as any,
      );

      const result = await client.createWorkspace("my-epic");
      expect(result).toEqual(ws);
      expect(spawnSpy).toHaveBeenCalledWith(
        ["cmux", "workspace", "new", "my-epic", "--json"],
        { stdout: "pipe", stderr: "pipe" },
      );
    });

    test("throws CmuxProtocolError on invalid JSON", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("not json", "", 0) as any,
      );

      await expect(client.createWorkspace("x")).rejects.toThrow(CmuxProtocolError);
    });
  });

  // -----------------------------------------------------------------------
  // createSurface
  // -----------------------------------------------------------------------

  describe("createSurface", () => {
    test("creates surface in workspace with name", async () => {
      const surf = { name: "implement", workspace: "ws-1", pid: 123 };
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc(JSON.stringify(surf), "", 0) as any,
      );

      const result = await client.createSurface("ws-1", "implement");
      expect(result).toEqual(surf);
      expect(spawnSpy).toHaveBeenCalledWith(
        [
          "cmux",
          "surface",
          "new",
          "--workspace",
          "ws-1",
          "--name",
          "implement",
          "--json",
        ],
        { stdout: "pipe", stderr: "pipe" },
      );
    });
  });

  // -----------------------------------------------------------------------
  // sendText
  // -----------------------------------------------------------------------

  describe("sendText", () => {
    test("sends text to surface without JSON flag", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "", 0) as any,
      );

      await client.sendText("ws-1", "surf-1", "beastmode implement epic feat");
      expect(spawnSpy).toHaveBeenCalledWith(
        [
          "cmux",
          "surface",
          "send-text",
          "--workspace",
          "ws-1",
          "--surface",
          "surf-1",
          "--text",
          "beastmode implement epic feat",
        ],
        { stdout: "pipe", stderr: "pipe" },
      );
    });
  });

  // -----------------------------------------------------------------------
  // closeSurface
  // -----------------------------------------------------------------------

  describe("closeSurface", () => {
    test("closes surface successfully", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "", 0) as any,
      );

      await expect(
        client.closeSurface("ws-1", "surf-1"),
      ).resolves.toBeUndefined();
    });

    test("silently succeeds when surface not found (idempotent close)", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "surface not found", 1) as any,
      );

      await expect(client.closeSurface("ws-1", "surf-1")).resolves.toBeUndefined();
    });

    test("throws CmuxError on non-not-found failure", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "internal error", 1) as any,
      );

      await expect(client.closeSurface("ws-1", "surf-1")).rejects.toThrow(CmuxError);
    });

    test("throws CmuxConnectionError when binary missing", async () => {
      const err = new Error("spawn ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      spawnSpy = spyOn(Bun, "spawn").mockImplementation(() => {
        throw err;
      });

      await expect(client.closeSurface("ws-1", "surf-1")).rejects.toThrow(
        CmuxConnectionError,
      );
    });
  });

  // -----------------------------------------------------------------------
  // closeWorkspace
  // -----------------------------------------------------------------------

  describe("closeWorkspace", () => {
    test("closes workspace successfully", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "", 0) as any,
      );

      await expect(client.closeWorkspace("ws-1")).resolves.toBeUndefined();
    });

    test("throws on failure", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "workspace gone", 1) as any,
      );

      await expect(client.closeWorkspace("ws-1")).rejects.toThrow(CmuxError);
    });
  });

  // -----------------------------------------------------------------------
  // listWorkspaces
  // -----------------------------------------------------------------------

  describe("listWorkspaces", () => {
    test("parses workspace list from JSON", async () => {
      const data = [
        {
          name: "epic-a",
          surfaces: ["s-1", "s-2"],
        },
      ];
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc(JSON.stringify(data), "", 0) as any,
      );

      const result = await client.listWorkspaces();
      expect(result).toEqual(data);
      expect(spawnSpy).toHaveBeenCalledWith(
        ["cmux", "workspace", "list", "--json"],
        { stdout: "pipe", stderr: "pipe" },
      );
    });

    test("returns empty array for no workspaces", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("[]", "", 0) as any,
      );

      const result = await client.listWorkspaces();
      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getSurface
  // -----------------------------------------------------------------------

  describe("getSurface", () => {
    test("returns surface when found", async () => {
      const surf = { name: "plan", workspace: "ws-1", pid: 100 };
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc(JSON.stringify(surf), "", 0) as any,
      );

      const result = await client.getSurface("ws-1", "plan");
      expect(result).toEqual(surf);
    });

    test("returns null when surface not found", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "not found", 1) as any,
      );

      const result = await client.getSurface("ws-1", "plan");
      expect(result).toBeNull();
    });

    test("returns null when binary not available", async () => {
      const err = new Error("spawn ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      spawnSpy = spyOn(Bun, "spawn").mockImplementation(() => {
        throw err;
      });

      const result = await client.getSurface("ws-1", "plan");
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // notify
  // -----------------------------------------------------------------------

  describe("notify", () => {
    test("passes title and body without JSON flag", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "", 0) as any,
      );

      await client.notify("Error", "Phase failed");
      expect(spawnSpy).toHaveBeenCalledWith(
        ["cmux", "notify", "--title", "Error", "--body", "Phase failed"],
        { stdout: "pipe", stderr: "pipe" },
      );
    });
  });

  // -----------------------------------------------------------------------
  // error handling
  // -----------------------------------------------------------------------

  describe("error handling", () => {
    test("throws CmuxConnectionError when binary not found", async () => {
      const err = new Error("spawn ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      spawnSpy = spyOn(Bun, "spawn").mockImplementation(() => {
        throw err;
      });

      await expect(client.createWorkspace("x")).rejects.toThrow(CmuxConnectionError);
    });

    test("throws CmuxConnectionError on connection refused", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "connection refused", 1) as any,
      );

      await expect(client.createWorkspace("x")).rejects.toThrow(CmuxConnectionError);
    });

    test("throws CmuxConnectionError when not running", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "cmux is not running", 1) as any,
      );

      await expect(client.createWorkspace("x")).rejects.toThrow(CmuxConnectionError);
    });

    test("throws CmuxError on non-zero exit with stderr details", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "unknown command", 1) as any,
      );

      try {
        await client.createWorkspace("x");
        expect(true).toBe(false); // should not reach
      } catch (e) {
        expect(e).toBeInstanceOf(CmuxError);
        expect((e as Error).message).toContain("unknown command");
      }
    });

    test("uses stdout as error message when stderr is empty", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("error output here", "", 1) as any,
      );

      try {
        await client.createWorkspace("x");
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(CmuxError);
        expect((e as Error).message).toContain("error output here");
      }
    });

    test("falls back to exit code message when both streams empty", async () => {
      spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
        mockProc("", "", 1) as any,
      );

      try {
        await client.createWorkspace("x");
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(CmuxError);
        expect((e as Error).message).toContain("exited with code 1");
      }
    });
  });

  // -----------------------------------------------------------------------
  // timeout configuration
  // -----------------------------------------------------------------------

  describe("timeout", () => {
    test("defaults to 10 seconds", () => {
      const defaultClient = new CmuxClient();
      expect((defaultClient as any).timeoutMs).toBe(10_000);
    });

    test("accepts custom timeout", () => {
      const customClient = new CmuxClient({ timeoutMs: 5000 });
      expect((customClient as any).timeoutMs).toBe(5000);
    });
  });
});

// ---------------------------------------------------------------------------
// cmuxAvailable helper
// ---------------------------------------------------------------------------

describe("cmuxAvailable", () => {
  test("returns true when ping succeeds", async () => {
    spawnSpy = spyOn(Bun, "spawn").mockReturnValue(
      mockProc("", "", 0) as any,
    );

    expect(await cmuxAvailable()).toBe(true);
  });

  test("returns false when ping fails", async () => {
    const err = new Error("spawn ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    spawnSpy = spyOn(Bun, "spawn").mockImplementation(() => {
      throw err;
    });

    expect(await cmuxAvailable()).toBe(false);
  });
});
