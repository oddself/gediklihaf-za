const http = require('http');

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
            console.log(`Status: ${res.statusCode}`);
            console.log(`Body: ${body}`);
        });
    });

    req.write(JSON.stringify(data));
    req.end();
}

console.log("Testing Login for 'browser_final_fix'...");
post('/api/login', {
    contact: 'browser_final_fix',
    password: 'Pass123!'
});
