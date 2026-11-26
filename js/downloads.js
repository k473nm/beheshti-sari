const view = document.getElementById('downloads-view');
let files = [];
let current = 'all';   // فیلتر فعال

const filtersBox = el('div', 'filters');
const listBox = el('div', 'news-grid');

async function init() {
  try {
    files = await getData('downloads');
    if (files.length === 0) {
      view.replaceChildren(el('p', 'muted', 'هنوز فایلی قرار داده نشده است.'));
      return;
    }
    view.replaceChildren(filtersBox, listBox);
    renderFilters();
    renderList();
  } catch (error) {
    console.error(error);
    view.replaceChildren(el('p', 'muted', 'بارگذاری فایل‌ها ممکن نشد.'));
  }
}

function renderFilters() {
  filtersBox.replaceChildren();
  const used = Object.entries(DOWNLOAD_CATEGORIES).filter(([key]) => files.some(file => file.category === key));
  for (const [key, label] of [['all', 'همه'], ...used]) {
    const button = el('button', key === current ? 'active' : '', label);
    button.addEventListener('click', () => {
      current = key;
      renderFilters();
      renderList();
    });
    filtersBox.append(button);
  }
}

function downloadCard(item) {
  const card = el('div', 'card download-card');
  const meta = [DOWNLOAD_CATEGORIES[item.category] || 'سایر', formatSize(item.size)].filter(Boolean).join(' · ');
  card.append(el('span', 'file-ext', (item.ext || '').toUpperCase()), el('b', '', item.title), el('small', 'muted', meta));
  if (item.description) card.append(el('p', '', item.description));
  const link = el('a', 'btn small', 'دانلود');
  link.href = item.file;
  link.download = `${item.title}.${item.ext}`;   // نام فایل دانلودی همان عنوان است
  card.append(link);
  return card;
}

function renderList() {
  listBox.replaceChildren();
  [...files]
    .filter(file => current === 'all' || file.category === current)
    .sort((a, b) => b.id - a.id)                 // جدیدترین اول
    .forEach(file => listBox.append(downloadCard(file)));
}

init();
