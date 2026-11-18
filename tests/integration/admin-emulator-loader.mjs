const adminURL = new URL("../../scripts/lib/admin.mjs", import.meta.url).href
export async function load(url, context, next) {
  if (url !== adminURL) return next(url, context)
  return {
    format: "module",
    shortCircuit: true,
    source: `
    import { initializeApp } from 'firebase-admin/app';
    import { getFirestore } from 'firebase-admin/firestore';
    import { getAuth } from 'firebase-admin/auth';
    export function adminClients(projectId) {
      if (!/^demo-[a-z0-9-]+$/.test(projectId) ||
          !/^127\\.0\\.0\\.1:\\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') ||
          !/^127\\.0\\.0\\.1:\\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '') ||
          process.env.GOOGLE_APPLICATION_CREDENTIALS) throw Error('LOCAL_EMULATORS_REQUIRED');
      const app = initializeApp({ projectId });
      return { app, db: getFirestore(app), auth: getAuth(app) };
    }
  `
  }
}
