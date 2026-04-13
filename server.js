const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ts_store_secret_2025';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const IMAGES_DIR = path.join(UPLOAD_DIR, 'images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => { const ext = path.extname(file.originalname).toLowerCase(); cb(null, uuidv4() + '-' + Date.now() + ext); }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { const allowed = ['.jpg','.jpeg','.png','.gif','.webp','.svg']; if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true); else cb(new Error('نوع الملف غير مدعوم')); } });

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function readDB(name) { try { return JSON.parse(fs.readFileSync(path.join(DB_DIR, name + '.json'), 'utf8')); } catch { return []; } }
function writeDB(name, data) { fs.writeFileSync(path.join(DB_DIR, name + '.json'), JSON.stringify(data, null, 2), 'utf8'); }

function initDB() {
  if (!fs.existsSync(path.join(DB_DIR, 'users.json'))) {
    writeDB('users', [{ id: 1, name: process.env.ADMIN_NAME || 'مدير TS Store', email: process.env.ADMIN_EMAIL || 'ts@gmail.com', password: process.env.ADMIN_PASSWORD || 'ts', role: 'admin', createdAt: new Date().toISOString() }]);
  }
  ['products','orders','staff','discounts','reviews','payments','messages'].forEach(n => { if (!fs.existsSync(path.join(DB_DIR, n + '.json'))) writeDB(n, []); });
  if (readDB('products').length === 0) {
    writeDB('products', [
      { id:1,name:'خريطة Los Santos المطور',cat:'maps',price:15,img:['https://picsum.photos/seed/map1/400/300','https://picsum.photos/seed/map1b/400/300'],desc:'خريطة لوس سانتوس مطورة بأحدث التقنيات مع إضاءة واقعية وتفاصيل عالية',features:['إضاءة واقعية','تفاصيل عالية','متوافقة مع الإصدارات','سهلة التثبيت'],hasOffer:false,offerDiscount:0,offerDays:0,offerStart:null },
      { id:2,name:'خريطة شارع تجاري',cat:'maps',price:10,img:['https://picsum.photos/seed/map2/400/300'],desc:'خريطة شارع تجاري متكاملة تحتوي على متاجر ومطاعم ومحطات وقود',features:['تجاري كامل','متاجر متنوعة','مطاعم','محطات وقود'],hasOffer:true,offerDiscount:30,offerDays:5,offerStart:new Date(Date.now()-86400000*2).toISOString() },
      { id:3,name:'سكربت نظام بوليس',cat:'scripts',price:25,img:['https://picsum.photos/seed/sc1/400/300'],desc:'سكربت شرطة متكامل يشمل نظام قبض ومقتضيات وإصابات ولوحة تحكم',features:['نظام قبض','مقتضيات','إصابات','لوحة تحكم'],hasOffer:false,offerDiscount:0,offerDays:0,offerStart:null },
      { id:4,name:'سكربت عقارات',cat:'scripts',price:20,img:['https://picsum.photos/seed/sc2/400/300'],desc:'سكربت بيع وشراء العقارات مع خريطة تفاعلية ونظام إيجار',features:['بيع وشراء','إيجار','خريطة تفاعلية','لوحة إدارة'],hasOffer:true,offerDiscount:20,offerDays:3,offerStart:new Date(Date.now()-86400000).toISOString() },
      { id:5,name:'خريطة مطار',cat:'maps',price:18,img:['https://picsum.photos/seed/map3/400/300'],desc:'مطار دولي كامل مع صالات انتظار ومدرجات وطائرات',features:['مطار كبير','صالات انتظار','مدرجات','طائرات'],hasOffer:false,offerDiscount:0,offerDays:0,offerStart:null },
      { id:6,name:'سكربت مستشفى',cat:'scripts',price:22,img:['https://picsum.photos/seed/sc3/400/300'],desc:'نظام مستشفى متكامل يشمل علاج وإسعاف وتشخيص وسجلات طبية',features:['علاج','إسعاف','تشخيص','سجلات طبية'],hasOffer:false,offerDiscount:0,offerDays:0,offerStart:null },
      { id:7,name:'خريطة جزيرة فاخرة',cat:'maps',price:30,img:['https://picsum.photos/seed/map4/400/300'],desc:'جزيرة فاخرة متكاملة مع فيلات ومناطق ترفيهية وشاطئ',features:['جزيرة كبيرة','فيلات فاخرة','مناطق ترفيهية','شاطئ'],hasOffer:true,offerDiscount:15,offerDays:7,offerStart:new Date().toISOString() },
      { id:8,name:'سكربت شركات',cat:'scripts',price:35,img:['https://picsum.photos/seed/sc4/400/300'],desc:'نظام إدارة شركات متكامل يشمل توظيف ورواتب ومهام يومية',features:['إدارة كاملة','توظيف','رواتب','مهام يومية'],hasOffer:false,offerDiscount:0,offerDays:0,offerStart:null }
    ]);
  }
  if (readDB('payments').length === 0) {
    writeDB('payments', [
      { id:1,name:'USDT',price:10,link:'https://pay.example.com/usdt',icon:'fab fa-bitcoin',color:'from-green-900/40 to-green-800/20' },
      { id:2,name:'PayPal',price:15,link:'https://pay.example.com/paypal',icon:'fab fa-paypal',color:'from-blue-900/40 to-blue-800/20' },
      { id:3,name:'بطاقة شحن',price:20,link:'https://pay.example.com/card',icon:'fas fa-credit-card',color:'from-purple-900/40 to-purple-800/20' },
      { id:4,name:'تحويل بنكي',price:25,link:'https://pay.example.com/bank',icon:'fas fa-university',color:'from-yellow-900/40 to-yellow-800/20' }
    ]);
  }
}
initDB();

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'غير مصرح' });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ success: false, message: 'توكن غير صالح' }); }
}
function adminOnly(req, res, next) { if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'صلاحيات مدير مطلوبة' }); next(); }
function staffOrAdmin(req, res, next) { if (req.user.role !== 'admin' && req.user.role !== 'staff') return res.status(403).json({ success: false, message: 'صلاحيات غير كافية' }); next(); }
function genToken(user) { return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' }); }

/* تحقق من توكن جوجل أو إنشاء مستخدم */
async function verifyGoogleToken(idToken) {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) throw new Error('توكن جوجل غير صالح');
    const data = await response.json();
    if (data.aud !== GOOGLE_CLIENT_ID) throw new Error('معرف العميل غير متطابق');
    return { email: data.email, name: data.name || data.email.split('@')[0], picture: data.picture || '' };
  } catch (e) { throw new Error('فشل التحقق من جوجل: ' + e.message); }
}

