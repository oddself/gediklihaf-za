// --- YAPILANDIRMA ---
const protectedSections = ['genealogy', 'guide', 'cameras', 'memorial'];
// Relative path for web, full URL for local file testing
const API_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost')
    ? 'http://localhost:3000/api'
    : '/api';

// --- AUTH HELPER ---
async function authenticatedFetch(url, options = {}) {
    const token = safeStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401 || response.status === 403) {
        // Optional: Logout if token is invalid
        // safeStorage.clear();
        // createToast('Oturum süresi doldu.', 'error');
    }

    return response;
}

// --- WEATHER & PRAYER API INTEGRATION ---
async function fetchWeatherData() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.89&longitude=31.33&current=temperature_2m,weather_code&timezone=auto');
        const data = await res.json();
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;

        const weatherMap = {
            0: "Açık", 1: "Az Bulutlu", 2: "Parçalı Bulutlu", 3: "Kapalı",
            45: "Sisli", 48: "Kırağı", 51: "Hafif Çiseleme", 53: "Çiseleme", 55: "Yoğun Çiseleme",
            61: "Hafif Yağmur", 63: "Yağmur", 65: "Şiddetli Yağmur", 71: "Hafif Kar", 73: "Kar", 75: "Yoğun Kar",
            80: "Sağanak", 81: "Şiddetli Sağanak", 82: "Çok Şiddetli Sağanak", 95: "Fırtına", 96: "Dolu", 99: "Şiddetli Dolu"
        };
        const desc = weatherMap[code] || "Belirsiz";

        const widget = document.getElementById('weather-widget-content');
        if (widget) {
            widget.innerHTML = `<h4>Isparta/Gedikli</h4><span>${temp}°C - ${desc}</span>`;
        }
    } catch (err) {
        console.error("Hava durumu alınamadı:", err);
    }
}

async function fetchPrayerTimes() {
    try {
        const res = await fetch('http://api.aladhan.com/v1/timings?latitude=37.89&longitude=31.33&method=13'); // Method 13: Diyanet
        const data = await res.json();
        const timings = data.data.timings;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const prayerMap = [
            { name: "İmsak", time: timings.Fajr },
            { name: "Güneş", time: timings.Sunrise },
            { name: "Öğle", time: timings.Dhuhr },
            { name: "İkindi", time: timings.Asr },
            { name: "Akşam", time: timings.Maghrib },
            { name: "Yatsı", time: timings.Isha }
        ];

        let nextPrayer = null;
        for (let p of prayerMap) {
            const [h, m] = p.time.split(':').map(Number);
            const pTime = h * 60 + m;
            if (pTime > currentTime) {
                nextPrayer = p;
                break;
            }
        }

        if (!nextPrayer) nextPrayer = prayerMap[0]; // Next day Fajr

        const widget = document.getElementById('prayer-widget-content');
        if (widget) {
            widget.innerHTML = `<h4>Sıradaki Ezan</h4><span>${nextPrayer.name}: ${nextPrayer.time}</span>`;
        }
    } catch (err) {
        console.error("Namaz vakitleri alınamadı:", err);
    }
}

// Auto-refresh every 10 mins and on load
setInterval(() => {
    fetchWeatherData();
    fetchPrayerTimes();
}, 600000);

document.addEventListener('DOMContentLoaded', () => {
    fetchWeatherData();
    fetchPrayerTimes();
});
// ----------------------------------------

// --- GÜVENLİ DEPOLAMA YARDIMCISI ---
const safeStorage = {
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) { return null; }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) { console.warn('Storage error', e); }
    },
    clear: () => {
        try { localStorage.clear(); } catch (e) { }
    }
};

