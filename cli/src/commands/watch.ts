import type { BeastmodeConfig } from "../config";
import { watchCommand as watchCommandImpl } from "../watch-command";

export async function watchCommand(_config: BeastmodeConfig, _verbosity: number = 0): Promise<void> {
  await watchCommandImpl([]);
}
