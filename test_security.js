// Using native fetch (Node 18+)


const API_URL = 'http://localhost:3000/api';

async function testSecurity() {
    console.log("Starting Security Test...");
    let failure = false;

    // 1. Test Content Whitelist
    console.log("Test 1: Content Whitelist");
    try {
        const res = await fetch(`${API_URL}/content/users`);
        if (res.status === 403) {
            console.log(" PASS: /content/users returned 403.");
        } else {
            console.log(` FAIL: /content/users returned ${res.status} (Expected 403)`);
            failure = true;
        }

        const res2 = await fetch(`${API_URL}/content/genealogy`);
        if (res2.status === 200) {
            console.log(" PASS: /content/genealogy returned 200.");
        } else {
            console.log(` FAIL: /content/genealogy returned ${res2.status} (Expected 200)`);
            failure = true;
        }
    } catch (e) {
        console.error(" Error connecting:", e.message);
        failure = true;
    }

    // 2. Test Security Headers (Helmet)
    console.log("\nTest 2: Security Headers");
    try {
        const res = await fetch(API_URL.replace('/api', '')); // Root
        const headers = res.headers;
        // Check for common helmet headers
        if (headers.get('x-dns-prefetch-control') && headers.get('x-frame-options')) {
            console.log(" PASS: Security headers found.");
        } else {
            console.log(" FAIL: Security headers missing.");
            console.log(" Headers:", headers);
            failure = true; // Not strictly a hard failure for functionality, but for security audit yes.
        }
    } catch (e) { console.error(e); }

    // 3. Test Rate Limiting
    // We configured 10 requests / 15 mins for login. Let's try to hit it 11 times.
    console.log("\nTest 3: Rate Limiting (Login)");
    try {
        for (let i = 0; i < 12; i++) {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contact: 'fake', password: 'fake' })
            });
            process.stdout.write(`Req ${i + 1}: ${res.status}  `);
            if (i >= 10 && res.status === 429) {
                console.log("\n PASS: 429 Too Many Requests received.");
                return;
            }
        }
        console.log("\n FAIL: Rate limit did not trigger after 11 requests.");
        failure = true;
    } catch (e) { console.error(e); }

    // 4. Test POST Whitelist
    console.log("\nTest 4: POST Content Whitelist");
    try {
        // Try to create a 'users' content via POST (should be forbidden)
        // Login as admin first (simulated token use) - Wait, we need a token.
        // For this test, we accept 401 or 400/403.
        // Only admin can post, so 401 is good. If we had token, 400 is better.
        const res = await fetch(`${API_URL}/content/users`, { method: 'POST' });
        if (res.status === 401 || res.status === 403 || res.status === 400) {
            console.log(` PASS: POST /content/users blocked with ${res.status}`);
        } else {
            console.log(` FAIL: POST /content/users allowed? Status: ${res.status}`);
            failure = true;
        }
    } catch (e) { console.error(e); }

    // 5. Test Market API Filtering
    console.log("\nTest 5: Market Public Filter");
    try {
        const res = await fetch(`${API_URL}/market`);
        const items = await res.json();
        // Should only see approved
        const illegalItems = items.filter(i => i.status !== 'approved');
        if (illegalItems.length === 0) {
            console.log(" PASS: Public market only shows approved items.");
        } else {
            console.log(` FAIL: Public market shows pending items! Count: ${illegalItems.length}`);
            failure = true;
        }
    } catch (e) { console.error(e); }

    if (failure) {
        console.log("\nRESULT: SOME TESTS FAILED.");
        process.exit(1);
    } else {
        console.log("\nRESULT: ALL SECURE.");
    }
}

testSecurity();