// --- XSS PROTECTION ---
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- BİLDİRİM SİSTEMİ (CUSTOM TOAST) ---
function showToast(message, type = 'success') {
    // Create toast container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 3000;
            display: flex; flex-direction: column; gap: 10px;
        `;
        document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement('div');
    const color = type === 'success' ? '#2E7D32' : '#e74c3c';
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';

    toast.style.cssText = `
        background: white; border-left: 5px solid ${color};
        padding: 15px 20px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex; align-items: center; gap: 10px; font-weight: 500;
        animation: slideIn 0.3s; min-width: 250px;
    `;

    toast.innerHTML = `<i class="fas fa-${icon}" style="color:${color}; font-size: 1.2rem;"></i> ${escapeHtml(message)}`;

    container.appendChild(toast);

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS keyframe for toast
const style = document.createElement('style');
style.innerHTML = `@keyframes slideIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }`;
document.head.appendChild(style);


// --- SAYFA YÖNETİMİ ---
window.siteData = { market: [], genealogy: [], documents: [], deceased: [] }; // Cache

function initApp() {
    console.log("Uygulama başlatılıyor...");

    // Auth Check for Login Page
    if (window.location.href.includes('login.html')) {
        return;
    }

    // Load Data
    fetchAnnouncements();
    updateUserStatus();
    loadMarketItems();

    // Dynamic Content Loading
    loadContent('genealogy');
    loadContent('gallery');
    loadContent('documents');
    loadContent('deceased');

    initObserver();

    // Start Camera Simulation
    setInterval(simulateCameras, 5000);
    simulateCameras(); // initial run
}

// --- PASSWORD CHANGE START ---
window.openChangePasswordModal = function () {
    closeModal('profileModal'); // Close profile first
    document.getElementById('changePasswordForm').reset();
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        modal.classList.add('active');
    } else {
        console.error("Change password modal not found");
    }
};

window.handleChangePasswordSubmit = async function (e) {
    e.preventDefault();
    const oldPass = document.getElementById('cp-old').value;
    const newPass = document.getElementById('cp-new').value;
    const confirmPass = document.getElementById('cp-confirm').value;

    if (newPass !== confirmPass) {
        showToast('Yeni şifreler eşleşmiyor.', 'error');
        return;
    }

    if (newPass.length < 4) {
        showToast('Şifre en az 4 karakter olmalı.', 'error');
        return;
    }

    const contact = safeStorage.getItem('userContact');
    if (!contact) {
        showToast('Oturum hatası. Lütfen tekrar giriş yapın.', 'error');
        return;
    }

    try {
        const res = await authenticatedFetch(`${API_URL}/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact, oldPassword: oldPass, newPassword: newPass })
        });

        const data = await res.json();

        if (data.success) {
            showToast(data.message);
            closeModal('change-password-modal');
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Sunucu hatası.', 'error');
    }
};
// --- PASSWORD CHANGE END ---

function initObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.market-card, .stat-card, .hero-card').forEach(el => observer.observe(el));
}

// --- PERMISSION HELPERS ---
function isAdmin() {
    return safeStorage.getItem("userRole") === 'admin';
}

function checkAdminControls() {
    if (isAdmin()) {
        document.querySelectorAll('.btn-add-admin').forEach(el => el.style.display = 'inline-block');
        document.querySelectorAll('.support-tab.admin-only').forEach(el => el.style.display = 'inline-block');
        const editBtn = document.getElementById('btn-edit-announcements');
        if (editBtn) editBtn.style.display = 'inline-block';
    }
}

// --- DUYURU YÖNETİMİ ---
window.openAnnouncementModal = async function () {
    try {
        const res = await authenticatedFetch(`${API_URL}/announcements`);
        const data = await res.json();

        const container = document.getElementById('announcement-list-container');
        container.innerHTML = '';

        if (data.length === 0) {
            addAnnouncementInput('');
        } else {
            data.forEach(text => addAnnouncementInput(text));
        }

        document.getElementById('admin-announcement-modal').classList.add('active');
    } catch (err) {
        console.error(err);
        showToast('Duyurular yüklenemedi', 'error');
    }
};

window.addAnnouncementInput = function (value = '') {
    const container = document.getElementById('announcement-list-container');
    const div = document.createElement('div');
    div.className = 'announcement-input-row';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';

    div.innerHTML = `
        <input type="text" value="${value}" class="ann-input" style="flex:1; padding:8px; border:1px solid #ddd; border-radius:4px;" placeholder="Duyuru metni..." required>
        <button type="button" onclick="this.parentElement.remove()" style="background:#e74c3c; color:white; border:none; width:30px; border-radius:4px; cursor:pointer;">&times;</button>
    `;
    container.appendChild(div);
};

