import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { Match } from "@/types/match";
import { getFirestoreDb, isFirebaseEnabled } from "@/lib/firebase";

export async function pushMatch(match: Match) {
  if (!isFirebaseEnabled()) return;
  try {
    const db = getFirestoreDb();
    await setDoc(doc(db, "matches", match.id), match);
  } catch (err) {
    // Local save already happened — log but don't crash the scorer
    console.warn("[cric-scorer] Firestore sync failed:", err);
  }
}

export function subscribeToMatch(matchId: string, callback: (match: Match | null) => void) {
  if (!isFirebaseEnabled()) {
    return () => undefined;
  }

  const db = getFirestoreDb();
  const unsubscribe = onSnapshot(doc(db, "matches", matchId), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as Match) : null);
  });

  return unsubscribe;
}

