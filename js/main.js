// ---------- ۱. منوی موبایل ----------
const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('nav');

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('show');
  menuButton.setAttribute('aria-expanded', open);   // برای ابزارهای کمکی نابینایان
});
nav.addEventListener('click', () => nav.classList.remove('show')); // با کلیک روی لینک، منو بسته شود

// ---------- ۲. خواندن داده از فایل JSON ----------
// بعداً اگر منبع داده عوض شد، فقط همین تابع عوض می‌شود.
async function getData(name) {
  const response = await fetch(`data/${name}.json`);
  if (!response.ok) throw new Error(`فایل ${name}.json پیدا نشد`);
  return response.json();
}

// ---------- ۳. ساخت کارت‌های خبر ----------
async function renderNews() {
  const list = document.getElementById('news-list');
  try {
    const news = await getData('news');
    list.replaceChildren();                       // پاک کردن «در حال بارگذاری»
    if (news.length === 0) {
      list.innerHTML = '<p class="muted">هنوز خبری ثبت نشده است.</p>';
      return;
    }
    for (const item of news) {
      const card = document.createElement('article');
      card.className = 'card news-card';
      const date = document.createElement('time');
      const title = document.createElement('b');
      const summary = document.createElement('p');
      // textContent امن است؛ اگر کسی داخل خبر کد HTML بنویسد اجرا نمی‌شود
      date.textContent = item.date;
      title.textContent = item.title;
      summary.textContent = item.summary;
      card.append(date, title, summary);
      list.append(card);
    }
  } catch (error) {
    console.error(error);
    list.innerHTML = '<p class="muted">بارگذاری اخبار ممکن نشد.</p>';
  }
}

renderNews();
