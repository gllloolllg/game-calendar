export function renderCalendar(rootElement, state, onMonthChange, onDateClick, onLogout) {

  const { year, month, availability, currentUserId } = state;

  // Helpers
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)

  const prevMonthDays = new Date(year, month, 0).getDate();

  // Generate Days
  const dates = [];

  // Previous Month Padding
  for (let i = firstDayIndex; i > 0; i--) {
    dates.push({
      day: prevMonthDays - i + 1,
      currentMonth: false,
      dateStr: '' // Not interactive for simplicity
    });

  }

  // Current Month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    dates.push({
      day: i,
      currentMonth: true,
      dateStr: dateStr
    });
  }

  // Next Month Padding
  const totalCells = 42; // 6 rows * 7 cols to keep grid stable
  const remaining = totalCells - dates.length;
  for (let i = 1; i <= remaining; i++) {
    dates.push({
      day: i,
      currentMonth: false,
      dateStr: ''
    });
  }

  // Render HTML
  const monthName = new Date(year, month).toLocaleString('ja-JP', { year: 'numeric', month: 'long' });

  rootElement.innerHTML = `
    <div class="calendar-screen">
      <button id="logoutBtn" class="btn-logout">ログアウト</button>
      <div class="cal-header">
        <button id="prevMonth" class="cal-nav-btn">&lt;</button>
        <div class="month-label">${monthName}</div>
        <button id="nextMonth" class="cal-nav-btn">&gt;</button>
      </div>
      
      <div class="cal-grid">
        <div class="day-name sun">日</div>
        <div class="day-name">月</div>
        <div class="day-name">火</div>
        <div class="day-name">水</div>
        <div class="day-name">木</div>
        <div class="day-name">金</div>
        <div class="day-name sat">土</div>
        
        ${dates.map(d => renderDayCell(d, availability, currentUserId)).join('')}
      </div>

      <div class="legend">
        <div class="legend-item"><div class="day-cell legend-sample selected-by-me"></div>あなた</div>
        <div class="legend-item"><div class="legend-dot" style="background:var(--color-user2)"></div>相手</div>
        <div class="legend-item"><div class="day-cell legend-sample highlight-match" style="border-color:var(--color-both);"></div>一致</div>
      </div>
    </div>
  `;

  // Event Listeners for Nav
  rootElement.querySelector('#prevMonth').addEventListener('click', () => onMonthChange(-1));
  rootElement.querySelector('#nextMonth').addEventListener('click', () => onMonthChange(1));
  rootElement.querySelector('#logoutBtn').addEventListener('click', onLogout);

  // Event Listeners for Cells
  rootElement.querySelectorAll('.day-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const date = cell.dataset.date;
      if (!date) return;
      onDateClick(date);
    });
  });
}

function renderDayCell(dateObj, availability, currentUserId) {
  if (!dateObj.currentMonth) {
    return `<div class="day-cell other-month"><span class="day-num">${dateObj.day}</span></div>`;
  }

  const dateDate = new Date(dateObj.dateStr);
  const dayOfWeek = dateDate.getDay();

  let classes = ['day-cell'];
  if (dayOfWeek === 0) classes.push('sun');
  if (dayOfWeek === 6) classes.push('sat');

  // Check availability
  const dayAvailability = availability.filter(a => a.date === dateObj.dateStr);
  const myMark = dayAvailability.some(a => a.userId === currentUserId);
  const otherMarks = dayAvailability.filter(a => a.userId !== currentUserId);

  // 1. Current User -> Background
  if (myMark) {
    classes.push('selected-by-me');
  }

  // 1.5 Overlap -> Border
  if (myMark && otherMarks.length > 0) {
    classes.push('highlight-match');
  }

  // 2. Others -> Dots
  let indicatorsHtml = '';
  if (otherMarks.length > 0) {
    indicatorsHtml += `<div class="indicators">`;
    // For every other mark, show a dot. 
    otherMarks.forEach(_ => {
      indicatorsHtml += `<div class="dot u2"></div>`;
    });
    indicatorsHtml += `</div>`;
  }

  return `
    <div class="${classes.join(' ')}" data-date="${dateObj.dateStr}">
      <span class="day-num">${dateObj.day}</span>
      ${indicatorsHtml}
    </div>
  `;
}
