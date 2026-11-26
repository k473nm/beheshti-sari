// پنل مدیریت: ورود، زبانه‌ها، و یک ویرایشگر عمومی که از روی SECTIONS ساخته می‌شود.

class FormError extends Error {}   // خطاهای اعتبارسنجی فرم (پیامشان مستقیم نمایش داده می‌شود)

const loginBox = document.getElementById('login-box');
const panel = document.getElementById('panel');
const tabsBox = document.getElementById('tabs');
const editorsBox = document.getElementById('editors');
const statusBox = document.getElementById('status');

// ---------- پیام‌ها ----------
function setStatus(text, isError = false) {
  statusBox.textContent = text;
  statusBox.className = 'status' + (isError ? ' error' : '');
}

function explain(error) {
  if (error instanceof FormError) return error.message;
  if (error.network) return 'اتصال به api.github.com برقرار نشد (اینترنت یا فیلتر).';
  switch (error.status) {
    case 401: return 'توکن معتبر نیست یا منقضی شده است.';
    case 403: return 'دسترسی کافی نیست. در تنظیمات توکن، Contents را روی Read and write بگذار.';
    case 404: return 'مخزن یا فایل پیدا نشد، یا توکن به آن دسترسی ندارد.';
    case 409:
    case 422: return 'فایل همزمان تغییر کرده است. دوباره امتحان کن.';
    default: return error.message || 'خطای ناشناخته.';
  }
}

// ---------- ابزارها ----------
function button(text, onClick, className = '') {
  const node = el('button', className, text);
  node.type = 'button';
  if (onClick) node.addEventListener('click', onClick);
  return node;
}

const nextId = data => data.reduce((max, item) => Math.max(max, item.id), 0) + 1;
const isUpload = field => field.kind === 'image' || field.kind === 'file';
const fileExtension = name => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

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
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new FormError('تبدیل عکس ناموفق بود.'))), 'image/jpeg', quality);
    };
    img.onerror = () => reject(new FormError('فایل عکس معتبر نیست.'));
    img.src = url;
  });
}

// نوع و حجم فایل را قبل از آپلود بررسی می‌کند
function checkUpload(file) {
  const ext = fileExtension(file.name);
  if (!UPLOAD_EXTENSIONS.includes(ext)) {
    throw new FormError(`نوع فایل «${ext || 'نامشخص'}» مجاز نیست. فقط: ${UPLOAD_EXTENSIONS.join('، ')}`);
  }
  if (file.size > UPLOAD_MAX_MB * 1024 * 1024) {
    throw new FormError(`حجم فایل (${formatSize(file.size)}) بیشتر از ${faDigits(UPLOAD_MAX_MB)} مگابایت است.`);
  }
}

// ---------- ساخت فیلد و اعتبارسنجی ----------
function buildField(field) {
  const wrapper = el('label', 'field');
  let input;
  if (field.kind === 'textarea') {
    input = el('textarea');
  } else if (field.kind === 'select') {
    input = el('select');
    for (const [value, label] of Object.entries(field.options)) input.append(new Option(label, value));
  } else {
    input = el('input');
    input.type = isUpload(field) ? 'file' : 'text';
    if (field.kind === 'image') input.accept = 'image/*';
    if (field.kind === 'file') input.accept = UPLOAD_EXTENSIONS.map(ext => `.${ext}`).join(',');
    if (['date', 'year', 'url'].includes(field.kind)) {
      input.dir = 'ltr';
      input.inputMode = field.kind === 'url' ? 'url' : 'numeric';
      input.placeholder = { date: '1405/09/04', year: '1404', url: 'https://' }[field.kind];
    }
  }
  wrapper.append(el('span', '', field.label), input);
  return { wrapper, input };
}

// مقدار خام فیلد را بررسی و تمیز می‌کند؛ فیلد خالیِ اختیاری undefined برمی‌گرداند
function parseField(field, raw) {
  const value = raw.trim();
  if (!value) {
    if (field.required) throw new FormError(`«${field.label}» را پر کن.`);
    return undefined;
  }
  if (field.kind === 'date') {
    const date = cleanDate(value);
    if (!isJalaliDate(date)) throw new FormError(`«${field.label}» باید تاریخ شمسی معتبر باشد، مثل 1405/09/04.`);
    return field.digits === 'fa' ? faDigits(date) : date;
  }
  if (field.kind === 'year') {
    const year = Number(toAscii(value));
    if (!Number.isInteger(year) || year < 1300 || year > 1500) throw new FormError('سال باید یک سال شمسی چهار رقمی باشد، مثل 1404.');
    return year;
  }
  if (field.kind === 'url') {
    if (!/^https?:\/\/\S+$/i.test(value)) throw new FormError('لینک باید یک آدرس معتبر باشد و با https:// شروع شود.');
    return value;
  }
  return value;
}

