import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseEnabled() {
  return Object.values(config).every(Boolean);
}

export function getFirebaseDb() {
  if (!isFirebaseEnabled()) {
    throw new Error("Firebase is not configured.");
  }

  const app = getApps().length ? getApps()[0] : initializeApp(config as Required<typeof config>);
  return getDatabase(app);
}
