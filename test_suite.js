const http = require('http');

function runTest(name, options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    console.log(`[TEST] ${name}: Status ${res.statusCode}`);
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
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
    console.log("--- STARTING TESTS ---");

    // 1. GET Announcements
    await runTest('Get Announcements', {
        hostname: 'localhost', port: 3000, path: '/api/announcements', method: 'GET'
    });

    // 2. Register New User
    const uniqueUser = `test${Date.now()}@example.com`;
    await runTest('Register User', {
        hostname: 'localhost', port: 3000, path: '/api/register', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { name: "Tester", contact: uniqueUser, password: "123" });

    // 3. Login Valid
    await runTest('Login User', {
        hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { contact: uniqueUser, password: "123" });

    // 4. Admin Login
    await runTest('Login Admin', {
        hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { password: "gedikli32" });

    // 5. Submit Support
    await runTest('Submit Ticket', {
        hostname: 'localhost', port: 3000, path: '/api/support', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { type: 'Test', message: 'Hello' });

    console.log("--- TESTS COMPLETED ---");
}

runAllTests();
