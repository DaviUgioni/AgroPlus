// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore - getReactNativePersistence is available in firebase/auth React Native
import { getReactNativePersistence } from 'firebase/auth';

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

// Persistência de login: mantém usuário logado ao fechar o app
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}
export const auth = authInstance;