const router = express.Router();

router.get('/', (req, res) => {
  const possiblePaths = [path.join(__dirname, 'index.html'), path.join(process.cwd(), 'index.html'), '/app/index.html'];
  for (const filePath of possiblePaths) { try { if (fs.existsSync(filePath)) { res.sendFile(filePath); return; } } catch (e) {} }
  res.status(500).send('ملف index.html غير موجود في: ' + possiblePaths.join(' | '));
});

router.get('/api/products', (req, res) => {
  let products = readDB('products');
  const { cat, search, offer } = req.query;
  if (cat && cat !== 'all') products = products.filter(p => p.cat === cat);
  if (search) products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (offer === 'true') products = products.filter(p => p.hasOffer);
  res.json({ success: true, data: products.map(p => ({ ...p, finalPrice: p.hasOffer ? +(p.price * (1 - p.offerDiscount / 100)).toFixed(2) : p.price })) });
});

router.get('/api/products/:id', (req, res) => {
  const p = readDB('products').find(x => x.id === parseInt(req.params.id));
  if (!p) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
  res.json({ success: true, data: { ...p, finalPrice: p.hasOffer ? +(p.price * (1 - p.offerDiscount / 100)).toFixed(2) : p.price } });
});

router.get('/api/offers', (req, res) => {
  const now = Date.now();
  res.json({ success: true, data: readDB('products').filter(p => { if (!p.hasOffer || !p.offerStart) return false; return new Date(p.offerStart).getTime() + p.offerDays * 86400000 > now; }).map(p => ({ ...p, finalPrice: +(p.price * (1 - p.offerDiscount / 100)).toFixed(2) })) });
});

