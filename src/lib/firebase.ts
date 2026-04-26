import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};


function getFirebaseApp() {
  if (!isFirebaseEnabled()) {
    throw new Error("Firebase is not configured.");
  }
  return getApps().length ? getApps()[0] : initializeApp(config as Required<typeof config>);
}

export function isFirebaseEnabled() {
  const { databaseURL, ...required } = config;
  const enabled = Object.values(required).every(Boolean);
  if (!enabled) {
    console.warn("[cric-scorer] Core Firebase environment variables are missing! Check .env.local", required);
  }
  return enabled;
}



export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseDb() {
  return getDatabase(getFirebaseApp());
}

