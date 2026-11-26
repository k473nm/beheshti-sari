// کلید = مقداری که در honors.json می‌نویسیم، مقدار = برچسب نمایشی
const CATEGORIES = { olympiad: 'المپیاد', konkoor: 'کنکور', kharazmi: 'جشنواره خوارزمی', other: 'سایر' };

const view = document.getElementById('honors-view');
let honors = [];
let current = 'all';   // فیلتر فعال

const statsBox = el('div', 'stats');
const filtersBox = el('div', 'filters');
const listBox = el('div', 'news-grid');

async function init() {
  try {
    honors = await getData('honors');
    if (honors.length === 0) {
      view.replaceChildren(el('p', 'muted', 'هنوز افتخاری ثبت نشده است.'));
      return;
    }
    view.replaceChildren(statsBox, filtersBox, listBox);
    renderStats();
    renderFilters();
    renderList();
  } catch (error) {
    console.error(error);
    view.replaceChildren(el('p', 'muted', 'بارگذاری افتخارات ممکن نشد.'));
  }
}

// تعداد هر دسته، فقط دسته‌هایی که حداقل یک مورد دارند
function categoryCounts() {
  return Object.entries(CATEGORIES)
    .map(([key, label]) => [key, label, honors.filter(h => h.category === key).length])
    .filter(([, , count]) => count > 0);
}

function renderStats() {
  const items = [['همه‌ی افتخارات', honors.length], ...categoryCounts().map(([, label, n]) => [label, n])];
  for (const [label, count] of items) {
    const card = el('div', 'card stat');
        if (h.image) card.append(cardImage(h.image, h.title));
    const number = el('b', 'stat-num', faDigits(0));
    card.append(number, el('small', '', label));
    statsBox.append(card);
    countUp(number, count);
  }
}

// عدد از ۰ تا مقدار نهایی بالا می‌رود
function countUp(node, target) {
  const start = performance.now();
  const duration = 900;
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    node.textContent = faDigits(Math.round(target * t));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderFilters() {
  filtersBox.replaceChildren();
  const buttons = [['all', 'همه'], ...categoryCounts().map(([key, label]) => [key, label])];
  for (const [key, label] of buttons) {
    const button = el('button', key === current ? 'active' : '', label);
    button.addEventListener('click', () => {
      current = key;
      renderFilters();
      renderList();
    });
    filtersBox.append(button);
  }
}

function renderList() {
  listBox.replaceChildren();
  const shown = honors
    .filter(h => current === 'all' || h.category === current)
    .sort((a, b) => b.year - a.year);          // جدیدترین سال اول
  for (const h of shown) {
    const card = el('div', 'card honor-card');
    const meta = [faDigits(h.year), h.student].filter(Boolean).join(' · ');
    card.append(
      el('span', 'tag', CATEGORIES[h.category] || h.category),
      el('b', '', h.title),
      el('small', 'muted', meta)
    );
    if (h.description) card.append(el('p', '', h.description));
    listBox.append(card);
  }
}

init();
