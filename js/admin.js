// ---------- تنظیمات ----------
const OWNER = 'k473nm';
const REPO = 'beheshti-sari';
const BRANCH = 'main';

let token = sessionStorage.getItem('gh_token') || localStorage.getItem('gh_token') || '';

const loginBox = document.getElementById('login-box');
const panel = document.getElementById('panel');
const form = document.getElementById('news-form');
const list = document.getElementById('news-list');
const preview = document.getElementById('preview');
const statusBox = document.getElementById('status');

function setStatus(text, isError = false) {
  statusBox.textContent = text;
  statusBox.className = 'status' + (isError ? ' error' : '');
}

function explain(error) {
  if (error instanceof TypeError) return 'اتصال به api.github.com برقرار نشد (اینترنت یا فیلتر).';
  if (error.status === 401) return 'توکن معتبر نیست یا منقضی شده است.';
  if (error.status === 403) return 'دسترسی کافی نیست. در تنظیمات توکن، Contents را روی Read and write بگذار.';
  if (error.status === 404) return 'مخزن پیدا نشد یا توکن به آن دسترسی ندارد.';
  if (error.status === 409 || error.status === 422) return 'فایل همزمان تغییر کرده. صفحه را رفرش کن و دوباره امتحان کن.';
  return error.message || 'خطای ناشناخته.';
}

// ---------- ارتباط با API گیت‌هاب ----------
async function api(path, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    }
  });
  if (!response.ok) {
    const info = await response.json().catch(() => ({}));
    const error = new Error(info.message || `خطا ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
const textToBase64 = text => toBase64(new TextEncoder().encode(text));
const base64ToText = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));

async function readJson(path) {
  const file = await api(`/contents/${path}?ref=${BRANCH}`);
  return { data: JSON.parse(base64ToText(file.content)), sha: file.sha };
}

function writeFile(path, base64Content, message, sha) {
  return api(`/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: base64Content, branch: BRANCH, ...(sha ? { sha } : {}) })
  });
}

// ---------- ابزارها ----------
function todayJalali() {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}/${get('month')}/${get('day')}`;
}

// کوچک کردن عکس قبل از آپلود (حداکثر عرض ۱۲۰۰ پیکسل)
function resizeImage(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('تبدیل عکس ناموفق بود.')), 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('فایل عکس معتبر نیست.'));
    img.src = url;
  });
}

// ---------- ورود و خروج ----------
function showPanel(repoName) {
  loginBox.hidden = true;
  panel.hidden = false;
  document.getElementById('repo-name').textContent = repoName;
  form.elements.date.value = todayJalali();
  loadNews();
}

document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  token = document.getElementById('token').value.trim();
  setStatus('در حال بررسی توکن...');
  try {
    const repo = await api('');
    (document.getElementById('remember').checked ? localStorage : sessionStorage).setItem('gh_token', token);
    setStatus('');
    showPanel(repo.full_name);
  } catch (error) {
    token = '';
    setStatus(explain(error), true);
  }
});

document.getElementById('logout').addEventListener('click', () => {
  sessionStorage.removeItem('gh_token');
  localStorage.removeItem('gh_token');
  location.reload();
});

if (token) {   // ورود خودکار با توکن ذخیره‌شده
  api('').then(repo => showPanel(repo.full_name)).catch(() => {
    sessionStorage.removeItem('gh_token');
    localStorage.removeItem('gh_token');
  });
}

// ---------- اخبار ----------
async function loadNews() {
  try {
    const { data } = await readJson('data/news.json');
    list.replaceChildren();
    for (const item of data) {
      const row = el('div', 'admin-row');
      const del = el('button', 'danger', 'حذف');
      del.type = 'button';
      del.addEventListener('click', () => deleteNews(item.id));
      row.append(el('span', '', `${item.date} — ${item.title}`), del);
      list.append(row);
    }
    if (data.length === 0) list.append(el('p', 'muted', 'خبری ثبت نشده است.'));
  } catch (error) {
    setStatus(explain(error), true);
  }
}

async function deleteNews(id) {
  if (!confirm('این خبر حذف شود؟')) return;
  try {
    const { data, sha } = await readJson('data/news.json');
    const rest = data.filter(n => n.id !== id);
    await writeFile('data/news.json', textToBase64(JSON.stringify(rest, null, 2)), `Delete news ${id}`, sha);
    setStatus('حذف شد. تا یکی دو دقیقه دیگر از سایت هم برداشته می‌شود.');
    loadNews();
  } catch (error) {
    setStatus(explain(error), true);
  }
}

form.elements.image.addEventListener('change', () => {
  const file = form.elements.image.files[0];
  preview.hidden = !file;
  if (file) preview.src = URL.createObjectURL(file);
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const f = form.elements;
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  setStatus('در حال ذخیره...');
  try {
    const { data, sha } = await readJson('data/news.json');
    const item = {
      id: data.reduce((max, n) => Math.max(max, n.id), 0) + 1,
      title: f.title.value.trim(),
      date: f.date.value.trim(),
      summary: f.summary.value.trim()
    };
    const body = f.body.value.replace(/\r\n/g, '\n').trim();
    if (body) item.body = body;

    const file = f.image.files[0];
    if (file) {
      const blob = await resizeImage(file);
      const path = `images/news/news-${Date.now()}.jpg`;
      await writeFile(path, toBase64(new Uint8Array(await blob.arrayBuffer())), 'Add news image');
      item.image = path;
    }

    data.unshift(item);   // جدیدترین بالای لیست
    await writeFile('data/news.json', textToBase64(JSON.stringify(data, null, 2)), `Add news ${item.id}`, sha);
    form.reset();
    preview.hidden = true;
    f.date.value = todayJalali();
    setStatus('ثبت شد. تا یکی دو دقیقه دیگر روی سایت دیده می‌شود.');
    loadNews();
  } catch (error) {
    setStatus(explain(error), true);
  } finally {
    button.disabled = false;
  }
});
