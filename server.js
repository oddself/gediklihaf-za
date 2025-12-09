const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');
const SECRET_KEY = process.env.JWT_SECRET || 'gedikli_secret_key_change_me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gedikli32'; // Default fallback

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper: Read DB
const readDb = () => {
    try {
        if (!fs.existsSync(DB_FILE)) return { users: [], market: [], announcements: [] };
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
        console.error("DB Read Error:", err);
        return { users: [], market: [] };
    }
};

// Helper: Write DB
const writeDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Oturum açmanız gerekiyor.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Geçersiz oturum.' });
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok.' });
    }
};

// --- ROUTES ---

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    const { name, contact, password } = req.body;
    if (!name || !contact || !password) return res.status(400).json({ success: false, message: 'Eksik bilgi.' });

    const db = readDb();
    if (!db.users) db.users = [];

    // Check existing
    if (db.users.find(u => u.contact === contact)) {
        return res.status(400).json({ success: false, message: 'Kullanıcı zaten kayıtlı.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
        id: Date.now(),
        name,
        contact,
        password: hashedPassword,
        role: 'user',
        joinedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    res.json({ success: true, message: 'Kayıt başarılı.' });
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    const { contact, password } = req.body;

    // Admin Check
    if (!contact && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin', name: 'Yönetici' }, SECRET_KEY, { expiresIn: '2h' });
        return res.json({ success: true, token, user: 'Yönetici', role: 'admin' });
    }

    const db = readDb();
    const user = db.users?.find(u => u.contact === contact);

    if (!user) return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı.' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).json({ success: false, message: 'Hatalı şifre.' });

    const token = jwt.sign({ id: user.id, role: user.role, contact: user.contact }, SECRET_KEY, { expiresIn: '24h' });

    res.json({
        success: true,
        token,
        user: user.contact,
        fullName: user.name,
        role: user.role
    });
});

// 3. CHANGE PASSWORD
app.post('/api/change-password', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const db = readDb();

    // Admin Master Key Protection
    if (req.user.role === 'admin') {
        return res.status(403).json({ success: false, message: 'Ana yönetici şifresi buradan değiştirilemez.' });
    }

    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });

    const user = db.users[userIndex];
    const validPass = await bcrypt.compare(oldPassword, user.password);
    if (!validPass) return res.status(400).json({ success: false, message: 'Eski şifre hatalı.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    writeDb(db);
    res.json({ success: true, message: 'Şifre güncellendi.' });
});

// 4. GENERIC PUBLIC READ
app.get('/api/content/:type', (req, res) => {
    const db = readDb();
    res.json(db[req.params.type] || []);
});

app.get('/api/announcements', (req, res) => {
    const db = readDb();
    res.json(db.announcements || []);
});

app.get('/api/market', (req, res) => {
    const db = readDb();
    // In a real scenario, filter 'approved' for public here.
    // For now, we send all and let frontend decide UI, but usually backend shd filter.
    res.json(db.market || []);
});

// 5. PROTECTED WRITES (Admin Only)
app.post('/api/announcements', authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();
    db.announcements = req.body.announcements;
    writeDb(db);
    res.json({ success: true });
});

app.post('/api/content/:type', authenticateToken, requireAdmin, (req, res) => {
    const { type } = req.params;
    const db = readDb();
    if (!db[type]) db[type] = [];

    const newItem = { id: Date.now(), ...req.body };
    db[type].push(newItem);
    writeDb(db);
    res.json({ success: true, item: newItem });
});

app.delete('/api/content/:type/:id', authenticateToken, (req, res) => {
    // Both Admin and Owner (for market) can delete.
    const { type, id } = req.params;
    const db = readDb();

    if (!db[type]) return res.status(404).json({ success: false });

    // Find item
    const item = db[type].find(i => i.id == id);
    if (!item) return res.status(404).json({ success: false, message: 'Bulunamadı.' });

    // Authz Logic
    if (req.user.role !== 'admin') {
        // If not admin, must be owner AND it must be a market item (others are admin-only content)
        if (type !== 'market') return res.status(403).json({ success: false });
        if (item.owner !== req.user.contact) return res.status(403).json({ success: false });
    }

    db[type] = db[type].filter(i => i.id != id);
    writeDb(db);
    res.json({ success: true });
});

// 6. MARKET (Public Post, Admin Approve)
app.post('/api/market', authenticateToken, (req, res) => {
    const db = readDb();
    if (!db.market) db.market = [];

    const isAutoApprove = req.user.role === 'admin';
    const status = isAutoApprove ? 'approved' : 'pending';

    const newItem = {
        id: Date.now(),
        ...req.body,
        status,
        owner: req.user.contact, // Enforce server-side owner from token
        image: req.body.image || 'images/default_market.jpg'
    };

    // Security: Prevent user from sending manipulated 'status' or 'role'
    delete newItem.role;

    db.market.push(newItem);
    writeDb(db);

    res.json({
        success: true,
        message: isAutoApprove ? 'İlan yayınlandı.' : 'Onay bekleniyor.'
    });
});

app.post('/api/market/approve/:id', authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();
    const item = db.market?.find(i => i.id == req.params.id);
    if (!item) return res.status(404).json({ success: false });

    item.status = 'approved';
    writeDb(db);
    res.json({ success: true });
});

// 7. SUPPORT TICKETS
// 7. SUPPORT TICKETS REST API
app.get('/api/tickets', authenticateToken, (req, res) => {
    const db = readDb();
    const { userId, role } = req.query;

    if (!db.tickets) db.tickets = [];

    // Admin sees all, User sees own
    if (role === 'admin' && req.user.role === 'admin') {
        return res.json(db.tickets);
    }

    if (userId) {
        // Strict check: you can only see tickets if you OWN them or are ADMIN
        if (req.user.contact !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
        }
        const userTickets = db.tickets.filter(t => t.userId === userId);
        return res.json(userTickets);
    }

    return res.json([]);
});

app.post('/api/tickets', authenticateToken, (req, res) => {
    const db = readDb();
    if (!db.tickets) db.tickets = [];

    const newTicket = {
        id: Date.now().toString(),
        status: 'pending', // pending | resolved
        date: new Date().toLocaleDateString('tr-TR'),
        ...req.body,
        adminResponse: null
    };

    db.tickets.push(newTicket);
    writeDb(db);

    res.json({ success: true, ticket: newTicket });
});

app.put('/api/tickets/:id/respond', authenticateToken, requireAdmin, (req, res) => {
    const db = readDb();
    if (!db.tickets) return res.status(404).json({ success: false });

    const ticket = db.tickets.find(t => t.id === req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Talep bulunamadı.' });

    ticket.adminResponse = req.body.response;
    ticket.status = 'resolved';

    writeDb(db);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Create DB if not exists
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], market: [], announcements: [] }));
    }
});
