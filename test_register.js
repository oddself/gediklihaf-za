// using native http module
// Standard node https request or just assume fetch is available in newer node (v18+).
// Since user environment is Windows, likely newer Node. If not, I'll use http module.

const http = require('http');

const data = JSON.stringify({
    name: "Test User",
    contact: "test@example.com",
    password: "password123"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
