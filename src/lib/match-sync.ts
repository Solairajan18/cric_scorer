import { onValue, ref, set } from "firebase/database";
import { Match } from "@/types/match";
import { getFirebaseDb, isFirebaseEnabled } from "@/lib/firebase";

export async function pushMatch(match: Match) {
  if (!isFirebaseEnabled()) return;
  try {
    const db = getFirebaseDb();
    await set(ref(db, `matches/${match.id}`), match);
  } catch (err) {
    // Local save already happened — log but don't crash the scorer
    console.warn("[cric-scorer] Firebase sync failed:", err);
  }
}

export function subscribeToMatch(matchId: string, callback: (match: Match | null) => void) {
  if (!isFirebaseEnabled()) {
    return () => undefined;
  }

  const db = getFirebaseDb();
  const unsubscribe = onValue(ref(db, `matches/${matchId}`), (snapshot) => {
    callback(snapshot.val() as Match | null);
  });

  return unsubscribe;
}
