// کدهای مشترک همه‌ی صفحه‌ها

// ---------- منوی موبایل ----------
const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('show');
    menuButton.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', () => nav.classList.remove('show'));
}

// ---------- خواندن داده از فایل JSON ----------
async function getData(name) {
  const response = await fetch(`data/${name}.json`);
  if (!response.ok) throw new Error(`فایل ${name}.json پیدا نشد`);
  return response.json();
}

// ---------- ساخت یک عنصر با متن امن ----------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---------- عکس بالای کارت ----------
function cardImage(path, alt = '') {
  const img = el('img', 'news-img');
  img.src = path;
  img.alt = alt;
  img.loading = 'lazy';
  return img;
}

// ---------- کارت خبر (لینک به صفحه‌ی همان خبر) ----------
function newsCard(item) {
  const card = el('a', 'card news-card');
  card.href = `news.html?id=${encodeURIComponent(item.id)}`;
  if (item.image) card.append(cardImage(item.image));
  card.append(el('time', '', item.date), el('b', '', item.title), el('p', '', item.summary));
  return card;
}

// ---------- تبدیل رقم‌های انگلیسی به فارسی ----------
function faDigits(value) {
  return String(value).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}


// ---------- برچسب‌های مشترک پنل مدیریت ----------
// توجه: این فهرست‌ها باید با CATEGORIES در honors.js و TYPES در calendar.js یکی باشند
const HONOR_CATEGORIES = { olympiad: 'المپیاد', konkoor: 'کنکور', kharazmi: 'جشنواره خوارزمی', other: 'سایر' };
const EVENT_TYPES = { event: 'رویداد', exam: 'امتحان', holiday: 'تعطیلی' };

// ---------- ورود پنهان به پنل مدیریت ----------
// ۵ بار پشت‌سرهم (در ۳ ثانیه) روی نوشته‌ی پاورقی بزن
const footerText = document.querySelector('.footer p');
if (footerText) {
  let taps = [];
  footerText.addEventListener('click', () => {
    const now = Date.now();
    taps = [...taps.filter(time => now - time < 3000), now];
    if (taps.length >= 5) location.href = 'admin.html';
  });
}


// ---------- برچسب‌های مرکز دانلود و کانال‌ها ----------
const DOWNLOAD_CATEGORIES = { forms: 'فرم‌ها', schedules: 'برنامه‌ها', resources: 'منابع آموزشی', other: 'سایر' };

const CHANNEL_PLATFORMS = {
  eitaa: { label: 'ایتا', icon: '📣' },
  bale: { label: 'بله', icon: '💬' },
  telegram: { label: 'تلگرام', icon: '✈️' },
  instagram: { label: 'اینستاگرام', icon: '📷' },
  rubika: { label: 'روبیکا', icon: '📲' },
  website: { label: 'وب‌سایت', icon: '🌐' }
};

// حجم فایل به متن فارسی (مثلاً ۲۵۶ کیلوبایت، ۲٫۴ مگابایت)
function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${faDigits(Math.max(1, Math.round(bytes / 1024)))} کیلوبایت`;
  return `${faDigits((bytes / 1048576).toFixed(1)).replace('.', '٫')} مگابایت`;
}


// ---------- آیکون تب (موقت تا آمدن لوگو) ----------
if (!document.querySelector('link[rel~="icon"]')) {
  const icon = document.createElement('link');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎓</text></svg>';
  icon.rel = 'icon';
  icon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  document.head.append(icon);
}

// ---------- جلوه‌های ظاهری هنگام اسکرول ----------
(function addScrollEffects() {
  if (document.querySelector('.admin')) return;   // پنل مدیریت ساده بماند

  const progress = el('div', 'scroll-progress');
  const toTop = el('button', 'to-top', '↑');
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'بازگشت به بالای صفحه');
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.append(progress, toTop);

  const navbar = document.querySelector('.navbar');
  let waiting = false;   // برای اینکه در هر فریم فقط یک بار محاسبه شود

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    toTop.classList.toggle('show', window.scrollY > 600);
    navbar?.classList.toggle('scrolled', window.scrollY > 24);
    waiting = false;
  }

  window.addEventListener('scroll', () => {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
})();
