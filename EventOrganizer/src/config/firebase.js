import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
    apiKey: "AIzaSyCwuqCL9hHfNKrXgS4HL2TmPZLLbOn2i4Q",
    authDomain: "event-management-77f2d.firebaseapp.com",
    projectId: "event-management-77f2d",
    storageBucket: "event-management-77f2d.firebasestorage.app",
    messagingSenderId: "484908102873",
    appId: "1:484908102873:web:0b2bbe818ffa30aa473ac8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});


export const db = getFirestore(app);

export default app;