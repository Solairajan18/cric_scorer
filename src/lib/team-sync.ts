import { 
  collection, 
  query, 
  getDocs, 
  setDoc, 
  doc, 
  orderBy, 
  limit,
  getDoc
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { Player } from "@/types/match";

export type TeamRecord = {
  id: string;
  name: string;
  players: Player[];
  lastUsed: number;
  createdBy?: string;
};

// Fetch globally popular/recent teams
export async function getGlobalTeams(): Promise<TeamRecord[]> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, "teams"),
    orderBy("lastUsed", "desc"),
    limit(30)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as TeamRecord);
}

// Save or Update a team globally
export async function saveTeam(userId: string, name: string, players: Player[]) {
  const db = getFirestoreDb();
  const teamId = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  
  if (!teamId) return null;

  const docRef = doc(db, "teams", teamId);
  const existing = await getDoc(docRef);

  // If team exists, we only update 'lastUsed' and 'players' (if provided)
  // This maintains unique team names globally
  const record: TeamRecord = {
    id: teamId,
    name: name.trim(),
    players: players,
    lastUsed: Date.now(),
    createdBy: existing.exists() ? existing.data().createdBy : userId,
  };

  await setDoc(docRef, record, { merge: true });
  return record;
}