// ---------- ویرایشگر یک بخش ----------
function createEditor(config) {
  const uploadField = config.fields.find(isUpload);
  const controls = {};     // نام فیلد → عنصر ورودی
  let items = [];          // فهرست فعلی
  let editingId = null;    // null یعنی فرم «ثبت جدید» است

  const root = el('section', 'editor');
  const heading = el('h2');
  const form = el('form');
  form.noValidate = true;
  for (const field of config.fields) {
    const { wrapper, input } = buildField(field);
    controls[field.name] = input;
    form.append(wrapper);
  }

  // پیش‌نمایش عکس، یا نام و حجم فایل انتخاب‌شده
  const preview = el('img', 'preview');
  const fileInfo = el('p', 'muted');
  const keepNote = el('p', 'muted', 'مورد فعلی حفظ می‌شود؛ برای تعویض، فایل جدید انتخاب کن.');
  preview.alt = '';
  if (uploadField) {
    form.append(keepNote, fileInfo, preview);
    controls[uploadField.name].addEventListener('change', () => {
      const file = controls[uploadField.name].files[0];
      preview.hidden = !(file && uploadField.kind === 'image');
      if (!preview.hidden) preview.src = URL.createObjectURL(file);
      fileInfo.textContent = file && uploadField.kind === 'file' ? `${file.name} — ${formatSize(file.size)}` : '';
    });
  }

  const submit = el('button');
  submit.type = 'submit';
  const cancel = button('انصراف از ویرایش', () => resetForm(), 'secondary');
  const actions = el('div', 'form-actions');
  actions.append(submit, cancel);
  form.append(actions);

  const list = el('div');
  root.append(heading, form, el('h2', '', `${config.noun}\u200cهای ثبت‌شده`), list);

  // --- حالت‌های فرم ---
  function resetForm() {
    editingId = null;
    form.reset();
    for (const field of config.fields) {
      if (field.today) controls[field.name].value = field.digits === 'fa' ? faDigits(todayJalali()) : todayJalali();
      if (field.currentYear) controls[field.name].value = todayJalali().slice(0, 4);
    }
    preview.hidden = true;
    fileInfo.textContent = '';
    keepNote.hidden = true;
    cancel.hidden = true;
    heading.textContent = `${config.noun} جدید`;
    submit.textContent = `ثبت ${config.noun}`;
  }

  function startEdit(item) {
    resetForm();
    editingId = item.id;
    for (const field of config.fields) {
      if (!isUpload(field)) controls[field.name].value = item[field.name] ?? '';
    }
    keepNote.hidden = !(uploadField && item[uploadField.name]);
    cancel.hidden = false;
    heading.textContent = `ویرایش ${config.noun}`;
    submit.textContent = 'ذخیره‌ی تغییرات';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- خواندن فرم ---
  function readValues() {
    const values = {};
    for (const field of config.fields) {
      if (isUpload(field)) continue;
      const value = parseField(field, controls[field.name].value.replace(/\r\n/g, '\n'));
      if (value !== undefined) values[field.name] = value;
    }
    if (uploadField) {
      const file = controls[uploadField.name].files[0];
      if (!file && uploadField.required && editingId === null) {
        throw new FormError(`لطفاً یک ${uploadField.kind === 'file' ? 'فایل' : 'عکس'} انتخاب کن.`);
      }
      if (file && uploadField.kind === 'file') checkUpload(file);
    }
    const problem = config.validate?.(values);
    if (problem) throw new FormError(problem);
    return values;
  }

  // --- ذخیره ---
  async function save(values) {
    const { data, sha } = await github.readJson(config.file);   // همیشه آخرین نسخه‌ی فایل
    const existing = editingId === null ? {} : data.find(entry => entry.id === editingId);
    if (!existing) throw new FormError('این مورد دیگر وجود ندارد. صفحه را رفرش کن.');

    // فایل یا عکس قبلی (با ext و size) حفظ می‌شود، مگر اینکه مورد جدیدی انتخاب شود
    const kept = {};
    if (uploadField) {
      for (const key of [uploadField.name, 'ext', 'size']) {
        if (existing[key] !== undefined) kept[key] = existing[key];
      }
    }
    const item = { id: editingId ?? nextId(data), ...kept, ...values };

    const oldPath = uploadField ? existing[uploadField.name] : undefined;
    const file = uploadField && controls[uploadField.name].files[0];
    if (file) {
      const isImage = uploadField.kind === 'image';
      const ext = isImage ? 'jpg' : fileExtension(file.name);
      const path = `${uploadField.folder}/${Date.now()}.${ext}`;
      await github.uploadBlob(path, isImage ? await resizeImage(file) : file, `Add ${config.noun} file`);
      item[uploadField.name] = path;
      if (!isImage) Object.assign(item, { ext, size: file.size });
    }

    const updated = editingId !== null
      ? data.map(entry => (entry.id === editingId ? item : entry))
      : config.addTo === 'start' ? [item, ...data] : [...data, item];

    await github.writeJson(config.file, updated, sha, `${editingId === null ? 'Add' : 'Edit'} ${config.noun} ${item.id}`);
    items = updated;

    // فایل جایگزین‌شده پاک شود (خطای احتمالی حذف مانع کار نشود)
    if (file && oldPath) await github.deleteFile(oldPath, `Replace ${config.noun} file`).catch(() => {});
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    submit.disabled = true;
    setStatus('در حال ذخیره...');
    try {
      await save(readValues());
      resetForm();
      renderList();
      setStatus('ثبت شد. تا یکی دو دقیقه دیگر روی سایت دیده می‌شود.');
    } catch (error) {
      setStatus(explain(error), true);
    } finally {
      submit.disabled = false;
    }
  });

  // --- حذف ---
  async function remove(item) {
    if (!confirm(`«${item.title}» حذف شود؟`)) return;
    try {
      const { data, sha } = await github.readJson(config.file);
      items = data.filter(entry => entry.id !== item.id);
      await github.writeJson(config.file, items, sha, `Delete ${config.noun} ${item.id}`);
      const path = uploadField && item[uploadField.name];
      if (path) await github.deleteFile(path, `Delete ${config.noun} file`).catch(() => {});   // خطای حذف فایل مانع کار نشود
      if (editingId === item.id) resetForm();
      renderList();
      setStatus('حذف شد. تا یکی دو دقیقه دیگر از سایت هم برداشته می‌شود.');
    } catch (error) {
      setStatus(explain(error), true);
    }
  }

  // --- فهرست ---
  function renderList() {
    list.replaceChildren();
    if (items.length === 0) {
      list.append(el('p', 'muted', `هنوز ${config.noun}ی ثبت نشده است.`));
      return;
    }
    for (const item of [...items].sort(config.sort ?? (() => 0))) {
      const row = el('div', 'admin-row');
      const rowActions = el('div', 'row-actions');
      rowActions.append(button('ویرایش', () => startEdit(item), 'secondary'), button('حذف', () => remove(item), 'danger'));
      row.append(el('span', '', config.describe(item)), rowActions);
      list.append(row);
    }
  }

  async function load() {
    try {
      items = (await github.readJson(config.file)).data;
      renderList();
    } catch (error) {
      setStatus(explain(error), true);
    }
  }

  resetForm();
  return { root, load };
}

