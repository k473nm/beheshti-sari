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
