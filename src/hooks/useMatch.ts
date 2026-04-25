"use client";

import { useCallback, useEffect, useState } from "react";
import { Match } from "@/types/match";
import { loadMatchLocal, saveMatchLocal } from "@/lib/match-engine";
import { pushMatch, subscribeToMatch } from "@/lib/match-sync";

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const local = loadMatchLocal(matchId);
    if (local) {
      setMatch(local);
      setLoading(false);
    }

    const unsubscribe = subscribeToMatch(matchId, (remoteMatch) => {
      if (remoteMatch) {
        setMatch(remoteMatch);
        saveMatchLocal(remoteMatch);
        setLoading(false);
      } else if (!local) {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [matchId]);

  const save = useCallback(async (nextMatch: Match) => {
    setMatch(nextMatch);
    saveMatchLocal(nextMatch);
    await pushMatch(nextMatch);
  }, []);

  return { match, setMatch, loading, save };
}
