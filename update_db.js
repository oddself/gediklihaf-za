const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');
const INITIAL_STRUCTURE = {
    users: [],
    market: [],
    announcements: ["Sitemize Hoş Geldiniz!", "Köy Pazarı açılmıştır.", "Haftalık duyurular buraya eklenecek."],
    genealogy: [
        { id: 1, title: "Hacıalar Sülalesi", detail: "Kökler ve Aile Büyükleri" },
        { id: 2, title: "Mollaoğulları", detail: "Aile Şeması" }
    ],
    gallery: [
        { id: 1, src: "images/IMG20200801170110.jpg" },
        { id: 2, src: "images/IMG20220712202035.jpg" },
        { id: 3, src: "images/IMG20200807185200.jpg" }
    ],
    documents: [
        { id: 1, title: "1937 Köy Yerleşim Planı", date: "1937" }
    ],
    deceased: [
        { id: 1, name: "Mehmet Yılmaz", date: "2024" }
    ],
    settings: {
        weatherCity: "Isparta/Gedikli",
        streamStatus: { 1: false, 2: false, 3: false }
    },
    supportTickets: []
};

// Update existing items to have 'status' if market items exist
function migrateMarketItems(items) {
    return items.map(item => ({
        ...item,
        status: item.status || 'approved' // Legacy items are approved
    }));
}

// Migrate/Init
try {
    let db = {};
    if (fs.existsSync(DB_FILE)) {
        console.log("Reading existing DB...");
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } else {
        console.log("Creating new DB...");
    }

    // Merge structure
    // We want to keep existing data but add missing keys
    // And specially handle market items migration

    // 1. Ensure keys exist
    for (const key in INITIAL_STRUCTURE) {
        if (!db[key]) {
            console.log(`Adding missing key: ${key}`);
            db[key] = INITIAL_STRUCTURE[key];
        }
    }

    // 2. Migrate Market Items
    if (db.market && db.market.length > 0) {
        db.market = migrateMarketItems(db.market);
        console.log("Migrated market items status.");
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    console.log("Database updated successfully.");

} catch (e) {
    console.error("Migration failed:", e);
}
