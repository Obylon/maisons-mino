import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { groupeApi, messageApi } from "../services/api";
import { useAuth } from "./AuthContext";

const BadgeCtx = createContext({ groupeBadge: 0, priveBadge: 0, refreshBadges: () => {} });

export function BadgeProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [groupeBadge, setGroupeBadge] = useState(0);
  const [priveBadge, setPriveBadge] = useState(0);
  const intervalRef = useRef(null);

  const refreshBadges = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    try {
      if (user.role === "MAMAN") {
        const resG = await groupeApi.monGroupe().catch(() => null);
        if (resG?.data?.id) {
          const resN = await messageApi.nonLusGroupe(resG.data.id).catch(() => ({ data: 0 }));
          setGroupeBadge(resN.data || 0);
        }
        const resP = await messageApi.nonLusTotal().catch(() => ({ data: 0 }));
        setPriveBadge(resP.data || 0);
      }
    } catch {}
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { setGroupeBadge(0); setPriveBadge(0); return; }
    refreshBadges();
    intervalRef.current = setInterval(refreshBadges, 30000);
    return () => clearInterval(intervalRef.current);
  }, [isAuthenticated, refreshBadges]);

  return (
    <BadgeCtx.Provider value={{ groupeBadge, priveBadge, refreshBadges }}>
      {children}
    </BadgeCtx.Provider>
  );
}

export const useBadges = () => useContext(BadgeCtx);
