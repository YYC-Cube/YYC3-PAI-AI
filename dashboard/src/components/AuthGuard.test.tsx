import { describe, expect, it, vi, beforeEach } from "vitest";
import { configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AuthGuard from "./AuthGuard";

// Full-suite runs put this file on a worker alongside CPU-heavy siblings;
// keep a bounded 15s async-util budget so a genuinely stuck boot chain
// still fails instead of hanging the suite. (The historical flake here was
// NOT this timeout — see the detach-race note inside the shell-mount test.)
configure({ asyncUtilTimeout: 15000 });

vi.mock("../api/modules/auth", () => ({
  authApi: {
    getAuthStatus: vi.fn(),
    me: vi.fn(),
  },
}));

vi.mock("../api/request", () => ({
  getAuthToken: vi.fn(() => null),
  clearAuthToken: vi.fn(),
}));

vi.mock("../utils/locale", () => ({
  applyUserLocale: vi.fn(() => Promise.resolve()),
}));

import { authApi } from "../api/modules/auth";
import { getAuthToken } from "../api/request";

describe("AuthGuard offline boot", () => {
  beforeEach(() => {
    vi.mocked(authApi.getAuthStatus).mockReset();
    vi.mocked(authApi.me).mockReset();
    vi.mocked(getAuthToken).mockReset();
    vi.mocked(getAuthToken).mockReturnValue(null);
  });

  it("shows offline panel instead of the protected shell when setup/status fails", async () => {
    vi.mocked(authApi.getAuthStatus).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>protected-shell</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toMatch(
      /errors\.offlineTitle|Cannot reach|无法连接/,
    );
    expect(
      screen.getByRole("button", { name: /errors\.retry|Retry|重试/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("protected-shell")).not.toBeInTheDocument();
  });

  it("keeps the authenticated shell mounted across in-app navigations", async () => {
    vi.mocked(getAuthToken).mockReturnValue("tok");
    vi.mocked(authApi.getAuthStatus).mockResolvedValue({
      setup_required: false,
      has_admin: true,
    } as never);
    vi.mocked(authApi.me).mockResolvedValue({
      user_id: 1,
      username: "admin",
      role: "admin",
      locale: "zh",
    } as never);

    // NavProbe's /a output is TRANSIENT: the navigation effect unmounts it
    // as soon as the gate opens. Asserting toBeInTheDocument on an element
    // findByText grabbed from that route raced the unmount — the element
    // detached between findByText's resolution and the attachment check
    // under full-suite worker load (fast "element could not be found in
    // the document" failures, not timeouts). Only the /b element — the
    // stable post-navigation shell — carries the marker text.
    function NavProbe() {
      const navigate = useNavigate();
      useEffect(() => {
        navigate("/b");
      }, [navigate]);
      return <div>probe-a</div>;
    }

    render(
      <MemoryRouter initialEntries={["/a"]}>
        <AuthGuard>
          <Routes>
            <Route path="/a" element={<NavProbe />} />
            <Route path="/b" element={<div>protected-shell</div>} />
          </Routes>
        </AuthGuard>
      </MemoryRouter>,
    );

    expect(await screen.findByText("protected-shell")).toBeInTheDocument();
    await waitFor(() => {
      expect(authApi.getAuthStatus).toHaveBeenCalledTimes(1);
    });
    // Give route-driven navigate identity churn a tick; gate must not re-run.
    await waitFor(() => {
      expect(screen.getByText("protected-shell")).toBeInTheDocument();
    });
    // The transient /a route must be gone — the navigation really happened.
    expect(screen.queryByText("probe-a")).not.toBeInTheDocument();
    expect(authApi.getAuthStatus).toHaveBeenCalledTimes(1);
    expect(authApi.me).toHaveBeenCalledTimes(1);
  });

  it("retries auth from the offline panel without leaving a blank shell", async () => {
    vi.mocked(authApi.getAuthStatus)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue({
        setup_required: false,
        has_admin: true,
      } as never);
    vi.mocked(getAuthToken).mockReturnValue("tok");
    vi.mocked(authApi.me).mockResolvedValue({
      user_id: 1,
      username: "admin",
      role: "admin",
      locale: "zh",
    } as never);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthGuard>
          <div>protected-shell</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    const retry = await screen.findByRole("button", {
      name: /errors\.retry|Retry|重试/,
    });
    await user.click(retry);
    expect(await screen.findByText("protected-shell")).toBeInTheDocument();
  });
});
