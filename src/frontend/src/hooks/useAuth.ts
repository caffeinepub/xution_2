import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./useActor";

const SESSION_TOKEN_KEY = "xution_session_token";

interface Session {
  type: "password" | "qr";
  memberId?: string;
  isAdmin: boolean;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const { actor, isFetching } = useActor();

  // Start restoring only if there's a token already saved
  const [isRestoring, setIsRestoring] = useState<boolean>(() => {
    try {
      return !!sessionStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return false;
    }
  });

  // Track whether a session restore attempt is pending (waiting for actor)
  const pendingRestoreRef = useRef<boolean>(
    (() => {
      try {
        return !!sessionStorage.getItem(SESSION_TOKEN_KEY);
      } catch {
        return false;
      }
    })(),
  );

  // When actor becomes available and we have a pending restore, validate the session
  useEffect(() => {
    if (!pendingRestoreRef.current) return;
    if (isFetching || !actor) return;

    const token = (() => {
      try {
        return sessionStorage.getItem(SESSION_TOKEN_KEY);
      } catch {
        return null;
      }
    })();

    if (!token) {
      pendingRestoreRef.current = false;
      setIsRestoring(false);
      return;
    }

    // Mark as no longer pending so this effect doesn't re-run
    pendingRestoreRef.current = false;

    actor
      .validateSession(token)
      .then((data) => {
        if (data) {
          setSession({
            type: (data.sessionType as "password" | "qr") ?? "password",
            memberId: data.memberId ?? undefined,
            // Password logins are always admin; QR logins are admin if stored as such
            isAdmin:
              data.sessionType === "password" ||
              data.sessionType === "qr-admin",
          });
        } else {
          // Invalid session – clear stored token
          try {
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        try {
          sessionStorage.removeItem(SESSION_TOKEN_KEY);
        } catch {
          // ignore
        }
      })
      .finally(() => {
        setIsRestoring(false);
      });
  }, [actor, isFetching]);

  const isAuthenticated = session !== null;
  const currentMemberId = session?.memberId ?? null;
  const isAdmin = session?.isAdmin ?? false;

  const loginWithPassword = useCallback(
    async (password: string): Promise<boolean> => {
      if (!actor) return false;
      try {
        const ok = await actor.verifyPassword(password);
        if (ok) {
          // Set session immediately so UI grants Class 6 access even if
          // createSession call fails (e.g. network issue or backend error)
          setSession({ type: "password", isAdmin: true });
          // Persist session token for page-refresh survival (best-effort)
          try {
            const token = crypto.randomUUID();
            await actor.createSession(token, "password", null);
            sessionStorage.setItem(SESSION_TOKEN_KEY, token);
          } catch {
            // Session persistence failed — login still works in-memory
          }
        }
        return ok;
      } catch {
        return false;
      }
    },
    [actor],
  );

  const loginWithQr = useCallback(
    async (memberId: string, isAdminMember: boolean): Promise<void> => {
      const sessionType = isAdminMember ? "qr-admin" : "qr";
      if (!actor) {
        setSession({ type: "qr", memberId, isAdmin: isAdminMember });
        return;
      }
      try {
        const token = crypto.randomUUID();
        await actor.createSession(token, sessionType, memberId);
        try {
          sessionStorage.setItem(SESSION_TOKEN_KEY, token);
        } catch {
          // ignore
        }
      } catch {
        // If session creation fails, still allow login in-memory
      }
      setSession({ type: "qr", memberId, isAdmin: isAdminMember });
    },
    [actor],
  );

  const logout = useCallback(async () => {
    try {
      const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (token && actor) {
        // fire-and-forget
        actor.destroySession(token).catch(() => {});
      }
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch {
      // ignore
    }
    setSession(null);
  }, [actor]);

  return {
    isAuthenticated,
    isRestoring,
    currentMemberId,
    isAdmin,
    loginWithPassword,
    loginWithQr,
    logout,
    sessionType: session?.type ?? null,
  };
}
