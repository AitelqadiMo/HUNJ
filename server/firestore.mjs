import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

let initialized = false;

export const initFirestore = () => {
  if (initialized) return admin.firestore();

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : '';

  if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    throw new Error('Missing Firebase service account file. Set FIREBASE_SERVICE_ACCOUNT_PATH.');
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  initialized = true;
  return admin.firestore();
};

