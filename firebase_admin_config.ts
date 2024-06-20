import admin from "firebase-admin"
import { getApps } from "firebase-admin/app";


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

if(!getApps().length){
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'caller-3010c.appspot.com'
    })
}

const adminDb = admin.firestore();
const adminStorage = admin.storage().bucket();



const auth = admin.auth();
export { adminDb, auth, adminStorage };