window.handleAnnouncementSubmit = async function (e) {
    e.preventDefault();
    const inputs = document.querySelectorAll('.ann-input');
    const announcements = Array.from(inputs).map(i => i.value).filter(v => v.trim() !== '');

    try {
        await authenticatedFetch(`${API_URL}/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ announcements })
        });

        showToast('Duyurular Güncellendi');
        window.closeModal('admin-announcement-modal');
        fetchAnnouncements(); // Refresh slider & modal
    } catch (err) {
        console.error(err);
        showToast('Hata oluştu', 'error');
    }
};
// -----------------------

// --- DYNAMIC CONTENT MANAGER ---
async function loadContent(type) {
    try {
        const res = await authenticatedFetch(`${API_URL}/content/${type}`);
        const data = await res.json();

        // Cache data
        window.siteData[type] = data;

        renderContent(type, data);
    } catch (err) {
        console.error(`Error loading ${type}:`, err);
    }
}

function renderContent(type, items) {
    let containerId = '';

    switch (type) {
        case 'genealogy': containerId = 'genealogy-container'; break;
        case 'gallery': containerId = 'gallery-container'; break;
        case 'documents': containerId = 'documents-container'; break;
        case 'deceased': containerId = 'deceased-container'; break;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<p class="empty-state">Henüz içerik eklenmemiş.</p>';
        return;
    }

    container.innerHTML = items.map(item => createItemHTML(type, item)).join('');

    // Re-check admin controls to show Add buttons (global check)
    checkAdminControls();
}

function createItemHTML(type, item) {
    const adminControls = isAdmin() ? `
        <button onclick="deleteItem('${type}', ${item.id})" class="btn-delete-mini" title="Sil"><i class="fas fa-trash"></i></button>
    ` : '';

    switch (type) {
        case 'genealogy':
            return `
            <div class="family-card" style="position:relative;">
                ${adminControls}
                <div class="avatar">${escapeHtml(item.title).charAt(0)}</div>
                <div class="details">
                    <h4>${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.detail || '')}</p>
                </div>
            </div>`;
        case 'gallery':
            return `
            <div class="gallery-item-wrap" onclick="openLightbox('${item.src || item.image}')">
                ${adminControls}
                <img src="${item.src || item.image}" alt="Galeri">
            </div>`;
        case 'documents':
            return `
            <div class="doc-item" style="position:relative;">
                ${adminControls}
                <h4>${escapeHtml(item.title)}</h4>
                <p>${escapeHtml(item.date || '')}</p>
            </div>`;
        case 'deceased':
            return `
            <div class="memorial-item" style="position:relative;">
                ${adminControls}
                <div class="date">${escapeHtml(item.date)}</div>
                <div class="person">
                    <h4>${escapeHtml(item.name || item.title)}</h4>
                </div>
            </div>`;
        default: return '';
    }
}

// --- ADMIN ACTIONS ---
window.openAdminModal = function (type) {
    document.getElementById('admin-modal').classList.add('active');
    document.getElementById('adminContentType').value = type;

    // Update labels based on type
    const titleLbl = document.querySelector('#field-title label');
    const detailLbl = document.querySelector('#field-detail label');

    document.getElementById('acTitle').value = '';
    document.getElementById('acDetail').value = '';
    document.getElementById('acDate').value = '';

    if (type === 'gallery') {
        document.getElementById('field-detail').style.display = 'none';
        document.getElementById('field-date').style.display = 'none';
        titleLbl.innerText = "Başlık (Opsiyonel)";
    } else if (type === 'deceased') {
        titleLbl.innerText = "Ad Soyad";
        document.getElementById('field-date').querySelector('label').innerText = "Vefat Yılı";
    } else {
        document.getElementById('field-detail').style.display = 'block';
        document.getElementById('field-date').style.display = 'block';
        titleLbl.innerText = "Başlık";
    }
}

window.handleAdminSubmit = async function (e) {
    e.preventDefault();
    const type = document.getElementById('adminContentType').value;

    const payload = {
        title: document.getElementById('acTitle').value,
        detail: document.getElementById('acDetail').value,
        date: document.getElementById('acDate').value,
        image: document.getElementById('acImage').value,
        src: document.getElementById('acImage').value, // for gallery
        name: document.getElementById('acTitle').value // for deceased
    };

    try {
        const res = await authenticatedFetch(`${API_URL}/content/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('İçerik Eklendi');
            window.closeModal('admin-modal');
            loadContent(type);
        }
    } catch (err) {
        showToast('Hata oluştu', 'error');
    }
}

window.deleteItem = async function (type, id) {
    if (!confirm('Bu içeriği silmek istediğinize emin misiniz?')) return;

    try {
        // Use generic endpoint which works for market too since it's just a key in db.json
        await authenticatedFetch(`${API_URL}/content/${type}/${id}`, { method: 'DELETE' });
        showToast('İçerik Silindi');

        if (type === 'market') {
            loadMarketItems();
        } else {
            loadContent(type);
        }
    } catch (err) {
        showToast('Silinemedi', 'error');
    }
};

// --- KAMERA SİMÜLASYONU ---
function simulateCameras() {
    const feeds = document.querySelectorAll('.cam-feed');
    if (feeds.length === 0) return;

    feeds.forEach(feed => {
        const statusEl = feed.querySelector('.cam-status');
        const isOnline = Math.random() > 0.3; // 70% chance online

        if (isOnline) {
            statusEl.innerText = "CANLI";
            statusEl.className = "cam-status online";
            statusEl.innerHTML = '<i class="fas fa-circle" style="font-size:8px; animation: blink 1s infinite alternate;"></i> CANLI';
        } else {
            statusEl.innerText = "Sinyal Yok";
            statusEl.className = "cam-status offline";
        }
    });

    // Blink animation
    if (!document.getElementById('anim-blink')) {
        const s = document.createElement('style');
        s.id = 'anim-blink';
        s.innerHTML = `@keyframes blink { from { opacity: 1; } to { opacity: 0.4; } }`;
        document.head.appendChild(s);
    }
}

// --- API ENTEGRASYONLARI ---

// --- DUYURU SİSTEMİ (SLIDER & MODAL) ---
let announcementInterval = null;
let currentAnnouncementIndex = 0;

