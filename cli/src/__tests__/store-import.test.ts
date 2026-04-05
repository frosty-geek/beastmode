import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { JsonFileStore } from "../store/json-file-store.js";

function tmpdir(): string {
  const dir = join("/tmp", `store-import-test-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("Feature slug field", () => {
  let storeDir: string;
  let storePath: string;
  let store: JsonFileStore;

  beforeEach(() => {
    storeDir = tmpdir();
    storePath = join(storeDir, "store.json");
    store = new JsonFileStore(storePath);
  });

  afterEach(() => {
    rmSync(storeDir, { recursive: true, force: true });
  });

  it("addFeature accepts and stores slug", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "Test Epic" }));
    const feature = await store.transact(s =>
      s.addFeature({ parent: epic.id, name: "Login Flow", slug: "login-flow" })
    );
    expect(feature.slug).toBe("login-flow");
  });

  it("addFeature auto-generates slug from name when not provided", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "Test Epic" }));
    const feature = await store.transact(s =>
      s.addFeature({ parent: epic.id, name: "Token Cache" })
    );
    expect(feature.slug).toBe("token-cache");
  });

  it("slug persists through save/load cycle", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "Test Epic" }));
    const feature = await store.transact(s =>
      s.addFeature({ parent: epic.id, name: "Login Flow", slug: "login-flow" })
    );

    // Load from disk in a new transaction
    const loaded = await store.transact(s => s.getFeature(feature.id));
    expect(loaded!.slug).toBe("login-flow");
  });

  it("slug is immutable via updateFeature", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "Test Epic" }));
    const feature = await store.transact(s =>
      s.addFeature({ parent: epic.id, name: "Login Flow", slug: "login-flow" })
    );

    // FeaturePatch should not include slug since it's in the Omit list
    const updated = await store.transact(s =>
      s.updateFeature(feature.id, { name: "Updated Name" })
    );
    expect(updated.slug).toBe("login-flow");
  });
});
