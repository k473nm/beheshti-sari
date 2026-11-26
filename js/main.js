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


// ---------- کانال‌های اطلاع‌رسانی ----------
async function renderChannels() {
  const box = document.getElementById('channels-list');
  if (!box) return;
  const section = box.closest('section');
  try {
    // فقط آدرس‌های http/https پذیرفته می‌شوند
    const channels = (await getData('channels')).filter(item => /^https?:\/\//i.test(item.url));
    section.hidden = channels.length === 0;
    for (const item of channels) {
      const platform = CHANNEL_PLATFORMS[item.platform] ?? { label: 'لینک', icon: '🔗' };
      const card = el('a', 'card channel');
      card.href = item.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      const text = el('div');
      text.append(el('b', '', item.title), el('small', '', platform.label));
      card.append(el('span', 'channel-icon', platform.icon), text);
      box.append(card);
    }
  } catch (error) {
    console.error(error);
    section.hidden = true;
  }
}

renderChannels();