// ---------- زبانه‌ها ----------
function buildPanel() {
  const tabs = {};
  const editors = {};

  function showTab(active) {
    for (const key of Object.keys(SECTIONS)) {
      tabs[key].classList.toggle('active', key === active);
      editors[key].root.hidden = key !== active;
    }
  }

  for (const [key, config] of Object.entries(SECTIONS)) {
    editors[key] = createEditor(config);
    tabs[key] = button(config.label, () => showTab(key), 'tab');
    tabsBox.append(tabs[key]);
    editorsBox.append(editors[key].root);
    editors[key].load();
  }
  showTab(Object.keys(SECTIONS)[0]);
}

// ---------- ورود و خروج ----------
function clearToken() {
  sessionStorage.removeItem('gh_token');
  localStorage.removeItem('gh_token');
}

function showPanel(repoName) {
  loginBox.hidden = true;
  panel.hidden = false;
  document.getElementById('repo-name').textContent = repoName;
  buildPanel();
}

document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  github.token = document.getElementById('token').value.trim();
  setStatus('در حال بررسی توکن...');
  try {
    const repo = await github.checkAccess();
    (document.getElementById('remember').checked ? localStorage : sessionStorage).setItem('gh_token', github.token);
    setStatus('');
    showPanel(repo.full_name);
  } catch (error) {
    github.token = '';
    setStatus(explain(error), true);
  }
});

document.getElementById('logout').addEventListener('click', () => {
  clearToken();
  location.reload();
});

// ورود خودکار با توکن ذخیره‌شده
const savedToken = sessionStorage.getItem('gh_token') || localStorage.getItem('gh_token');
if (savedToken) {
  github.token = savedToken;
  github.checkAccess()
    .then(repo => showPanel(repo.full_name))
    .catch(error => {
      if (error.status === 401) clearToken();   // فقط توکن نامعتبر پاک شود، نه خطای اینترنت
      setStatus(explain(error), true);
    });
}
