/**
 * Vitest setup — Bun API polyfill for Node.js.
 *
 * Source code uses Bun APIs (spawn, CryptoHasher, file, write, spawnSync).
 * This polyfill bridges them to Node.js equivalents so tests run under vitest.
 * No-op when running under actual Bun.
 */

if (typeof globalThis.Bun === "undefined") {
  const { spawn: nodeSpawn, spawnSync: nodeSpawnSync } = await import("node:child_process");
  const { createHash } = await import("node:crypto");
  const { writeFileSync, readFileSync, existsSync, mkdirSync } = await import("node:fs");
  const { dirname } = await import("node:path");
  const { Readable } = await import("node:stream");

  (globalThis as any).Bun = {
    /**
     * Bun.spawn → child_process.spawn.
     * Returns an object matching the Bun Subprocess shape used in worktree.ts / cli.ts:
     *   proc.stdout  → ReadableStream (for `new Response(proc.stdout).text()`)
     *   proc.stderr  → ReadableStream
     *   proc.exited  → Promise<number>
     *   proc.kill()  → sends signal
     *   proc.pid     → number
     */
    spawn(cmd: string[], opts?: Record<string, any>) {
      const stdio = [
        opts?.stdin === "inherit" ? "inherit" : "pipe",
        opts?.stdout === "inherit" ? "inherit" : "pipe",
        opts?.stderr === "inherit" ? "inherit" : "pipe",
      ] as const;

      const child = nodeSpawn(cmd[0], cmd.slice(1), {
        cwd: opts?.cwd,
        stdio,
        env: opts?.env ?? process.env,
      });

      const toWeb = (s: import("node:stream").Readable | null) =>
        s ? Readable.toWeb(s) as ReadableStream : null;

      // On spawn error (e.g. ENOENT), cleanly end stdout/stderr so
      // consumers waiting on `new Response(stream).text()` resolve
      // instead of hanging. Push null ends the readable gracefully.
      child.on("error", () => {
        child.stdout?.push(null);
        child.stderr?.push(null);
      });

      const exited = new Promise<number>((resolve, reject) => {
        child.on("exit", (code) => resolve(code ?? 1));
        child.on("error", (err) => reject(err));
      });
      // Prevent transient "unhandled rejection" when callers await
      // stdout/stderr before awaiting exited.
      exited.catch(() => {});

      return {
        stdout: toWeb(child.stdout),
        stderr: toWeb(child.stderr),
        pid: child.pid,
        kill(signal?: string) {
          child.kill(signal as NodeJS.Signals);
        },
        exited,
      };
    },

    /**
     * Bun.spawnSync → child_process.spawnSync.
     */
    spawnSync(cmd: string[], opts?: Record<string, any>) {
      const result = nodeSpawnSync(cmd[0], cmd.slice(1), {
        cwd: opts?.cwd,
        env: opts?.env ?? process.env,
        stdio: ["pipe", "pipe", "pipe"],
      });
      return {
        exitCode: result.status ?? 1,
        success: (result.status ?? 1) === 0,
        stdout: result.stdout ?? Buffer.alloc(0),
        stderr: result.stderr ?? Buffer.alloc(0),
      };
    },

    /**
     * Bun.CryptoHasher → crypto.createHash.
     */
    CryptoHasher: class {
      private h: import("node:crypto").Hash;
      constructor(algo: string) {
        this.h = createHash(algo);
      }
      update(data: string) {
        this.h.update(data);
        return this;
      }
      digest(format: string) {
        return this.h.digest(format as any);
      }
    },

    /**
     * Bun.write → fs.writeFileSync (with mkdir -p).
     */
    async write(path: string, content: string | Buffer) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
    },

    /**
     * Bun.file → object with .text() and .exists().
     */
    file(path: string) {
      return {
        async text() {
          return readFileSync(path, "utf-8");
        },
        async exists() {
          return existsSync(path);
        },
      };
    },
  };
}
