// تعریف بخش‌های پنل. برای افزودن یک بخش جدید (مثلاً دبیران) فقط یک مورد به SECTIONS اضافه کن.
//
// kind: text | textarea | select | date | year | image
// addTo: 'start' = جدیدترین بالای فایل، 'end' = ته فایل (سایت خودش مرتب می‌کند)

// ---------- ابزارهای عدد و تاریخ ----------
const toAscii = text => String(text)
  .replace(/[۰-۹]/g, digit => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
  .replace(/[٠-٩]/g, digit => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit));

// هر ورودی مثل ۱۴۰۵/۹/۴ یا 1405-09-04 را به 1405/09/04 تبدیل می‌کند
function cleanDate(value) {
  const [year = '', month = '', day = ''] = toAscii(value).trim().replace(/[-.]/g, '/').split('/');
  return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
}

function isJalaliDate(value) {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  return year >= 1300 && year <= 1500 && month >= 1 && month <= 12 && day >= 1 && day <= (month <= 6 ? 31 : 30);
}

function todayJalali() {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = type => toAscii(parts.find(p => p.type === type).value);
  return `${part('year')}/${part('month')}/${part('day')}`;
}

// ---------- بخش‌ها ----------
const SECTIONS = {
  news: {
    label: 'اخبار',
    noun: 'خبر',
    file: 'data/news.json',
    addTo: 'start',
    describe: item => `${item.date} — ${item.title}`,
    fields: [
      { name: 'title', label: 'عنوان', kind: 'text', required: true },
      { name: 'date', label: 'تاریخ (شمسی)', kind: 'date', required: true, digits: 'fa', today: true },
      { name: 'summary', label: 'خلاصه (روی کارت خبر نمایش داده می‌شود)', kind: 'text', required: true },
      { name: 'body', label: 'متن کامل (هر خط خالی یک پاراگراف جدید می‌سازد)', kind: 'textarea' },
      { name: 'image', label: 'عکس (اختیاری)', kind: 'image', folder: 'images/news' }
    ]
  },

  honors: {
    label: 'افتخارات',
    noun: 'افتخار',
    file: 'data/honors.json',
    addTo: 'end',
    sort: (a, b) => b.year - a.year,
       { name: 'description', label: 'توضیح (اختیاری)', kind: 'textarea' },
      { name: 'image', label: 'عکس (اختیاری)', kind: 'image', folder: 'images/honors' }
    fields: [
      { name: 'title', label: 'عنوان افتخار', kind: 'text', required: true },
      { name: 'category', label: 'دسته', kind: 'select', required: true, options: HONOR_CATEGORIES },
      { name: 'year', label: 'سال (شمسی)', kind: 'year', required: true, currentYear: true },
      { name: 'student', label: 'نام دانش‌آموز (اختیاری؛ فقط با رضایت خودش و خانواده)', kind: 'text' },
      { name: 'description', label: 'توضیح (اختیاری)', kind: 'textarea' }
    ]
  },

  events: {
    label: 'تقویم',
    noun: 'رویداد',
    file: 'data/events.json',
    addTo: 'end',
    sort: (a, b) => a.date.localeCompare(b.date),
    describe: item => `${faDigits(item.date)} — ${item.title}`,
    validate: values => (values.endDate && values.endDate < values.date ? 'تاریخ پایان نباید قبل از تاریخ شروع باشد.' : ''),
    fields: [
      { name: 'title', label: 'عنوان رویداد', kind: 'text', required: true },
      { name: 'type', label: 'نوع', kind: 'select', required: true, options: EVENT_TYPES },
      { name: 'date', label: 'تاریخ شروع (مثل 1405/09/04)', kind: 'date', required: true, digits: 'en', today: true },
      { name: 'endDate', label: 'تاریخ پایان (اختیاری؛ برای رویداد چندروزه)', kind: 'date', digits: 'en' }
    ]
  }
};
