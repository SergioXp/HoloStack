
// import { fetch } from "undici"; // Native fetch in Node 18+

const BASE_URL = "https://api.tcgdex.net/v2/en";

async function testEndpoints() {
    console.log("--- Testing TCGdex Endpoints ---");

    // 1. Test Rarities
    // 1. Test Rarities
    try {
        const rarities = await fetch(`${BASE_URL}/rarities`).then(r => r.json());
        console.log("Rarities available:", rarities);

        const rarityName = "Rare Ultra";
        console.log(`Testing rarity: ${rarityName}`);
        const rarityData = await fetch(`${BASE_URL}/rarities/${encodeURIComponent(rarityName)}`).then(r => r.json());
        console.log("Rarity Response Keys:", Object.keys(rarityData));
        if (rarityData.cards) {
            console.log(`Cards found in 'cards' property: ${rarityData.cards.length}`);
        } else {
            console.log("No 'cards' property found. Full response snippet:", JSON.stringify(rarityData).slice(0, 200));
        }
    } catch (e) { console.error("Rarity test failed", e); }

    // 2. Test Categories (Supertypes)
    try {
        const categories = await fetch(`${BASE_URL}/categories`).then(r => r.json());
        console.log("Categories available:", Array.isArray(categories) ? categories.slice(0, 3) : categories);

        // Test specific category that failed
        const catName = "Pokemon"; // Trying without accent
        console.log(`Testing category: ${catName}`);
        const catData = await fetch(`${BASE_URL}/categories/${encodeURIComponent(catName)}`).then(r => r.json());
        console.log("Category Response Keys:", Object.keys(catData));
        if (catData.cards) {
            console.log(`Cards found in 'cards' property: ${catData.cards.length}`);
        } else {
            console.log("No 'cards' property found. Full response snippet:", JSON.stringify(catData).slice(0, 200));
        }
    } catch (e) { console.error("Category test failed", e); }
}

testEndpoints();
