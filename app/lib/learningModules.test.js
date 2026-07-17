// Tests for the pure assignment/progress helpers.
//
// The key shared with both Android apps is `{childId}_{moduleId}` — GuardParent
// builds it with String(moduleId), and the module doc's own `moduleId` is a
// NUMBER while the assignment's is a STRING (verified against live data). If
// assignmentKey stops coercing, every progress join silently returns 0%.
import { describe, it, expect, vi } from "vitest";

vi.mock("./firebase", () => ({ db: {} }));

const {
  assignmentKey,
  progressFor,
  isAssignmentCompleted,
  isAssignmentOverdue,
  effectiveAssignmentStatus,
  ASSIGNMENT_STATUS,
} = await import("./learningModules.js");

const ts = (ms) => ({ toMillis: () => ms });
const assignment = (over = {}) => ({ childId: "c1", moduleId: "3", ...over });
const progressMap = (entries) => new Map(Object.entries(entries));

describe("assignmentKey", () => {
  it("joins childId and moduleId", () => {
    expect(assignmentKey("c1", "3")).toBe("c1_3");
  });

  it("coerces a numeric moduleId to a string, matching GuardParent", () => {
    // modules/{id}.moduleId is a number; the assignment id uses String(...).
    expect(assignmentKey("c1", 3)).toBe("c1_3");
    expect(assignmentKey("c1", 3)).toBe(assignmentKey("c1", "3"));
  });
});

describe("progressFor", () => {
  // The child app writes `progress` as a PERCENT: Math.round((done/total)*100).
  // Live rows show progress=33 for 1/3 and progress=100 for 2/2. Reading it as
  // a 0..1 fraction clamps every non-zero value to 1 → everything "complete".
  it("converts the child's 0-100 percent to a 0..1 fraction", () => {
    expect(progressFor(assignment(), progressMap({ c1_3: { progress: 50 } }))).toBe(0.5);
    expect(progressFor(assignment(), progressMap({ c1_3: { progress: 33 } }))).toBe(0.33);
    expect(progressFor(assignment(), progressMap({ c1_3: { progress: 100 } }))).toBe(1);
  });

  it("does not treat a partial percent as complete", () => {
    expect(progressFor(assignment(), progressMap({ c1_3: { progress: 33 } }))).toBeLessThan(1);
  });

  it("rejects the NaN the child writes for a 0-lesson module", () => {
    // Real rows: `progress=NaN, lessons=0/0`. typeof NaN === "number", so an
    // unguarded read reaches the DOM as width: NaN%.
    const p = progressFor(
      assignment(),
      progressMap({ c1_3: { progress: NaN, lessonsCompleted: 0, totalLessons: 0 } }),
    );
    expect(Number.isNaN(p)).toBe(false);
    expect(p).toBe(0);
  });

  it("is 0 when the child has no progress row yet", () => {
    expect(progressFor(assignment(), progressMap({}))).toBe(0);
    expect(progressFor(assignment(), undefined)).toBe(0);
  });

  it("joins across the number/string moduleId mismatch", () => {
    // Assignment carries "3"; a progress row written with a numeric moduleId
    // still lives at the same doc id, so the join must hold. Live rows really
    // do carry moduleId as both 1 and "1".
    expect(progressFor(assignment({ moduleId: 3 }), progressMap({ c1_3: { progress: 100 } }))).toBe(1);
  });

  it("falls back to lesson counts when progress is absent", () => {
    expect(
      progressFor(assignment(), progressMap({ c1_3: { lessonsCompleted: 2, totalLessons: 8 } })),
    ).toBe(0.25);
  });

  it("does not divide by zero when totalLessons is 0", () => {
    expect(
      progressFor(assignment(), progressMap({ c1_3: { lessonsCompleted: 0, totalLessons: 0 } })),
    ).toBe(0);
  });

  it("clamps out-of-range percents", () => {
    expect(progressFor(assignment(), progressMap({ c1_3: { progress: 500 } }))).toBe(1);
    expect(progressFor(assignment(), progressMap({ c1_3: { progress: -10 } }))).toBe(0);
  });
});

describe("isAssignmentCompleted", () => {
  it("trusts the child app's completed status", () => {
    expect(isAssignmentCompleted(assignment(), progressMap({ c1_3: { status: "completed" } }))).toBe(
      true,
    );
  });

  it("also completes at 100 percent", () => {
    expect(isAssignmentCompleted(assignment(), progressMap({ c1_3: { progress: 100 } }))).toBe(true);
  });

  it("is false partway through, and with no row", () => {
    expect(isAssignmentCompleted(assignment(), progressMap({ c1_3: { progress: 90 } }))).toBe(false);
    expect(isAssignmentCompleted(assignment(), progressMap({}))).toBe(false);
  });
});

describe("isAssignmentOverdue", () => {
  const past = ts(Date.now() - 86_400_000);
  const future = ts(Date.now() + 86_400_000);

  it("is overdue when past due and unfinished", () => {
    expect(isAssignmentOverdue(assignment({ dueDate: past }), progressMap({}))).toBe(true);
  });

  it("is not overdue once the child has completed it", () => {
    expect(
      isAssignmentOverdue(assignment({ dueDate: past }), progressMap({ c1_3: { status: "completed" } })),
    ).toBe(false);
  });

  it("is not overdue before the due date, or with no due date", () => {
    expect(isAssignmentOverdue(assignment({ dueDate: future }), progressMap({}))).toBe(false);
    expect(isAssignmentOverdue(assignment(), progressMap({}))).toBe(false);
  });
});

describe("effectiveAssignmentStatus", () => {
  it("derives each state from the child's reported progress", () => {
    expect(effectiveAssignmentStatus(assignment(), progressMap({}))).toBe(
      ASSIGNMENT_STATUS.ASSIGNED,
    );
    expect(
      effectiveAssignmentStatus(assignment(), progressMap({ c1_3: { progress: 40 } })),
    ).toBe(ASSIGNMENT_STATUS.IN_PROGRESS);
    expect(
      effectiveAssignmentStatus(assignment(), progressMap({ c1_3: { progress: 100 } })),
    ).toBe(ASSIGNMENT_STATUS.COMPLETED);
  });

  it("prefers completed over overdue", () => {
    const a = assignment({ dueDate: ts(Date.now() - 1000) });
    expect(effectiveAssignmentStatus(a, progressMap({ c1_3: { progress: 100 } }))).toBe(
      ASSIGNMENT_STATUS.COMPLETED,
    );
  });

  it("reports overdue for unfinished past-due work", () => {
    const a = assignment({ dueDate: ts(Date.now() - 1000) });
    expect(effectiveAssignmentStatus(a, progressMap({ c1_3: { progress: 20 } }))).toBe(
      ASSIGNMENT_STATUS.OVERDUE,
    );
  });
});