router.get('/api/reviews', (req, res) => res.json({ success: true, data: readDB('reviews').reverse() }));
router.get('/api/payments', (req, res) => res.json({ success: true, data: readDB('payments') }));

router.post('/api/discounts/verify', (req, res) => {
  const d = readDB('discounts').find(x => x.code.toUpperCase() === (req.body.code || '').toUpperCase());
  if (!d) return res.json({ success: false, message: 'كود غير صالح' });
  res.json({ success: true, data: d });
});

router.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول' });
  const users = readDB('users');
  if (users.find(u => u.email === email)) return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
  const nu = { id: Date.now(), name, email, password, role: 'user', createdAt: new Date().toISOString() };
  users.push(nu); writeDB('users', users);
  res.json({ success: true, data: { token: genToken(nu), user: { id: nu.id, name: nu.name, email: nu.email, role: nu.role } } });
});

router.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'يرجى ملء الحقول' });
  const user = readDB('users').find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'بيانات غير صحيحة' });
  res.json({ success: true, data: { token: genToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
});

/* تسجيل دخول جوجل */
router.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'توكن جوجل مطلوب' });
    const gUser = await verifyGoogleToken(idToken);
    let users = readDB('users');
    let user = users.find(u => u.email === gUser.email);
    if (!user) {
      user = { id: Date.now(), name: gUser.name, email: gUser.email, password: 'google_' + Date.now(), role: 'user', createdAt: new Date().toISOString(), picture: gUser.picture };
      users.push(user); writeDB('users', users);
    }
    res.json({ success: true, data: { token: genToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, picture: user.picture || '' } } });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = readDB('users').find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
  res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, picture: user.picture || '' } });
});

router.get('/api/orders/my', authMiddleware, (req, res) => {
  res.json({ success: true, data: readDB('orders').filter(o => o.userId === req.user.id).reverse() });
});

router.post('/api/orders', authMiddleware, (req, res) => {
  const { name, discord, phone, paymentId, purchaseCode, discountCode, cart } = req.body;
  if (!name || !discord || !phone || !paymentId || !purchaseCode || !cart || !cart.length) return res.status(400).json({ success: false, message: 'يرجى ملء جميع بيانات الطلب' });
  const products = readDB('products'), payments = readDB('payments');
  const payment = payments.find(p => p.id === paymentId);
  if (!payment) return res.status(400).json({ success: false, message: 'طريقة الدفع غير موجودة' });
  let total = 0; const cartItems = [];
  for (const item of cart) {
    const product = products.find(p => p.id === item.id);
    if (!product) return res.status(400).json({ success: false, message: 'منتج غير موجود' });
    const fp = product.hasOffer ? +(product.price * (1 - product.offerDiscount / 100)).toFixed(2) : product.price;
    cartItems.push({ ...product, finalPrice: fp }); total += fp;
  }
  let discount = null;
  if (discountCode) { discount = readDB('discounts').find(d => d.code.toUpperCase() === discountCode.toUpperCase()); if (discount) total = +(total * (1 - discount.discount / 100)).toFixed(2); }
  const order = { id: Date.now(), userId: req.user.id, userName: name, discord, phone, purchaseCode, cart: cartItems, payment: { id: payment.id, name: payment.name }, discount: discount ? { code: discount.code, discount: discount.discount } : null, total, status: 'مكتمل', createdAt: new Date().toISOString() };
  const orders = readDB('orders'); orders.push(order); writeDB('orders', orders);
  res.json({ success: true, data: order });
});

router.post('/api/reviews', authMiddleware, (req, res) => {
  const { stars, text, productId } = req.body;
  if (!stars || !text) return res.status(400).json({ success: false, message: 'يرجى ملء البيانات' });
  const user = readDB('users').find(u => u.id === req.user.id);
  const reviews = readDB('reviews');
  reviews.push({ id: Date.now(), userId: req.user.id, name: user ? user.name : 'مستخدم', email: user ? user.email : '', stars: Math.min(5, Math.max(1, parseInt(stars))), text, productId: productId || null, date: new Date().toISOString() });
  writeDB('reviews', reviews); res.json({ success: true, message: 'تم إرسال التقييم' });
});