async function fetchAnnouncements() {
    try {
        const res = await authenticatedFetch(`${API_URL}/announcements?_t=${Date.now()}`);
        const data = await res.json();
        const slider = document.getElementById('announcement-slider');
        const welcomeList = document.getElementById('welcome-list');

        if (data.length > 0) {
            // 1. Populate Welcome Modal
            if (welcomeList) {
                welcomeList.innerHTML = data.map(item =>
                    `<div style="margin-bottom:15px; display:flex; gap:15px; align-items:start;">
                        <i class="fas fa-bullhorn" style="color:var(--primary); margin-top:5px;"></i>
                        <span>${escapeHtml(item)}</span>
                    </div>`
                ).join('');

                checkWelcomeMessage(); // Show modal if first time
            }

            // 2. Start Slider
            if (slider) {
                // Escape messages before passing to slider
                startAnnouncementSlider(slider, data.map(msg => escapeHtml(msg)));
            }
        } else {
            if (slider) slider.innerHTML = 'Aktif duyuru bulunmamaktadır.';
            if (welcomeList) welcomeList.innerHTML = '<p>Şu an yayınlanmış bir duyuru yoktur.</p>';
        }
    } catch (err) {
        console.error("Duyurular yüklenemedi:", err);
    }
}

function startAnnouncementSlider(element, messages) {
    if (announcementInterval) clearInterval(announcementInterval);
    currentAnnouncementIndex = 0;

    // Initial show
    element.style.opacity = 0;
    setTimeout(() => {
        element.innerHTML = messages[0];
        element.style.opacity = 1;
    }, 500);

    if (messages.length > 1) {
        announcementInterval = setInterval(() => {
            currentAnnouncementIndex = (currentAnnouncementIndex + 1) % messages.length;

            // Fade out
            element.style.opacity = 0;

            // Change text and fade in
            setTimeout(() => {
                element.innerHTML = messages[currentAnnouncementIndex];
                element.style.opacity = 1;
            }, 500); // Wait for fade out to finish (0.5s transition in CSS)

        }, 5000); // Change every 5 seconds
    }
}

function checkWelcomeMessage() {
    // Session bazlı kontrol: Tarayıcı kapanana kadar tekrar gösterme
    if (!sessionStorage.getItem('welcomeShown')) {
        setTimeout(() => {
            // Sadece index.html'de (dashboard varsa) çalışsın
            const modal = document.getElementById('welcome-announcement-modal');
            if (modal) {
                modal.classList.add('active');
                sessionStorage.setItem('welcomeShown', 'true');
            }
        }, 1000); // Küçük bir gecikme ile aç
    }
}

async function loadMarketItems() {
    try {
        const res = await authenticatedFetch(`${API_URL}/market`);
        const items = await res.json();

        // Cache for search
        if (window.siteData) window.siteData.market = items;

        renderMarket(items);
    } catch (err) {
        console.error("Market verileri alınamadı:", err);
    }
}

function renderMarket(items) {
    const grid = document.querySelector('.market-grid');
    if (!grid) return;

    // RBAC Filtering
    const currentUser = safeStorage.getItem("userContact"); // or user ID if you prefer

    // RBAC Filtering: 
    // - Admin sees ALL.
    // - Owner sees their own (Pending & Approved).
    // - Public sees only Approved.
    let visibleItems = items;
    if (!isAdmin()) {
        visibleItems = items.filter(i => i.status === 'approved' || i.owner === currentUser);
    }

    if (visibleItems.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Henüz ilan bulunmamaktadır.</p>';
        return;
    }

    grid.innerHTML = visibleItems.map(item => {
        let actionBtn = `<a href="tel:${item.phone}" class="btn-call"><i class="fas fa-phone-alt"></i> Hemen Ara</a>`;
        let statusBadge = '';
        const isOwner = (currentUser && item.owner === currentUser);

        // Status Badge Logic
        if (item.status === 'pending') {
            statusBadge = '<span class="badge" style="background:orange; position:absolute; top:10px; right:10px;">Onay Bekliyor</span>';
        }

        // Action Buttons Logic
        if (isAdmin()) {
            if (item.status === 'pending') {
                actionBtn = `
                    <button onclick="approveMarketItem(${item.id})" class="btn-submit" style="background:#27ae60; width:100%; margin-bottom:5px;">Onayla</button>
                    <button onclick="deleteItem('market', ${item.id})" class="btn-submit" style="background:#c0392b; width:100%;">Sil</button>
                `;
            } else {
                actionBtn = `
                    <button onclick="deleteItem('market', ${item.id})" class="btn-submit" style="background:#c0392b; width:100%;">İlanı Kaldır</button>
                `;
            }
        } else if (isOwner) {
            // User can delete their own item regardless of status
            actionBtn = `
                <button onclick="deleteItem('market', ${item.id})" class="btn-submit" style="background:#c0392b; width:100%;">İlanımı Sil</button>
            `;
        }

        return `
        <div class="market-card" style="position:relative;">
            ${statusBadge}
            <div class="market-img">
                <img src="${item.image || 'images/default_market.jpg'}" alt="${escapeHtml(item.title)}" onerror="this.src='https://via.placeholder.com/400x300?text=Köy+Ürünü'">
                <span class="price-tag">${escapeHtml(item.price)}</span>
            </div>
            <div class="market-info">
                <h4>${escapeHtml(item.title)}</h4>
                <p class="seller"><i class="fas fa-user-circle"></i> ${escapeHtml(item.phone || 'Satıcı')}</p>
                <p class="desc">${escapeHtml(item.desc || '')}</p>
                ${actionBtn}
            </div>
        </div>
    `}).join('');
}

