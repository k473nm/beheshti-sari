// فقط کار مخصوص صفحه‌ی خانه؛ کارهای مشترک توی common.js هستند

async function renderNews() {
  const list = document.getElementById('news-list');
  try {
    const news = await getData('news');
    list.replaceChildren();
    if (news.length === 0) {
      list.append(el('p', 'muted', 'هنوز خبری ثبت نشده است.'));
      return;
    }
    // فقط ۳ خبر اول (جدیدترین‌ها باید بالای news.json باشند)
    news.slice(0, 3).forEach(item => list.append(newsCard(item)));
  } catch (error) {
    console.error(error);
    list.replaceChildren(el('p', 'muted', 'بارگذاری اخبار ممکن نشد.'));
  }
}

renderNews();


// ---------- سال‌های گذشته از تأسیس (بر اساس سال شمسیِ امروز) ----------
const FOUNDED_YEAR = 1369;
const sinceYears = document.getElementById('since-years');

if (sinceYears) {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { year: 'numeric' }).formatToParts(new Date());
  const years = Number(parts.find(part => part.type === 'year')?.value) - FOUNDED_YEAR;
  if (years > 0) sinceYears.textContent = faDigits(years);   // اگر محاسبه نشد، همان ۳۶ ثابت می‌ماند
}
