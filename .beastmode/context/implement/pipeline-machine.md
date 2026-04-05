# Pipeline Machine

## Machine Architecture
- Two XState v5 machines: epicMachine (7 states with side effects) and featureMachine (3 states, pure status tracking)
- ALWAYS use the setup() API — declare all guards, actions, and actors in setup() before createMachine()
- Epic states: design, plan, implement, validate, release, done, cancelled — done and cancelled are terminal (type: "final")
- Feature states: pending, in-progress, completed — completed is terminal (type: "final")
- CANCEL event is valid from every non-terminal epic state
- REGRESS event (`{ type: "REGRESS", targetPhase }`) is valid from every non-terminal epic state — guard enforces targetPhase <= currentPhase and targetPhase != "design"
- REGRESS actions: set phase to targetPhase, reset all features to pending when regressing to or past implement, clear blocked fields, clear downstream artifact entries
- VALIDATE_FAILED event is fully removed — replaced by REGRESS with targetPhase "implement"
- REGRESS_FEATURES event (`{ type: "REGRESS_FEATURES", failingFeatures: string[] }`) is valid from validate state only — guard `hasFailingFeatures` requires non-empty array; actions apply `regressFeatures()` pure function which resets only named features to pending (incrementing reDispatchCount), leaves passing features completed, and marks features with reDispatchCount > 2 as blocked; phase transitions to implement
- REGRESS_FEATURES is the preferred regression path from validate — REGRESS (blanket) is the fallback when per-feature identification is unavailable
- reDispatchCount on ManifestFeature tracks how many times a feature has been re-dispatched by validate; budget is 2 (third failure marks feature blocked)

## Assign Separation Pattern
- ALWAYS place assign() calls inside setup() actions — XState v5.30 requires this for type inference
- Action logic lives in pure compute functions exported from actions.ts
- assign() wrappers in setup() call the compute functions and add lastUpdated timestamps
- Side-effect actions (persist) accumulate state in memory only — no disk writes during machine transitions
- Single `store.save()` at end of post-dispatch writes final state — `store.save()` is a pure write with no rename detection

## Dispatch Metadata
- Every state node declares meta: { dispatchType } — single, fan-out, or skip
- design/plan/validate/release are single, implement is fan-out, done/cancelled are skip
- Watch loop reads dispatch instructions from state metadata

## Service Injection
- Async services use fromPromise with injectable functions via input
- syncGitHub service is non-blocking: errors caught internally, returned as warnings
- No sync function provided = no-op return with warning, never throws

## Actor Lifecycle
- createEpicActor(context) creates and starts a fresh actor
- loadEpic(snapshot, context) restores an actor from persisted snapshot
- Event type constants exported as EPIC_EVENTS and FEATURE_EVENTS

## Guards
- Guards are standalone pure functions in guards.ts, registered by name in setup()
- Guard decisions are event-driven: check event payloads rather than external state
- hasFeatures gates plan-to-implement, allFeaturesCompleted gates implement-to-validate
