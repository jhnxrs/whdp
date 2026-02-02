import admin from "firebase-admin";

const getFirebaseServiceAccount = () => {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!rawServiceAccount) {
        throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
    }

    const parsed = JSON.parse(rawServiceAccount);
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");

    return parsed;
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(getFirebaseServiceAccount()),
    });
}

export const Auth = admin.auth();
export const Database = admin.firestore();