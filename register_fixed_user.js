const http = require('http');

const userData = {
    name: "Fixed Browser User",
    contact: "fixed_test_user",
    password: "FixedPass123!"
};

function post(path, data) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(data))
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log(`Registered: ${res.statusCode}`);
            console.log(body);
        });
    });

    req.write(JSON.stringify(data));
    req.end();
}

post('/api/register', userData);
