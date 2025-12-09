const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'db.json');

const migrate = async () => {
    if (!fs.existsSync(DB_FILE)) {
        console.log("DB file not found.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    let changed = false;

    if (data.users && data.users.length > 0) {
        console.log(`Found ${data.users.length} users. Checking for plaintext passwords...`);

        for (let user of data.users) {
            // Check if password looks like a bcrypt hash (starts with $2a$ or $2b$ and len 60)
            if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
                console.log(`Hashing password for user: ${user.name}`);
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
                changed = true;
            }
        }
    }

    if (changed) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        console.log("Migration complete: All passwords hashed.");
    } else {
        console.log("No plaintext passwords found or migration already done.");
    }
};

migrate();