window.handleMarketSubmit = async function (e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById('mTitle').value,
        price: document.getElementById('mPrice').value,
        phone: document.getElementById('mPhone').value,
        desc: document.getElementById('mDesc').value,
        role: isAdmin() ? 'admin' : 'user',
        owner: safeStorage.getItem("userContact") // Add owner info
    };

    try {
        const res = await authenticatedFetch(`${API_URL}/market`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message);
            window.closeModal('modal-ad');
            loadMarketItems(); // Reload for everyone so users see their pending items
        }
    } catch (err) {
        showToast('İlan gönderilemedi', 'error');
    }
}

window.approveMarketItem = async function (id) {
    try {
        await authenticatedFetch(`${API_URL}/market/approve/${id}`, { method: 'POST' });
        showToast('İlan Onaylandı');
        loadMarketItems();
    } catch (err) {
        showToast('Onaylanamadı', 'error');
    }
}

// --- KULLANICI İŞLEMLERİ ---

// (Legacy function removed)

window.handleRegister = async function (e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const contact = document.getElementById('regContact').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    if (!contact || !password || !name) {
        showToast("Lütfen tüm alanları doldurun.", 'error');
        return;
    }

    try {
        const res = await authenticatedFetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, contact, password })
        });

        const data = await res.json();

        if (data.success) {
            showToast(data.message);
            window.showForm('login');
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast("Kayıt işlemi sırasında bir hata oluştu.", 'error');
    }
};

window.handleSupportSubmit = async function (e, type) {
    e.preventDefault();
    const form = e.target;
    // Simple validation
    const inputs = form.querySelectorAll('input, textarea');
    let valid = true;
    inputs.forEach(i => { if (!i.value) valid = false; });

    if (!valid) {
        showToast('Lütfen boş alan bırakmayın.', 'error');
        return;
    }

    try {
        const res = await authenticatedFetch(`${API_URL}/support`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, timestamp: Date.now() })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Talebiniz Alındı! Takip No: #${data.ticketBox}`);
            form.reset();
            window.closeModal('modal-ad'); // Close modal if it was an ad
        }
    } catch (err) {
        showToast("Bir hata oluştu.", 'error');
    }
};

// --- LOGIN UI ACTIONS ---
window.showForm = function (formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const btns = document.querySelectorAll('.toggle-btn');

    if (!loginForm || !registerForm) return;

    if (formType === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        if (btns[0]) btns[0].classList.add('active');
        if (btns[1]) btns[1].classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        if (btns[0]) btns[0].classList.remove('active');
        if (btns[1]) btns[1].classList.add('active');
    }
};

// --- LOGIN UI ACTIONS ---
let isUserLoginMode = true;

window.toggleLoginMode = function () {
    const userFields = document.getElementById('userLoginFields');
    const adminFields = document.getElementById('adminLoginFields');
    const toggleBtn = document.getElementById('toggleLoginModeBtn');
    const userContact = document.getElementById('loginContact');
    const userPass = document.getElementById('loginPassword');
    const adminCode = document.getElementById('adminCode');

    if (isUserLoginMode) {
        // Switch to ADMIN Mode
        userFields.style.display = 'none';
        adminFields.style.display = 'block';
        toggleBtn.innerText = "Kullanıcı Girişi";

        // Disable user inputs so they aren't required
        userContact.disabled = true;
        userPass.disabled = true;
        // Enable admin input
        adminCode.disabled = false;
        adminCode.focus();

        isUserLoginMode = false;
    } else {
        // Switch to USER Mode
        userFields.style.display = 'block';
        adminFields.style.display = 'none';
        toggleBtn.innerText = "Yönetici Girişi";

        // Enable user inputs
        userContact.disabled = false;
        userPass.disabled = false;
        // Disable admin input
        adminCode.disabled = true;
        userContact.focus();
        isUserLoginMode = true;
    }
};

// Clear storage on login load to prevent stale state
if (window.location.href.includes('login.html')) {
    safeStorage.clear();
}