router.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ success: false, message: 'يرجى ملء الحقول' });
  const msgs = readDB('messages'); msgs.push({ id: Date.now(), name, email, message, date: new Date().toISOString() }); writeDB('messages', msgs);
  res.json({ success: true, message: 'تم الإرسال بنجاح' });
});

router.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع صورة' });
  res.json({ success: true, data: { url: '/uploads/images/' + req.file.filename, filename: req.file.filename } });
});

/* لوحة التحكم */
router.get('/api/admin/stats', authMiddleware, staffOrAdmin, (req, res) => {
  const p = readDB('products'), o = readDB('orders'), u = readDB('users'), r = readDB('reviews'), d = readDB('discounts');
  res.json({ success: true, data: { totalRevenue: o.reduce((s, x) => s + (x.total || 0), 0), totalOrders: o.length, totalProducts: p.length, totalUsers: u.length, totalReviews: r.length, totalDiscounts: d.length, mapsCount: p.filter(x => x.cat === 'maps').length, scriptsCount: p.filter(x => x.cat === 'scripts').length } });
});

router.get('/api/admin/orders', authMiddleware, staffOrAdmin, (req, res) => res.json({ success: true, data: readDB('orders').reverse() }));
router.get('/api/admin/orders/:id', authMiddleware, staffOrAdmin, (req, res) => { const o = readDB('orders').find(x => x.id === parseInt(req.params.id)); if (!o) return res.status(404).json({ success: false, message: 'الطلب غير موجود' }); res.json({ success: true, data: o }); });
router.patch('/api/admin/orders/:id/status', authMiddleware, staffOrAdmin, (req, res) => { const orders = readDB('orders'); const idx = orders.findIndex(o => o.id === parseInt(req.params.id)); if (idx === -1) return res.status(404).json({ success: false, message: 'الطلب غير موجود' }); orders[idx].status = req.body.status; writeDB('orders', orders); res.json({ success: true, message: 'تم التحديث' }); });
router.delete('/api/admin/orders/:id', authMiddleware, adminOnly, (req, res) => { writeDB('orders', readDB('orders').filter(o => o.id !== parseInt(req.params.id))); res.json({ success: true, message: 'تم الحذف' }); });

router.post('/api/admin/products', authMiddleware, staffOrAdmin, upload.array('images', 5), (req, res) => {
  const { name, price, cat, desc, features, hasOffer, offerDiscount, offerDays, imgLinks } = req.body;
  if (!name || !price) return res.status(400).json({ success: false, message: 'الاسم والسعر مطلوبان' });
  const images = [...(req.files || []).map(f => '/uploads/images/' + f.filename), ...(imgLinks ? JSON.parse(imgLinks) : [])].filter(Boolean);
  if (!images.length) return res.status(400).json({ success: false, message: 'أضف صورة واحدة على الأقل' });
  const products = readDB('products');
  const np = { id: Date.now(), name, price: parseFloat(price), cat: cat || 'maps', desc: desc || '', features: features ? features.split('\n').filter(f => f.trim()) : [], img: images, hasOffer: hasOffer === 'true' || hasOffer === true, offerDiscount: parseFloat(offerDiscount) || 0, offerDays: parseInt(offerDays) || 0, offerStart: (hasOffer === 'true' || hasOffer === true) ? new Date().toISOString() : null };
  products.push(np); writeDB('products', products); res.json({ success: true, data: np });
});

router.put('/api/admin/products/:id', authMiddleware, staffOrAdmin, upload.array('images', 5), (req, res) => {
  const { name, price, cat, desc, features, hasOffer, offerDiscount, offerDays, imgLinks } = req.body;
  const products = readDB('products'); const idx = products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
  const allImages = [...(imgLinks ? JSON.parse(imgLinks) : []), ...(req.files || []).map(f => '/uploads/images/' + f.filename)].filter(Boolean);
  if (name) products[idx].name = name; if (price) products[idx].price = parseFloat(price); if (cat) products[idx].cat = cat; if (desc !== undefined) products[idx].desc = desc; if (features) products[idx].features = features.split('\n').filter(f => f.trim()); if (allImages.length) products[idx].img = allImages;
  products[idx].hasOffer = hasOffer === 'true' || hasOffer === true; products[idx].offerDiscount = parseFloat(offerDiscount) || 0; products[idx].offerDays = parseInt(offerDays) || 0;
  if (products[idx].hasOffer && !products[idx].offerStart) products[idx].offerStart = new Date().toISOString();
  if (!products[idx].hasOffer) { products[idx].offerStart = null; products[idx].offerDiscount = 0; products[idx].offerDays = 0; }
  writeDB('products', products); res.json({ success: true, data: products[idx] });
});

