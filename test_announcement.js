// const fetch = require('node-fetch'); // Using native fetch
// Using native fetch for modern node (or http if needed, but let's try native first assuming Node 18+)

async function test() {
    try {
        const testData = { announcements: ["Test Duyuru 1", "Test Duyuru 2 " + Date.now()] };
        console.log("Sending POST request...");
        const res = await fetch('http://localhost:3000/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        console.log("Response status:", res.status);
        const json = await res.json();
        console.log("Response body:", json);

        if (res.ok) {
            console.log("Waiting 1s...");
            await new Promise(r => setTimeout(r, 1000));

            console.log("Sending GET request...");
            const res2 = await fetch('http://localhost:3000/api/announcements');
            const data = await res2.json();
            console.log("Fetched Data:", data);

            if (data.length === 2 && data[0] === "Test Duyuru 1") {
                console.log("SUCCESS: Data persisted.");
            } else {
                console.log("FAILURE: Data did not persist.");
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
