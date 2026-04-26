import { collection, doc, onSnapshot, query, setDoc, where, getDocs, orderBy } from "firebase/firestore";
import { Match } from "@/types/match";
import { getFirestoreDb, isFirebaseEnabled } from "@/lib/firebase";

export async function pushMatch(match: Match) {
  if (!isFirebaseEnabled()) return;
  console.log("[cric-scorer] Attempting to push match to Firestore:", match.id, "User:", match.userId);
  try {
    const db = getFirestoreDb();
    await setDoc(doc(db, "matches", match.id), match);
    console.log("[cric-scorer] Firestore sync successful!");
  } catch (err) {
    console.error("[cric-scorer] Firestore sync failed:", err);
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

export async function getUserMatches(userId: string): Promise<Match[]> {
  if (!isFirebaseEnabled()) return [];
  
  const db = getFirestoreDb();
  const q = query(
    collection(db, "matches"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Match);
}


