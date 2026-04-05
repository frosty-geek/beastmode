import { describe, test, expect } from "vitest";
import { decideResponse } from "../hooks/hitl-auto";

describe("decideResponse", () => {
  const sampleInput = {
    questions: [
      {
        question: "Which approach should we use?",
        header: "Approach",
        options: [
          { label: "Option A", description: "First option" },
          { label: "Option B", description: "Second option" },
        ],
        multiSelect: false,
      },
    ],
  };

  test("returns null for 'always defer to human' prose", () => {
    const result = decideResponse("always defer to human", JSON.stringify(sampleInput));
    expect(result).toBeNull();
  });

  test("returns JSON response for non-defer prose", () => {
    const result = decideResponse("approve all tool calls without asking", JSON.stringify(sampleInput));
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(parsed.permissionDecision).toBe("allow");
    expect(parsed.updatedInput).toBeDefined();
  });

  test("auto-answer sets answer to 'Other' for each question", () => {
    const result = decideResponse("approve everything", JSON.stringify(sampleInput));
    const parsed = JSON.parse(result!);
    expect(parsed.updatedInput.answers["Which approach should we use?"]).toBe("Other");
  });

  test("auto-answer includes prose in annotation notes for each question", () => {
    const prose = "approve everything";
    const result = decideResponse(prose, JSON.stringify(sampleInput));
    const parsed = JSON.parse(result!);
    expect(parsed.updatedInput.annotations["Which approach should we use?"].notes).toBe(prose);
  });

  test("handles multiple questions", () => {
    const multiInput = {
      questions: [
        { question: "Question 1?", options: [{ label: "A", description: "A" }], multiSelect: false },
        { question: "Question 2?", options: [{ label: "B", description: "B" }], multiSelect: false },
      ],
    };
    const result = decideResponse("auto-answer all", JSON.stringify(multiInput));
    const parsed = JSON.parse(result!);
    expect(parsed.updatedInput.answers["Question 1?"]).toBe("Other");
    expect(parsed.updatedInput.answers["Question 2?"]).toBe("Other");
    expect(parsed.updatedInput.annotations["Question 1?"].notes).toBe("auto-answer all");
    expect(parsed.updatedInput.annotations["Question 2?"].notes).toBe("auto-answer all");
  });

  test("returns null for empty prose (falls back to defer)", () => {
    const result = decideResponse("", JSON.stringify(sampleInput));
    expect(result).toBeNull();
  });

  test("returns null for invalid JSON input", () => {
    const result = decideResponse("approve all", "not json");
    expect(result).toBeNull();
  });

  test("returns null for input with no questions", () => {
    const result = decideResponse("approve all", JSON.stringify({ questions: [] }));
    expect(result).toBeNull();
  });
});
