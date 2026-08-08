// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDDkgy2yP0d6tzkd5qoWkkeuKocdDWrM4s',
  authDomain: 'agroplus-2df27.firebaseapp.com',
  projectId: 'agroplus-2df27',
  storageBucket: 'agroplus-2df27.firebasestorage.app',
  messagingSenderId: '909119943534',
  appId: '1:909119943534:web:f147e489b926d228cb477f',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);