window.handleLogin = async function (e) {
    e.preventDefault();
    console.log("Login submitted...");

    let password, contact;

    if (isUserLoginMode) {
        contact = document.getElementById('loginContact').value.trim();
        password = document.getElementById('loginPassword').value.trim();
        if (!contact || !password) {
            showToast('Lütfen bilgilerinizi giriniz.', 'error');
            return;
        }
    } else {
        // Admin Mode
        password = document.getElementById('adminCode').value.trim();
        contact = null;
        if (!password) {
            showToast('Lütfen yönetici kodunu giriniz.', 'error');
            return;
        }
    }

    try {
        console.log("Fetching login...");
        const res = await authenticatedFetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, contact })
        });

        console.log("Login status:", res.status);
        const data = await res.json();
        console.log("Login response:", data);

        if (data.success) {
            safeStorage.setItem("villageAccess", "Authorized");
            safeStorage.setItem("authToken", data.token); // Store JWT
            safeStorage.setItem("gedikliUser", data.fullName || data.user);
            safeStorage.setItem("userRole", data.role);
            safeStorage.setItem("userContact", data.user);

            showToast(`Giriş Başarılı! Hoş geldiniz, ${data.fullName || ''}`);
            console.log("Redirecting to index.html...");
            setTimeout(() => window.location.href = "index.html", 1000);
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        console.error("Login Error:", err);
        showToast("Sunucu ile bağlantı kurulamadı.", 'error');
    }
};

function updateUserStatus() {
    const access = safeStorage.getItem("villageAccess");
    const role = safeStorage.getItem("userRole");
    const userName = safeStorage.getItem("gedikliUser") || "Köy Sakini";
    const profileArea = document.getElementById('userProfileArea');

    if (access === "Authorized" && profileArea) {
        let roleBadge = '';
        if (role === 'admin') {
            roleBadge = `<span style="color:var(--primary); font-weight:bold;">${userName}</span> <div class="badge" style="background:var(--primary);">YÖNETİCİ</div>`;
        } else {
            roleBadge = `<span style="color:var(--text-main); font-weight:bold;">${userName}</span>`;
        }

        profileArea.innerHTML = `
            <div onclick="openProfileModal()" style="cursor:pointer; display:flex; align-items:center; gap:10px; padding: 5px 10px; background: rgba(0,0,0,0.05); border-radius: 30px;">
                ${roleBadge}
                <i class="fas fa-chevron-down" style="font-size: 0.8rem; opacity: 0.5;"></i>
            </div>
        `;

        checkAdminControls();
    }
}

// --- POPUP / MODAL YÖNETİMİ ---
window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Arka planı kitle
    }
};

window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.openProfileModal = function () {
    const name = safeStorage.getItem("gedikliUser") || "Misafir";
    const role = safeStorage.getItem("userRole");
    const roleLabel = role === 'admin' ? "Yönetici" : ((safeStorage.getItem("villageAccess") === "Authorized") ? "Köy Sakini" : "Bilinmiyor");
    const contact = safeStorage.getItem("userContact") || "Giriş Yapılmadı";

    document.getElementById('profileName').innerText = name;
    document.getElementById('profileRole').innerText = roleLabel;
    document.getElementById('profileRoleDetail').innerText = roleLabel;
    document.getElementById('profileContact').innerText = contact;

    window.openModal('profileModal');
};

window.logout = function () {
    safeStorage.clear();
    showToast("Çıkış yapıldı.", 'success');
    setTimeout(() => window.location.href = "login.html", 1000);
};

window.showSection = function (sectionId) {
    // PROTECTED SECTIONS LOGIC
    if (protectedSections.includes(sectionId)) {
        const access = safeStorage.getItem("villageAccess");
        const role = safeStorage.getItem("userRole");

        if (access !== "Authorized") {
            showToast("🔒 Bu alan sadece üyelere özeldir. Lütfen giriş yapın.", 'error');
            setTimeout(() => window.location.href = "login.html", 1500);
            return;
        }
    }

    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.querySelectorAll('.menu-btn').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(sectionId)) btn.classList.add('active');
    });
};

