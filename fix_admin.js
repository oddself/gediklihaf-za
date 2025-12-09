const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'db.json');

async function run() {
    console.log("Reading DB...");
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const db = JSON.parse(data);

        if (!db.users) db.users = [];

        const existingAdmin = db.users.find(u => u.role === 'admin');
        if (existingAdmin) {
            console.log("Admin already exists:", existingAdmin.contact);
            return;
        }

        console.log("Creating new admin...");
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("Admin123!", salt);

        const admin = {
            id: Date.now(),
            name: "Yönetici",
            contact: "admin",
            password: hash,
            role: "admin",
            joinedAt: new Date().toISOString()
        };

        db.users.push(admin);
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        console.log("SUCCESS: Admin 'admin' created with password 'Admin123!'");
    } catch (e) {
        console.error("ERROR:", e);
    }
}

run();
