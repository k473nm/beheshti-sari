const view = document.getElementById('news-view');
// آدرس news.html?id=2 → مقدار id برابر "2" می‌شود
const id = new URLSearchParams(location.search).get('id');

async function init() {
  try {
    const news = await getData('news');
    view.replaceChildren();
    if (id === null) return showList(news);
    const item = news.find(n => String(n.id) === id);
    if (item) showArticle(item); else showMissing();
  } catch (error) {
    console.error(error);
    view.replaceChildren(el('p', 'muted', 'بارگذاری اخبار ممکن نشد.'));
  }
}

function showList(news) {
  document.title = 'اخبار | دبیرستان شهید بهشتی ساری';
  view.append(el('h1', 'page-title', 'همه‌ی اخبار'));
  const grid = el('div', 'news-grid');
  if (news.length === 0) grid.append(el('p', 'muted', 'هنوز خبری ثبت نشده است.'));
  news.forEach(item => grid.append(newsCard(item)));
  view.append(grid);
}

function showArticle(item) {
  document.title = `${item.title} | دبیرستان شهید بهشتی ساری`;
  const back = el('a', 'back', '→ همه‌ی اخبار');
  back.href = 'news.html';
  const article = el('article', 'article');
  article.append(el('time', '', item.date), el('h1', '', item.title));
    if (item.image) {
    const img = el('img', 'article-img');
    img.src = item.image;
    img.alt = item.title;
    article.append(img);
  }
  // هر خط خالی در متن، یک پاراگراف جدید می‌سازد
  (item.body || item.summary).split('\n\n').forEach(p => article.append(el('p', '', p)));
  view.append(back, article);
}

function showMissing() {
  const back = el('a', 'back', '→ همه‌ی اخبار');
  back.href = 'news.html';
  view.append(back, el('p', 'muted', 'این خبر پیدا نشد.'));
}

init();
