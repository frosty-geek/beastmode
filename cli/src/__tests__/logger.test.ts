import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { createLogger } from "../logger";

describe("createLogger", () => {
  let stdoutSpy: ReturnType<typeof spyOn>;
  let stderrSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stdoutSpy = spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  describe("level gating", () => {
    test("verbosity 0: only log() writes", () => {
      const logger = createLogger(0, "test");
      logger.log("a");
      logger.detail("b");
      logger.debug("c");
      logger.trace("d");
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
    });

    test("verbosity 1: log() and detail() write", () => {
      const logger = createLogger(1, "test");
      logger.log("a");
      logger.detail("b");
      logger.debug("c");
      logger.trace("d");
      expect(stdoutSpy).toHaveBeenCalledTimes(2);
    });

    test("verbosity 2: log(), detail(), debug() write", () => {
      const logger = createLogger(2, "test");
      logger.log("a");
      logger.detail("b");
      logger.debug("c");
      logger.trace("d");
      expect(stdoutSpy).toHaveBeenCalledTimes(3);
    });

    test("verbosity 3: all methods write", () => {
      const logger = createLogger(3, "test");
      logger.log("a");
      logger.detail("b");
      logger.debug("c");
      logger.trace("d");
      expect(stdoutSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe("stderr/stdout separation", () => {
    test("warn() writes to stderr", () => {
      const logger = createLogger(0, "test");
      logger.warn("warning");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    test("error() writes to stderr", () => {
      const logger = createLogger(0, "test");
      logger.error("failure");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    test("log() writes to stdout", () => {
      const logger = createLogger(0, "test");
      logger.log("info");
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).not.toHaveBeenCalled();
    });
  });

  describe("warn/error bypass verbosity", () => {
    test("warn() shows at verbosity 0", () => {
      const logger = createLogger(0, "test");
      logger.warn("warning");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    test("error() shows at verbosity 0", () => {
      const logger = createLogger(0, "test");
      logger.error("failure");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("output format", () => {
    test("matches HH:MM:SS slug: message", () => {
      const logger = createLogger(0, "my-epic");
      logger.log("hello world");
      const call = stdoutSpy.mock.calls[0][0] as string;
      expect(call).toMatch(/^\d{2}:\d{2}:\d{2} my-epic: hello world\n$/);
    });

    test("warn format matches HH:MM:SS slug: message", () => {
      const logger = createLogger(0, "my-epic");
      logger.warn("oh no");
      const call = stderrSpy.mock.calls[0][0] as string;
      expect(call).toMatch(/^\d{2}:\d{2}:\d{2} my-epic: oh no\n$/);
    });
  });
});
