const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParam(value, boundary) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (boundary === 'end' && DATE_ONLY_PATTERN.test(value)) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export function parseDateRange({ startDate, endDate }) {
  return {
    start: parseDateParam(startDate, 'start'),
    end: parseDateParam(endDate, 'end')
  };
}

export function inRange(dateValue, start, end) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function applyDateRangeFilters(query, column, startDate, endDate) {
  const { start, end } = parseDateRange({ startDate, endDate });
  let next = query;

  if (start) next = next.gte(column, start.toISOString());
  if (end) next = next.lte(column, end.toISOString());

  return next;
}
