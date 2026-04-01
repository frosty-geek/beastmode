/**
 * Actor hydration — restores an ephemeral xstate actor from a manifest snapshot.
 *
 * Extracted so watch-command.ts tests can mock this module alone
 * without replacing the global xstate or pipeline-machine modules.
 */

import { createActor } from "xstate";
import { epicMachine } from "./pipeline-machine/index.js";
import type { EpicContext, EpicEvent } from "./pipeline-machine/index.js";

export interface HydratedActor {
  start(): void;
  stop(): void;
  send(event: EpicEvent): void;
  getSnapshot(): { value: string | object; context: EpicContext };
}

/**
 * Hydrate an ephemeral epic actor at the given phase/context.
 * The actor is started and ready to receive events.
 */
export function hydrateEpicActor(phase: string, context: EpicContext): HydratedActor {
  const resolvedSnapshot = epicMachine.resolveState({
    value: phase,
    context,
  });
  const actor = createActor(epicMachine, { snapshot: resolvedSnapshot, input: context });
  actor.start();
  return actor as unknown as HydratedActor;
}
