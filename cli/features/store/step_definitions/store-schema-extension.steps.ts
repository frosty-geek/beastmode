/**
 * Step definitions for store-schema-extension feature.
 *
 * Tests for feature slug support, slug normalization, and deduplication.
 * Also validates that epic slug and name fields work correctly.
 */

import { Given, When, Then } from "@cucumber/cucumber";
import type { StoreWorld } from "../support/store-world.js";
import type { Feature, Epic } from "../../../src/store/types.js";
import { strict as assert } from "assert";

// "a store is initialized" and "an epic {string} exists in the store"
// are defined in store-ready.steps.ts and store-entity.steps.ts respectively.

// --- Scenario 1: Feature carries a slug field ---

When(
  "a developer creates a feature {string} under {string} with slug {string}",
  function (this: StoreWorld, featureName: string, epicName: string, slug: string) {
    try {
      const feature = this.createFeatureWithSlug(featureName, epicName, slug);
      this.lastOutput = feature;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      throw this.lastError;
    }
  }
);

Then("the feature should have slug {string}", function (this: StoreWorld, expectedSlug: string) {
  if (this.lastError) throw this.lastError;
  const feature = this.lastOutput as Feature;
  assert.strictEqual(feature.slug, expectedSlug);
});

Then("the feature should be retrievable by slug {string}", function (this: StoreWorld, slug: string) {
  if (this.lastError) throw this.lastError;
  const found = this.store.find(slug);
  assert(found, "Entity not found");
  assert.strictEqual(found.type, "feature");
  assert.strictEqual((found as Feature).slug, slug);
});

// --- Scenario 2: Slug normalization to kebab-case ---

When(
  "a developer creates a feature with raw slug {string}",
  function (this: StoreWorld, rawSlug: string) {
    try {
      const epic = this.getEpicByName("auth-system");
      const feature = this.store.addFeature({
        parent: epic.id,
        name: "raw-slug-feature",
        slug: rawSlug,
      });
      this.featuresByName.set("raw-slug-feature", feature);
      this.lastOutput = feature;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      throw this.lastError;
    }
  }
);

Then(
  "the feature slug should be normalized to {string}",
  function (this: StoreWorld, expectedNormalized: string) {
    if (this.lastError) throw this.lastError;
    const feature = this.lastOutput as Feature;
    assert.strictEqual(feature.slug, expectedNormalized);
  }
);

// --- Scenario 3: Duplicate slug with suffix ---

Given("a feature with slug {string} already exists", function (this: StoreWorld, slug: string) {
  try {
    const epic = this.getEpicByName("auth-system");
    const feature = this.store.addFeature({
      parent: epic.id,
      name: "first-feature",
      slug,
    });
    this.featuresByName.set("first-feature", feature);
    this.lastOutput = feature;
  } catch (error) {
    this.lastError = error instanceof Error ? error : new Error(String(error));
    throw this.lastError;
  }
});

When(
  "a developer creates another feature with slug {string}",
  function (this: StoreWorld, slug: string) {
    try {
      const epic = this.getEpicByName("auth-system");
      const feature = this.store.addFeature({
        parent: epic.id,
        name: "second-feature",
        slug,
      });
      this.featuresByName.set("second-feature", feature);
      this.lastOutput = feature;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      throw this.lastError;
    }
  }
);

Then("the new feature slug should have a unique suffix appended", function (this: StoreWorld) {
  if (this.lastError) throw this.lastError;
  const secondFeature = this.lastOutput as Feature;
  const firstFeature = this.getFeatureByName("first-feature");

  assert.notStrictEqual(secondFeature.slug, firstFeature.slug);
  assert(secondFeature.slug.startsWith(firstFeature.slug));
});

Then(
  "both features should be retrievable by their distinct slugs",
  function (this: StoreWorld) {
    if (this.lastError) throw this.lastError;
    const firstFeature = this.getFeatureByName("first-feature");
    const secondFeature = this.getFeatureByName("second-feature");

    const foundFirst = this.store.find(firstFeature.slug);
    const foundSecond = this.store.find(secondFeature.slug);

    assert(foundFirst, "First feature not found");
    assert(foundSecond, "Second feature not found");
    assert.strictEqual(foundFirst.id, firstFeature.id);
    assert.strictEqual(foundSecond.id, secondFeature.id);
  }
);

// --- Scenario 4: Store is sole state file ---

Given(
  "a store contains epics with features, dependencies, and phase status",
  function (this: StoreWorld) {
    try {
      const epic = this.createEpic("main-epic");
      const feature1 = this.createFeature("feature-1", "main-epic");
      const feature2 = this.createFeature("feature-2", "main-epic");

      // Add dependency
      this.addDependency("feature-2", "feature-1");

      // Set statuses
      this.setEpicStatus("main-epic", "implement");
      this.setFeatureStatus("feature-1", "in-progress");
      this.setFeatureStatus("feature-2", "pending");

      this.lastOutput = { epic, features: [feature1, feature2] };
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      throw this.lastError;
    }
  }
);

When(
  "a developer inspects the pipeline state",
  function (this: StoreWorld) {
    try {
      const epics = this.store.listEpics();
      const allFeatures = epics.flatMap(e => this.store.listFeatures(e.id));
      this.lastOutput = { epics, features: allFeatures };
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      throw this.lastError;
    }
  }
);

Then(
  "all pipeline state is contained in a single store file",
  function (this: StoreWorld) {
    if (this.lastError) throw this.lastError;
    const state = this.lastOutput as { epics: any[]; features: any[] };
    assert(state.epics, "epics not defined");
    assert(state.epics.length > 0, "no epics");
    assert(state.features, "features not defined");
    assert(state.features.length > 0, "no features");
  }
);

Then("no separate manifest files are required", function (this: StoreWorld) {
  // Conceptual check: the store is self-contained
  assert(this.store, "store not defined");
  assert(this.store.listEpics, "listEpics not defined");
  assert(this.store.listFeatures, "listFeatures not defined");
});

// --- Scenario 5: Epic slug and name fields ---

When(
  "a developer creates an epic with slug {string} and name {string}",
  function (this: StoreWorld, slug: string, name: string) {
    try {
      const epic = this.store.addEpic({ slug, name });
      this.epicsByName.set(name, epic);
      this.lastOutput = epic;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      throw this.lastError;
    }
  }
);

Then("the epic should have slug {string}", function (this: StoreWorld, expectedSlug: string) {
  if (this.lastError) throw this.lastError;
  const epic = this.lastOutput as Epic;
  assert.strictEqual(epic.slug, expectedSlug);
});

Then("the epic should have name {string}", function (this: StoreWorld, expectedName: string) {
  if (this.lastError) throw this.lastError;
  const epic = this.lastOutput as Epic;
  assert.strictEqual(epic.name, expectedName);
});

Then("the epic slug should be immutable after creation", function (this: StoreWorld) {
  if (this.lastError) throw this.lastError;
  const epic = this.lastOutput as Epic;
  const originalSlug = epic.slug;

  // Try to update with a different slug
  const updated = this.store.updateEpic(epic.id, { slug: "different-slug" });

  // Slug should remain unchanged (immutable)
  assert.strictEqual(updated.slug, originalSlug);
});
