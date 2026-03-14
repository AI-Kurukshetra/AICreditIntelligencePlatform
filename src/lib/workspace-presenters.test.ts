import { describe, expect, it } from "vitest";
import {
  controlTone,
  formatAuditTimestamp,
  intakeCopy,
  roleScope,
  statusTone,
} from "@/lib/workspace-presenters";

describe("workspace presenters", () => {
  it("maps application statuses to the expected tone classes", () => {
    expect(statusTone("approved")).toBe("status status-approved");
    expect(statusTone("denied")).toBe("status status-denied");
    expect(statusTone("review")).toBe("status status-review");
    expect(statusTone("anything-else")).toBe("status status-pending");
  });

  it("maps control outcomes to the expected tone classes", () => {
    expect(controlTone("verified")).toBe("status status-approved");
    expect(controlTone("clear")).toBe("status status-approved");
    expect(controlTone("block")).toBe("status status-denied");
    expect(controlTone("review")).toBe("status status-review");
    expect(controlTone("pending")).toBe("status status-pending");
  });

  it("returns role-specific scope and intake copy", () => {
    expect(roleScope("admin")).toContain("team management");
    expect(roleScope("underwriter")).toContain("All applications and scores");
    expect(roleScope("analyst")).toContain("own submissions");

    expect(intakeCopy("admin")).toContain("edge-case applications");
    expect(intakeCopy("underwriter")).toContain("wider shared pipeline");
    expect(intakeCopy("analyst")).toContain("originate new applications");
  });

  it("formats audit timestamps deterministically in UTC", () => {
    expect(formatAuditTimestamp("2026-03-14T05:30:00.000Z")).toBe("2026-03-14 05:30 UTC");
    expect(formatAuditTimestamp("not-a-date")).toBe("Unknown time");
  });
});
