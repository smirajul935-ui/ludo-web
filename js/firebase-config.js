// Replace the values below with the ones from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAPug7NEBR9oOuKnmF2m7m7TUiZI9TZVQo",
  authDomain: "ludo-e5cfc.firebaseapp.com",
  databaseURL: "https://ludo-e5cfc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ludo-e5cfc",
  storageBucket: "ludo-e5cfc.firebasestorage.app",
  messagingSenderId: "596873684153",
  appId: "1:596873684153:web:89d485c778855904906768"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
