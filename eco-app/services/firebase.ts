import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore ignores the missing type definition for React Native persistence
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyD3Eg3SJZsRyv-hWd2M_bdJppxvE2v_94A',
  authDomain: 'eco-app-658f8.firebaseapp.com',
  projectId: 'eco-app-658f8',
  storageBucket: 'eco-app-658f8.appspot.com',
  messagingSenderId: '552438842706',
  appId: '1:552438842706:web:5a288aea907d658931a68b',
};

// 1. Prevent Firebase App from initializing twice during Fast Refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Safely initialize Auth to avoid the 'auth/already-initialized' crash
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: any) {
  // If it is already initialized (due to saving the file), just get the existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error; // If it's a real error, we still want to know
  }
}

// 3. Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
