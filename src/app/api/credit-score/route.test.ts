import { afterEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

describe("POST /api/credit-score", () => {
  afterEach(() => {
    getUserMock.mockReset();
    vi.resetModules();
  });

  it("rejects unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null,
      },
    });

    const { POST } = await import("@/app/api/credit-score/route");
    const response = await POST(
      new Request("http://localhost/api/credit-score", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required.",
    });
  });

  it("returns an assessment payload for authenticated requests", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
        },
      },
    });

    const { POST } = await import("@/app/api/credit-score/route");
    const response = await POST(
      new Request("http://localhost/api/credit-score", {
        method: "POST",
        body: JSON.stringify({
          applicantName: "Ananya Sharma",
          applicantEmail: "ananya@example.com",
          annualIncome: 720000,
          city: "Ahmedabad",
          creditScore: 760,
          dataSources: ["bureau", "bank", "utility"],
          employmentType: "salaried",
          existingLoans: 0,
          loanAmount: 400000,
          loanPurpose: "home",
          monthlyEmi: 6000,
          phone: "9876543210",
          state: "Gujarat",
        }),
      }),
    );

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toMatchObject({
      applicationStatus: "approved",
      decision: "approve",
      riskLevel: "very_low",
      modelVersion: "v1.1-mvp",
      identity: {
        status: "verified",
      },
      fraud: {
        recommendedAction: "clear",
      },
      compliance: {
        recordStatus: "pass",
      },
    });
  });
});
