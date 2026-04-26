"use client";

import { useCallback, useEffect, useState } from "react";
import { Match } from "@/types/match";
import { loadMatchLocal, saveMatchLocal } from "@/lib/match-engine";
import { pushMatch, subscribeToMatch } from "@/lib/match-sync";

import { useAuth } from "@/context/AuthContext";

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
    // If user is logged in but match has no userId, claim it
    const matchToSave = {
      ...nextMatch,
      userId: nextMatch.userId || user?.uid
    };
    
    setMatch(matchToSave);
    saveMatchLocal(matchToSave);
    await pushMatch(matchToSave);
  }, [user]);

  return { match, setMatch, loading, save };
}