router.delete('/api/admin/products/:id', authMiddleware, adminOnly, (req, res) => { writeDB('products', readDB('products').filter(p => p.id !== parseInt(req.params.id))); res.json({ success: true, message: 'تم الحذف' }); });

router.get('/api/admin/members', authMiddleware, adminOnly, (req, res) => res.json({ success: true, data: readDB('users').filter(u => u.role === 'user') }));
router.get('/api/admin/members/:id', authMiddleware, adminOnly, (req, res) => { const u = readDB('users').find(x => x.id === parseInt(req.params.id)); if (!u) return res.status(404).json({ success: false, message: 'العضو غير موجود' }); res.json({ success: true, data: { ...u, ordersCount: readDB('orders').filter(o => o.userId === u.id).length, orders: readDB('orders').filter(o => o.userId === u.id).slice(-5) } }); });
router.delete('/api/admin/members/:id', authMiddleware, adminOnly, (req, res) => { writeDB('users', readDB('users').filter(u => u.id !== parseInt(req.params.id))); res.json({ success: true, message: 'تم حذف العضو' }); });

router.get('/api/admin/staff', authMiddleware, adminOnly, (req, res) => res.json({ success: true, data: readDB('staff') }));
router.post('/api/admin/staff', authMiddleware, adminOnly, (req, res) => {
  const { email, password, perms } = req.body;
  if (!email || !password || !perms || !perms.length) return res.status(400).json({ success: false, message: 'يرجى ملء البيانات' });
  const staff = readDB('staff');
  if (staff.find(s => s.email === email)) return res.status(409).json({ success: false, message: 'الموظف موجود بالفعل' });
  staff.push({ email, password, perms }); writeDB('staff', staff);
  const users = readDB('users');
  if (!users.find(u => u.email === email)) { users.push({ id: Date.now(), name: email.split('@')[0], email, password, role: 'staff', createdAt: new Date().toISOString() }); writeDB('users', users); }
  res.json({ success: true, message: 'تمت الإضافة' });
});
router.put('/api/admin/staff/:email', authMiddleware, adminOnly, (req, res) => { const staff = readDB('staff'); const idx = staff.findIndex(s => s.email === req.params.email); if (idx === -1) return res.status(404).json({ success: false, message: 'الموظف غير موجود' }); if (req.body.password) staff[idx].password = req.body.password; if (req.body.perms) staff[idx].perms = req.body.perms; writeDB('staff', staff); if (req.body.password) { const users = readDB('users'); const uIdx = users.findIndex(u => u.email === req.params.email); if (uIdx > -1) { users[uIdx].password = req.body.password; writeDB('users', users); } } res.json({ success: true, message: 'تم التحديث' }); });
router.delete('/api/admin/staff/:email', authMiddleware, adminOnly, (req, res) => { writeDB('staff', readDB('staff').filter(s => s.email !== req.params.email)); res.json({ success: true, message: 'تم الحذف' }); });

