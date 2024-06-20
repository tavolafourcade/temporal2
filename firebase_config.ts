import {getApp, getApps, initializeApp} from "firebase/app"
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyC7JRUaQ_qV3qZROFjImGHO-C4hmSfKuZ4",
    authDomain: "caller-3010c.firebaseapp.com",
    projectId: "caller-3010c",
    storageBucket: "caller-3010c.appspot.com",
    messagingSenderId: "460971564395",
    appId: "1:460971564395:web:c377eee0d1dee35ec8802e",
    measurementId: "G-1C2210QE8E"
  };
  
  // Initialize Firebase
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const auth = getAuth(app);



  export {db, auth};