// HITL settings
export {
  buildEnvPrefix,
  writeHitlSettings,
  cleanHitlSettings,
  buildPreToolUseHook,
  getPhaseHitlProse,
  buildSessionStartHook,
  writeSessionStartHook,
  cleanSessionStartHook,
} from "./hitl-settings.js";
export type {
  WriteSettingsOptions,
  PromptHookEntry,
  EnvPrefixContext,
  WriteSessionStartHookOptions,
} from "./hitl-settings.js";

// HITL auto-response
export { decideResponse } from "./hitl-auto.js";

// HITL logging
export {
  detectTag,
  formatLogEntry,
  isFilePermissionInput,
  inferToolName,
  detectFilePermissionTag,
  formatFilePermissionLogEntry,
  routeAndFormat,
} from "./hitl-log.js";
export type {
  QuestionOption,
  Question,
  ToolInput,
  ToolOutput,
  FilePermissionInput,
} from "./hitl-log.js";

// File permission settings
export {
  buildFilePermissionPrompt,
  buildFilePermissionPreToolUseHooks,
  buildFilePermissionPostToolUseHooks,
  writeFilePermissionSettings,
  cleanFilePermissionSettings,
  CATEGORY_PATH_MAP,
} from "./file-permission-settings.js";
export type { WriteFilePermissionSettingsOptions } from "./file-permission-settings.js";

// Session lifecycle hooks
export { assembleContext, formatOutput, computeOutputTarget, buildMetadataSection, runSessionStart } from "./session-start.js";
export type { SessionStartInput, MetadataInput } from "./session-start.js";

export { parseFrontmatter, buildOutput, scanPlanFeatures, processArtifact, runSessionStop } from "./session-stop.js";
export type { ArtifactFrontmatter } from "./session-stop.js";