// --- SUPPORT TICKET SYSTEM ---
window.switchSupportTab = function (tabName) {
    // Hide all tabs
    document.querySelectorAll('.support-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.support-content').forEach(c => c.style.display = 'none');

    // Show active
    document.querySelector(`.support-tab[onclick="switchSupportTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`content-${tabName}`).style.display = 'block';

    // Load data if needed
    if (tabName === 'results') loadUserTickets();
    if (tabName === 'admin') loadAdminTickets();
};

window.submitTicket = async function (type) {
    const text = document.getElementById(`text-${type}`).value;
    if (!text) return showToast('Lütfen mesajınızı yazın.', 'error');

    const user = safeStorage.getItem("gedikliUser") || "İsimsiz";
    const userId = safeStorage.getItem("userContact"); // Unique ID/Phone

    if (!userId) return showToast('Lütfen önce giriş yapın.', 'error');

    try {
        const res = await authenticatedFetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                name: user,
                userId,
                message: text
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Talebiniz alındı.');
            document.getElementById(`text-${type}`).value = '';
            // Switch to results to show pending
            switchSupportTab('results');
        }
    } catch (err) {
        showToast('Gönderim hatası.', 'error');
    }
};

window.loadUserTickets = async function () {
    const userId = safeStorage.getItem("userContact");
    if (!userId) return;

    try {
        const res = await authenticatedFetch(`${API_URL}/tickets?userId=${userId}`);
        const tickets = await res.json();
        renderTickets(tickets, 'user-tickets-list', false);
    } catch (err) { console.error(err); }
};

window.loadAdminTickets = async function () {
    if (safeStorage.getItem("userRole") !== 'admin') return;

    try {
        const res = await authenticatedFetch(`${API_URL}/tickets?role=admin`);
        const tickets = await res.json();
        renderTickets(tickets, 'admin-tickets-list', true);
    } catch (err) { console.error(err); }
};

function renderTickets(tickets, containerId, isAdmin) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (tickets.length === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center;">Kayıt bulunamadı.</p>';
        return;
    }

    container.innerHTML = tickets.map(t => `
        <div class="ticket-card" style="background:white; padding:15px; margin-bottom:10px; border-radius:8px; border-left:4px solid ${t.status === 'resolved' ? '#27ae60' : '#f39c12'}; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:bold; color:var(--primary);">${t.type === 'fault' ? 'Arıza Bildirimi' : 'Öneri/İstek'}</span>
                <span class="badge" style="background:${t.status === 'resolved' ? '#27ae60' : '#f39c12'};">${t.status === 'resolved' ? 'Çözüldü' : 'Bekliyor'}</span>
            </div>
            <p style="margin:5px 0; color:#333;">${escapeHtml(t.message)}</p>
            <div style="font-size:0.8rem; color:#888; display:flex; justify-content:space-between; align-items:center;">
                <span>${escapeHtml(t.name)} • ${new Date(t.date).toLocaleDateString()}</span>
                ${isAdmin && t.status !== 'resolved' ? `<button onclick="replyToTicket('${t.id}')" style="background:var(--primary); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"><i class="fas fa-reply"></i> Yanıtla & Çöz</button>` : ''}
            </div>
            ${t.adminResponse ? `
                <div style="margin-top:10px; background:#e8f5e9; padding:10px; border-radius:5px; font-size:0.9rem; border-left: 3px solid var(--primary);">
                    <strong style="color:var(--primary);"><i class="fas fa-user-check"></i> Yetkili Yanıtı:</strong><br>
                    ${escapeHtml(t.adminResponse)}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Güncellenmiş replyToTicket - Modal açar
window.replyToTicket = function (id) {
    console.log("Replying to ticket:", id);
    const idInput = document.getElementById('replyTicketId');
    const textInput = document.getElementById('replyText');

    if (idInput && textInput) {
        idInput.value = id;
        textInput.value = '';
        window.openModal('admin-reply-modal');
    } else {
        console.error("Modal elementleri bulunamadı!");
        showToast("Hata: Modal yüklenemedi.", "error");
    }
};

// Yeni: Modal Form Submit
window.handleAdminReplySubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById('replyTicketId').value;
    const response = document.getElementById('replyText').value;

    if (!response) {
        showToast('Lütfen bir yanıt yazınız.', 'error');
        return;
    }

    try {
        await authenticatedFetch(`${API_URL}/tickets/${id}/respond`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response })
        });
        showToast('Yanıt başarıyla gönderildi.');
        window.closeModal('admin-reply-modal');
        loadAdminTickets();
    } catch (err) {
        console.error(err);
        showToast('İşlem başarısız.', 'error');
    }
};

// --- SUPPORT TICKET SYSTEM ---
window.switchSupportTab = function (tabName) {
    // Hide all tabs
    document.querySelectorAll('.support-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.support-content').forEach(c => c.style.display = 'none');

    // Show active
    document.querySelector(`.support-tab[onclick="switchSupportTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`content-${tabName}`).style.display = 'block';

    // Load data if needed
    if (tabName === 'results') loadUserTickets();
    if (tabName === 'admin') loadAdminTickets();
};

window.submitTicket = async function (type) {
    const text = document.getElementById(`text-${type}`).value;
    if (!text) return showToast('Lütfen mesajınızı yazın.', 'error');

    const user = safeStorage.getItem("gedikliUser") || "İsimsiz";
    const userId = safeStorage.getItem("userContact"); // Unique ID/Phone

    if (!userId) return showToast('Lütfen önce giriş yapın.', 'error');

    try {
        const res = await authenticatedFetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                name: user,
                userId,
                message: text
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Talebiniz alındı.');
            document.getElementById(`text-${type}`).value = '';
            // Switch to results to show pending
            switchSupportTab('results');
        }
    } catch (err) {
        showToast('Gönderim hatası.', 'error');
    }
};

window.loadUserTickets = async function () {
    const userId = safeStorage.getItem("userContact");
    if (!userId) return;

    try {
        const res = await authenticatedFetch(`${API_URL}/tickets?userId=${userId}`);
        const tickets = await res.json();
        renderTickets(tickets, 'user-tickets-list', false);
    } catch (err) { console.error(err); }
};

window.loadAdminTickets = async function () {
    if (safeStorage.getItem("userRole") !== 'admin') return;

    try {
        const res = await authenticatedFetch(`${API_URL}/tickets?role=admin`);
        const tickets = await res.json();
        renderTickets(tickets, 'admin-tickets-list', true);
    } catch (err) { console.error(err); }
};

function renderTickets(tickets, containerId, isAdmin) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (tickets.length === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center;">Kayıt bulunamadı.</p>';
        return;
    }

    container.innerHTML = tickets.map(t => `
        <div class="ticket-card" style="background:white; padding:15px; margin-bottom:10px; border-radius:8px; border-left:4px solid ${t.status === 'resolved' ? '#27ae60' : '#f39c12'}; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:bold; color:var(--primary);">${t.type === 'fault' ? 'Arıza Bildirimi' : 'Öneri/İstek'}</span>
                <span class="badge" style="background:${t.status === 'resolved' ? '#27ae60' : '#f39c12'};">${t.status === 'resolved' ? 'Çözüldü' : 'Bekliyor'}</span>
            </div>
            <p style="margin:5px 0; color:#333;">${t.message}</p>
            <div style="font-size:0.8rem; color:#888; display:flex; justify-content:space-between;">
                <span>${t.name} • ${new Date(t.date).toLocaleDateString()}</span>
                ${isAdmin && t.status !== 'resolved' ? `<button onclick="replyToTicket('${t.id}')" style="background:var(--primary); color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer;">Yanıtla & Çöz</button>` : ''}
            </div>
            ${t.adminResponse ? `
                <div style="margin-top:10px; background:#f1f8e9; padding:10px; border-radius:5px; font-size:0.9rem;">
                    <strong>Yetkili Yanıtı:</strong> ${t.adminResponse}
                </div>
            ` : ''}
        </div>
    `).join('');
}

window.replyToTicket = async function (id) {
    const response = prompt("Yanıtınız:");
    if (!response) return;

    try {
        await authenticatedFetch(`${API_URL}/tickets/${id}/respond`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response })
        });
        showToast('Yanıt gönderildi.');
        loadAdminTickets();
    } catch (err) {
        showToast('İşlem başarısız.', 'error');
    }
};

