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

// ---------- کارت خبر (لینک به صفحه‌ی همان خبر) ----------
function newsCard(item) {
  const card = el('a', 'card news-card');
  card.href = `news.html?id=${encodeURIComponent(item.id)}`;
  card.append(el('time', '', item.date), el('b', '', item.title), el('p', '', item.summary));
  return card;
}
