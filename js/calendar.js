const view = document.getElementById('calendar-view');
const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const TYPES = { exam: 'امتحان', holiday: 'تعطیلی', event: 'رویداد' };

async function init() {
  try {
    const events = await getData('events');
    view.replaceChildren();
    if (events.length === 0) {
      view.append(el('p', 'muted', 'هنوز رویدادی ثبت نشده است.'));
      return;
    }
    // تاریخ‌ها مثل 1405/09/25 هستند؛ ترتیب حروفی همان ترتیب زمانی است
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    let lastMonth = '';
    let list;
    for (const ev of sorted) {
      const [year, month] = ev.date.split('/');
      const key = `${year}/${month}`;
      if (key !== lastMonth) {          // ماه جدید → عنوان و لیست جدید
        view.append(el('h2', 'month-title', `${MONTHS[Number(month) - 1]} ${faDigits(year)}`));
        list = el('div', 'events');
        view.append(list);
        lastMonth = key;
      }
      list.append(eventRow(ev));
    }
  } catch (error) {
    console.error(error);
    view.replaceChildren(el('p', 'muted', 'بارگذاری تقویم ممکن نشد.'));
  }
}

function eventRow(ev) {
  const row = el('div', `event ${ev.type || 'event'}`);
  const day = el('div', 'event-day', faDigits(Number(ev.date.split('/')[2])));
  const body = el('div');
  const meta = [TYPES[ev.type] || TYPES.event];
  if (ev.endDate) meta.push(`تا ${faDigits(ev.endDate)}`);
  body.append(el('b', '', ev.title), el('br'), el('small', '', meta.join(' · ')));
  row.append(day, body);
  return row;
}

init();