router.get('/api/admin/discounts', authMiddleware, staffOrAdmin, (req, res) => res.json({ success: true, data: readDB('discounts') }));
router.post('/api/admin/discounts', authMiddleware, adminOnly, (req, res) => { const { code, discount } = req.body; if (!code || !discount) return res.status(400).json({ success: false, message: 'يرجى ملء البيانات' }); const ds = readDB('discounts'); if (ds.find(d => d.code.toUpperCase() === code.toUpperCase())) return res.status(409).json({ success: false, message: 'الكود موجود' }); ds.push({ code: code.toUpperCase(), discount: parseFloat(discount) }); writeDB('discounts', ds); res.json({ success: true, message: 'تمت الإضافة' }); });
router.put('/api/admin/discounts/:code', authMiddleware, adminOnly, (req, res) => { const ds = readDB('discounts'); const idx = ds.findIndex(d => d.code === req.params.code); if (idx === -1) return res.status(404).json({ success: false, message: 'الكود غير موجود' }); if (req.body.code) ds[idx].code = req.body.code.toUpperCase(); if (req.body.discount) ds[idx].discount = parseFloat(req.body.discount); writeDB('discounts', ds); res.json({ success: true, message: 'تم التحديث' }); });
router.delete('/api/admin/discounts/:code', authMiddleware, adminOnly, (req, res) => { writeDB('discounts', readDB('discounts').filter(d => d.code !== req.params.code)); res.json({ success: true, message: 'تم الحذف' }); });

router.post('/api/admin/reviews', authMiddleware, adminOnly, (req, res) => { const { name, stars, text } = req.body; if (!name || !stars || !text) return res.status(400).json({ success: false, message: 'يرجى ملء البيانات' }); const rv = readDB('reviews'); rv.push({ id: Date.now(), name, stars: parseInt(stars), text, date: new Date().toISOString() }); writeDB('reviews', rv); res.json({ success: true, message: 'تمت الإضافة' }); });
router.put('/api/admin/reviews/:id', authMiddleware, adminOnly, (req, res) => { const rv = readDB('reviews'); const idx = rv.findIndex(r => r.id === parseInt(req.params.id)); if (idx === -1) return res.status(404).json({ success: false, message: 'التقييم غير موجود' }); if (req.body.name) rv[idx].name = req.body.name; if (req.body.stars) rv[idx].stars = parseInt(req.body.stars); if (req.body.text) rv[idx].text = req.body.text; writeDB('reviews', rv); res.json({ success: true, message: 'تم التحديث' }); });
router.delete('/api/admin/reviews/:id', authMiddleware, adminOnly, (req, res) => { writeDB('reviews', readDB('reviews').filter(r => r.id !== parseInt(req.params.id))); res.json({ success: true, message: 'تم الحذف' }); });

router.get('/api/admin/payments', authMiddleware, adminOnly, (req, res) => res.json({ success: true, data: readDB('payments') }));
router.post('/api/admin/payments', authMiddleware, adminOnly, (req, res) => { const { name, price, link, icon, color } = req.body; if (!name || !price || !link) return res.status(400).json({ success: false, message: 'يرجى ملء البيانات' }); const ps = readDB('payments'); ps.push({ id: Date.now(), name, price: parseFloat(price), link, icon: icon || 'fas fa-credit-card', color: color || 'from-gray-900/40 to-gray-800/20' }); writeDB('payments', ps); res.json({ success: true, message: 'تمت الإضافة' }); });
router.put('/api/admin/payments/:id', authMiddleware, adminOnly, (req, res) => { const ps = readDB('payments'); const idx = ps.findIndex(p => p.id === parseInt(req.params.id)); if (idx === -1) return res.status(404).json({ success: false, message: 'غير موجودة' }); if (req.body.name) ps[idx].name = req.body.name; if (req.body.price) ps[idx].price = parseFloat(req.body.price); if (req.body.link) ps[idx].link = req.body.link; if (req.body.icon) ps[idx].icon = req.body.icon; if (req.body.color) ps[idx].color = req.body.color; writeDB('payments', ps); res.json({ success: true, message: 'تم التحديث' }); });
router.delete('/api/admin/payments/:id', authMiddleware, adminOnly, (req, res) => { writeDB('payments', readDB('payments').filter(p => p.id !== parseInt(req.params.id))); res.json({ success: true, message: 'تم الحذف' }); });

app.use(router);
app.use((err, req, res, next) => { if (err instanceof multer.MulterError) return res.status(400).json({ success: false, message: 'خطأ في رفع الملف' }); res.status(500).json({ success: false, message: 'خطأ في السيرفر' }); });
app.listen(PORT, '0.0.0.0', () => console.log('TS Store يعمل على المنفذ ' + PORT));