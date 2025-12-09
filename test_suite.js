const http = require('http');

let adminToken = null;
let userToken = null;

function runTest(name, options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    console.log(`[TEST] ${name}: Status ${res.statusCode} - Success: ${json.success}`);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    console.log(`[TEST] ${name}: Status ${res.statusCode}`);
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => {
            console.error(`[TEST] ${name} FAILED: ${e.message}`);
            resolve({ error: e });
        });

        if (postData) req.write(JSON.stringify(postData));
        req.end();
    });
}

async function runAllTests() {
    console.log("--- STARTING SECURITY & FUNCTION TESTS ---");

    // 1. Initial Data (Public)
    await runTest('Get Announcements', {
        hostname: 'localhost', port: 3000, path: '/api/announcements', method: 'GET'
    });

    // 2. Register New User
    const uniqueUser = `test_secure_${Date.now()}@example.com`;
    await runTest('Register User', {
        hostname: 'localhost', port: 3000, path: '/api/register', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { name: "Secure Tester", contact: uniqueUser, password: "SecurePassword123!" });

    // 3. User Login
    const loginRes = await runTest('Login User', {
        hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { contact: uniqueUser, password: "SecurePassword123!" });

    if (loginRes.body.token) {
        userToken = loginRes.body.token;
        console.log(">> GOT USER TOKEN");
    }

    // 4. Admin Login
    const adminRes = await runTest('Login Admin', {
        hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { password: "gedikli32" });

    if (adminRes.body.token) {
        adminToken = adminRes.body.token;
        console.log(">> GOT ADMIN TOKEN");
    }

    // 5. Protected Route (Unauthorized Access Attempt)
    await runTest('Unauthorized Content Post', {
        hostname: 'localhost', port: 3000, path: '/api/content/genealogy', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { title: "Hacker Item" }).then(res => {
        if (res.status === 401 || res.status === 403) console.log(">> PASSED: Access Denied as expected.");
        else console.error(">> FAILED: Unauthorized access allowed!");
    });

    // 6. Protected Route (Authorized Admin Access)
    if (adminToken) {
        await runTest('Admin Content Post', {
            hostname: 'localhost', port: 3000, path: '/api/content/genealogy', method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        }, { title: "Admin Item 123" });
    }

    // 7. Market Post (Authenticated User)
    if (userToken) {
        await runTest('User Market Post', {
            hostname: 'localhost', port: 3000, path: '/api/market', method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            }
        }, { title: "Test Product", price: "50" });
    }

    console.log("--- TESTS COMPLETED ---");
}

runAllTests();
