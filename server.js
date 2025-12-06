const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files

// Ensure DB file exists
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        users: [],
        market: [],
        announcements: ["Sitemize Hoş Geldiniz!", "Köy Pazarı açılmıştır."]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Helper to read DB
const readDb = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Database read error:", err);
        return { users: [], market: [], announcements: [] };
    }
};

// Helper to write DB
const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Database write error:", err);
    }
};

// --- ROUTES ---

// Login API
app.post('/api/login', (req, res) => {
    const { password, contact } = req.body;
    console.log(`Login Attempt: ${contact || 'Admin Check'} - Pwd: ${password}`);

    // Admin Master Key
    if (password === 'gedikli32') {
        return res.json({ success: true, token: 'admin_token', user: 'Köy Sakini (Yönetici)', role: 'admin' });
    }

    const db = readDb();
    const validUser = db.users?.find(u => {
        if (contact && u.contact !== contact) return false;
        return u.password === password;
    });

    if (validUser) {
        res.json({
            success: true,
            token: `user_${validUser.id}`,
            user: validUser.contact,
            fullName: validUser.name || validUser.contact,
            role: 'user'
        });
    } else {
        res.status(401).json({ success: false, message: 'Hatalı şifre veya kullanıcı bulunamadı.' });
    }
});

app.post('/api/register', (req, res) => {
    const { contact, password, name } = req.body;
    if (!contact || !password || !name) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi. Lütfen Ad Soyad dahil tüm alanları doldurun.' });
    }

    const db = readDb();
    if (!db.users) db.users = [];

    if (db.users.find(u => u.contact === contact)) {
        return res.status(400).json({ success: false, message: 'Bu kullanıcı zaten kayıtlı.' });
    }

    const newUser = {
        id: Date.now(),
        name,
        contact,
        password,
        role: 'user',
        joinedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    console.log("New User Registered:", name);
    res.json({ success: true, message: 'Kayıt başarılı! Giriş yapabilirsiniz.' });
});

app.post('/api/change-password', (req, res) => {
    const { contact, oldPassword, newPassword } = req.body;

    // Admin check
    if (contact === 'admin' || contact === 'Köy Sakini (Yönetici)') {
        if (oldPassword === 'gedikli32') {
            // Admin master key cannot be changed via this UI for safety in this demo, 
            // but let's simulate success or return error.
            return res.status(403).json({ success: false, message: 'Ana yönetici şifresi buradan değiştirilemez.' });
        }
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.contact === contact);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    if (db.users[userIndex].password !== oldPassword) {
        return res.status(400).json({ success: false, message: 'Eski şifre hatalı.' });
    }

    db.users[userIndex].password = newPassword;
    writeDb(db);

    res.json({ success: true, message: 'Şifreniz başarıyla değiştirildi.' });
});

// --- GENERIC CONTENT API (Genealogy, Gallery, Deceased, etc.) ---
app.get('/api/content/:type', (req, res) => {
    const { type } = req.params;
    const db = readDb();
    res.json(db[type] || []);
});

app.post('/api/content/:type', (req, res) => {
    const { type } = req.params;
    // In real app, verify Admin Token here
    const db = readDb();
    if (!db[type]) db[type] = [];

    const newItem = {
        id: Date.now(),
        ...req.body
    };

    db[type].push(newItem);
    writeDb(db);
    res.json({ success: true, item: newItem });
});

app.delete('/api/content/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const db = readDb();

    if (!db[type]) return res.status(404).json({ success: false });

    // Filter out the item (handling string/number id mismatch possibilities)
    const initialLength = db[type].length;
    db[type] = db[type].filter(item => item.id != id);

    if (db[type].length < initialLength) {
        writeDb(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Item not found' });
    }
});

// --- SPECIAL TYPES ---

// Get Announcements (Aliases to generic content 'announcements')
app.get('/api/announcements', (req, res) => {
    const db = readDb();
    res.json(db.announcements || []);
});

