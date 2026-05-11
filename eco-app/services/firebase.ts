import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// manter as chaves originais
const firebaseConfig = {
  apiKey: 'AIzaSyD3Eg3SJZsRyv-hWd2M_bdJppxvE2v_94A',
  authDomain: 'eco-app-658f8.firebaseapp.com',
  projectId: 'eco-app-658f8',
  storageBucket: 'eco-app-658f8.firebasestorage.app',
  messagingSenderId: '552438842706',
  appId: '1:552438842706:web:5a288aea907d658931a68b',
};

const app = initializeApp(firebaseConfig);

// inicialização para evitar o erro de "Utilizador não autenticado"
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);