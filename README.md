🏞️ Gedikli Belleği – Köy Dijital Arşivi

Gedikli Belleği, köy kültürünü, aile kayıtlarını, fotoğraf arşivini, tarihî belgeleri ve yerel pazar ilanlarını bir araya getiren modern bir dijital arşiv platformudur.
Amaç, köyün geçmişini korumak, bugünü kayıt altına almak ve gelecek nesillere kalıcı bir miras bırakmaktır.

🚀 Proje Amacı

Köye ait tarihî belgeleri, fotoğraf arşivlerini ve soy ağacı kayıtlarını dijitalleştirmek

Köylüler arasında bilgi erişimini ve paylaşımını kolaylaştırmak

Köylülerin ürünlerini sergileyebildiği dijital köy pazarı oluşturmak

Kültürel mirası modern bir yapıda uzun yıllar korumak

👥 Kullanıcı Rolleri

Uygulama üç farklı kullanıcı rolünü destekler:

🔹 Ziyaretçi

Üyelik gerektirmez

Görebileceği bölümler:
✔️ Ana Panel
✔️ Köy Pazarı
✔️ Fotoğraf Kütüphanesi
✔️ Destek Talebi

Üyelere özel bölümlere erişimde uyarı alır

🔹 Normal Kullanıcı

Üyelik oluşturur ve giriş yapar

Köy Pazarı’nda ilan talebi oluşturabilir

Üyelere özel içeriklerin bir kısmını görüntüleyebilir

Destek/istek bileti gönderebilir

🔹 Admin

Sistem üzerinde tam yetkiye sahiptir

Duyuru ekleme / silme

Pazar ilanlarını onaylama / reddetme

Fotoğraf ve belge arşivini yönetme

Soy ağacı ve vefat edenler kayıtlarını düzenleme

Kullanıcı taleplerini yönetme

Yönetici girişi özel kimlik doğrulama ile yapılır.

📰 Açılış Duyuru Sistemi

Platforma giriş yapan kullanıcıya özel bir duyuru penceresi gösterilir.

Admin tarafından güncellenebilir

Oturum süresince yalnızca bir kez görünür

Yeni duyuru geldiğinde tekrar görüntülenebilir

Köy halkının önemli bilgiye hızlı şekilde ulaşmasını sağlar

🧭 Ana Özellikler
📌 Ana Panel

Köy tanıtımı

Arşiv istatistikleri

Güncel duyurular

📄 Belge Arşivi

Tarihî dokümanların dijital kopyaları

Açıklamalar ve kategori sistemi

Arşivlenmiş resmî kayıtlar

🖼️ Fotoğraf Kütüphanesi

1200+ köy fotoğrafı

Albüm mantığıyla kategorize edilmiş yapı

Mobil uyumlu görüntüleme

🏷️ Köy Pazarı

Normal kullanıcı ilan talebi oluşturur

Admin onayladıktan sonra ilan yayınlanır

Ürün detayları + görsel destek

Ziyaretçilere açık listeleme

👨‍👩‍👧 Soy Ağacı

Ailelerin dijital şeması

Kök aile bilgileri

Üyelere özel erişim

🕊️ Vefat Edenler Bölümü

Köyün tarihsel anı defteri

Fotoğraflı veya açıklamalı kayıtlar

🛠️ Teknik Mimari

Bu proje AI destekli geliştirme modeli ile hazırlanmıştır.
Ancak uygulamanın tasarımı, mimarisi ve iş akışları tamamen manuel olarak oluşturulmuş, yapay zekâ yalnızca araç olarak kullanılmıştır.

Kullanılan Teknolojiler

Frontend: HTML, CSS, JavaScript

Backend: Node.js + Express

Veri Saklama: JSON tabanlı lokal veri yönetimi

Güvenlik: JWT, bcrypt, Helmet, Rate Limit

AI-Assisted Development: Prompt Engineering ile kod üretimi ve refaktör

🤖 AI Destekli Geliştirme Açıklaması

Bu proje “kodu AI yazsın” projesi değildir.
Aşağıdaki süreç uygulanmıştır:

Tüm ekran akışları, kullanıcı rolleri, veri yapıları manuel tasarlandı

AI sadece kod yazımı hızlandırmak ve hataları gidermek için kullanıldı

Üretilen kod → test edildi → gerekli yerlerde manuel olarak düzeltildi

Tasarım kararları ve mimari yapı tamamen el ile oluşturuldu

Bu proje, modern yazılım geliştirme sürecinde:

Prompt Engineering + Product Design + Human Supervision + AI Assisted Coding

yaklaşımının gerçek bir örneğidir.

📱 Gelecek Planları

Planlanan geliştirmeler:

🌐 Gerçek bir veritabanına geçiş (SQLite / PostgreSQL)

📱 Mobil uygulama (Flutter / React Native / PWA)

🔐 Admin paneline 2FA (İki Faktörlü Kimlik Doğrulama)

🗂️ API tabanlı mikro servis mimarisine geçiş

☁️ Hosting + Domain yayımı

🧠 Otomatik içerik sınıflandırma (AI destekli)

🧑‍💻 Proje Durumu

Bu proje hâlen aktif geliştirme aşamasındadır.
Geliştirme boyunca:

Yeni özellikler eklenecek

Performans ve güvenlik testleri yapılacak

Kullanıcı geri bildirimleri doğrultusunda geliştirme devam edecek

🔧 Kurulum & Çalıştırma
1. Depoyu Klonla
git clone https://github.com/oddself/gediklihaf-za.git
cd gediklihaf-za

2. Bağımlılıkları Kur
npm install

3. Veritabanı dosyasını oluştur
cp db.example.json db.json


(Windows PowerShell)

Copy-Item db.example.json db.json

4. .env dosyası oluştur
JWT_SECRET=buraya_rastgele_uzun_bir_secret
ADMIN_PASSWORD=Admin123!
PORT=3000

5. Gerekirse admin hesabı oluştur
node fix_admin.js

6. Sunucuyu başlat
npm start

📩 İletişim

Proje Sahibi: Bayram Garip
GitHub: https://github.com/oddself

Issues bölümünden geri bildirim gönderebilirsiniz.