app.post('/api/announcements', (req, res) => {
    const { announcements } = req.body;
    if (!Array.isArray(announcements)) {
        return res.status(400).json({ success: false, message: 'Geçersiz format.' });
    }

    const db = readDb();
    db.announcements = announcements;
    writeDb(db);
    res.json({ success: true, message: 'Duyurular güncellendi.' });
});

// Market API (Complex Logic)
app.get('/api/market', (req, res) => {
    const db = readDb();
    // Return all items, frontend filters visible ones based on role if needed, 
    // but usually public sees only approved.
    // For simplicity, we send all, frontend filters.
    res.json(db.market || []);
});

app.post('/api/market', (req, res) => {
    const { role } = req.body; // Expecting role to be sent in body for now
    const db = readDb();
    if (!db.market) db.market = [];

    const status = (role === 'admin') ? 'approved' : 'pending';

    const newItem = {
        id: Date.now(),
        ...req.body,
        status: status,
        image: req.body.image || 'images/default_market.jpg'
    };

    // Remove role from saved object
    delete newItem.role;

    db.market.push(newItem);
    writeDb(db);

    const msg = (status === 'approved')
        ? 'İlanınız yayınlandı.'
        : 'İlan talebiniz alındı. Yönetici onayından sonra yayınlanacaktır.';

    res.json({ success: true, item: newItem, message: msg });
});

app.post('/api/market/approve/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const item = db.market?.find(i => i.id == id);

    if (item) {
        item.status = 'approved';
        writeDb(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

app.delete('/api/market/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const initialLength = db.market?.length || 0;

    if (db.market) {
        db.market = db.market.filter(i => i.id != id);
        if (db.market.length < initialLength) {
            writeDb(db);
            return res.json({ success: true });
        }
    }
    res.status(404).json({ success: false });
});

// Support Ticket
app.post('/api/support', (req, res) => {
    const db = readDb();
    if (!db.supportTickets) db.supportTickets = [];

    const ticket = {
        id: `GDK-2025-${Math.floor(Math.random() * 1000)}`,
        date: new Date().toISOString(),
        ...req.body
    };

    db.supportTickets.push(ticket);
    writeDb(db);

    console.log("New Support Ticket:", ticket.id);
    res.json({ success: true, ticketBox: ticket.id });
});

// Settings (Weather, etc.)
app.post('/api/settings', (req, res) => {
    const db = readDb();
    db.settings = { ...db.settings, ...req.body };
    writeDb(db);
    res.json({ success: true });
});

// Start Server
// --- SUPPORT TICKET ENDPOINTS ---

// GET Tickets (Admin sees all, User sees own)
app.get('/api/tickets', (req, res) => {
    const userRole = req.query.role;
    const userId = req.query.userId;
    const db = readDb();

    if (userRole === 'admin') {
        res.json(db.tickets || []);
    } else {
        const userTickets = (db.tickets || []).filter(t => t.userId === userId);
        res.json(userTickets);
    }
});

// POST New Ticket
app.post('/api/tickets', (req, res) => {
    const db = readDb();
    const newTicket = {
        id: Date.now().toString(),
        status: 'pending',
        date: new Date().toLocaleDateString('tr-TR'),
        ...req.body
    };

    if (!db.tickets) db.tickets = [];
    db.tickets.push(newTicket);
    writeDb(db);
    res.json({ success: true, message: 'Talep oluşturuldu' });
});

// PUT Respond to Ticket (Admin)
app.put('/api/tickets/:id/respond', (req, res) => {
    console.log(` responding to ticket ${req.params.id} with`, req.body);
    const db = readDb();
    if (!db.tickets) db.tickets = [];

    const index = db.tickets.findIndex(t => t.id == req.params.id); // Loose equality
    if (index !== -1) {
        db.tickets[index].status = 'resolved';
        db.tickets[index].adminResponse = req.body.response;
        writeDb(db);
        console.log("Response written to DB");
        res.json({ success: true, message: 'Yanıt gönderildi' });
    } else {
        console.log("Ticket not found:", req.params.id);
        res.status(404).json({ success: false, message: 'Ticket bulunamadı' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`API Ready.`);
});