// --- LIGHTBOX ---
window.openLightbox = function (src) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (lightbox && img) {
        img.src = src;
        lightbox.classList.add('active');
    }
};

window.closeLightbox = function () {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
    }
};

// Close on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closeLightbox();
});

// Close on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        window.closeLightbox();
        document.getElementById('search-results')?.classList.remove('active');
    }
});

// --- GLOBAL SEARCH ---
window.handleGlobalSearch = function (query) {
    const resultsContainer = document.getElementById('search-results');
    if (!query || query.length < 2) {
        resultsContainer.classList.remove('active');
        return;
    }

    const q = query.toLowerCase();
    let results = [];

    // Search Market
    if (window.siteData.market) {
        window.siteData.market.forEach(item => {
            if (item.title.toLowerCase().includes(q) || item.desc?.toLowerCase().includes(q)) {
                results.push({ ...item, type: 'market', label: 'Çarşı' });
            }
        });
    }

    // Search Genealogy
    if (window.siteData.genealogy) {
        window.siteData.genealogy.forEach(item => {
            if (item.title.toLowerCase().includes(q) || item.detail?.toLowerCase().includes(q)) {
                results.push({ ...item, type: 'genealogy', label: 'Soyağacı' });
            }
        });
    }

    // Search Documents & Deceased
    if (window.siteData.documents) {
        window.siteData.documents.forEach(item => {
            if (item.title.toLowerCase().includes(q)) {
                results.push({ ...item, type: 'documents', label: 'Belge' });
            }
        });
    }
    if (window.siteData.deceased) {
        window.siteData.deceased.forEach(item => {
            if (item.name.toLowerCase().includes(q)) {
                results.push({ ...item, type: 'deceased', label: 'Vefat Eden' });
            }
        });
    }

    renderSearchResults(results);
};

function renderSearchResults(results) {
    const container = document.getElementById('search-results');
    if (results.length === 0) {
        container.innerHTML = '<div class="search-result-item" style="justify-content:center; color:#999;">Sonuç bulunamadı</div>';
    } else {
        container.innerHTML = results.slice(0, 8).map(item => `
            <div class="search-result-item" onclick="navigateToResult('${item.type}', '${item.id}')">
                <div class="search-result-info">
                    <h4>${item.title || item.name}</h4>
                    <p>${item.desc || item.detail || item.date || ''}</p>
                </div>
                <span class="search-result-type-badge">${item.label}</span>
            </div>
        `).join('');
    }
    container.classList.add('active');
}

window.navigateToResult = function (type, id) {
    showSection(type);
    document.getElementById('search-results').classList.remove('active');
    document.getElementById('searchInput').value = '';

    // Optional: Scroll to item logic could be added here
    setTimeout(() => {
        // Simple highlight attempt (might need IDs on elements)
        // const el = document.getElementById(type + '-' + id) ...
    }, 500);
};

// Init
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();