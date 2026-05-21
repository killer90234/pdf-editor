import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyC2GhC9Tg8yMluumZhuG7Lvo_Qzp3CeESM",
  authDomain: "pdf-editor-fd6d4.firebaseapp.com",
  projectId: "pdf-editor-fd6d4",
  storageBucket: "pdf-editor-fd6d4.firebasestorage.app",
  messagingSenderId: "662309181729",
  appId: "1:662309181729:web:06ccf40290ad6b9c628660",
  measurementId: "G-5C9S935EEK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
