import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCIiE5fZ9KGfZBccCSFpZ9ZRi05CxVqlAw",
  authDomain: "trainingtop-d3963.firebaseapp.com",
  projectId: "trainingtop-d3963",
  storageBucket: "trainingtop-d3963.appspot.com",
  messagingSenderId: "327394522517",
  appId: "1:327394522517:web:8c0e547a16243f95b6729c",
  measurementId: "G-G13Y20HTXG"
};

const appFirebase = initializeApp(firebaseConfig);


export { appFirebase }; 