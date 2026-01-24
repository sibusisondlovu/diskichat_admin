
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCQN_EBBeTSv8R1FAVFtMyVk1z7IwSqwcs",
    authDomain: "diskichatapp.firebaseapp.com",
    projectId: "diskichatapp",
    storageBucket: "diskichatapp.firebasestorage.app",
    messagingSenderId: "1043541561298",
    appId: "1:1043541561298:web:bab9f5de48ca0ab860820b",
    measurementId: "G-7G0W2C5N99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedTeams() {
    console.log("Fetching teams data for PSL (League 288)...");

    const LEAGUE_ID = 288;
    const SEASON = 2023; // Use 2023 or 2024. 2023 is safer for full list if 2024 just started. Let's try 2023.

    const response = await fetch(`https://v3.football.api-sports.io/teams?league=${LEAGUE_ID}&season=${SEASON}`, {
        method: "GET",
        headers: {
            "x-rapidapi-key": "cd675cb5b4ff3bf1e26f67a7e1b68f76",
            "x-rapidapi-host": "v3.football.api-sports.io"
        }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.response || data.response.length === 0) {
        console.log("No teams found.");
        return;
    }

    console.log(`Found ${data.response.length} teams.`);

    const batchSize = 10;

    for (const item of data.response) {
        const team = item.team;
        const venue = item.venue;

        const docId = String(team.id);

        const teamData = {
            id: team.id,
            name: team.name,
            code: team.code,
            country: team.country,
            founded: team.founded || 0,
            national: team.national,
            logo: team.logo,
            venue_id: venue.id,
            venue_name: venue.name,
            venue_address: venue.address,
            venue_city: venue.city,
            venue_capacity: venue.capacity,
            venue_surface: venue.surface,
            venue_image: venue.image,
            season: SEASON,
            updatedAt: serverTimestamp()
        };

        console.log(`Saving team: ${team.name} (${docId})...`);
        await setDoc(doc(db, "teams", docId), teamData);
    }

    console.log("All teams seeded successfully.");
    process.exit(0);
}

seedTeams().catch(err => {
    console.error(err);
    process.exit(1);
});

