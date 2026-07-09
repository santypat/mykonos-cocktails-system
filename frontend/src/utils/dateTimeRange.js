export function toDateTimeParam(date) {
  if (!date) return '';
  return date.toISOString();
}

export function formatDateTimeLocal(date) {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getTodayDateTimeRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 0, 0);

  return {
    startDate: formatDateTimeLocal(start),
    endDate: formatDateTimeLocal(end)
  };
}

export function toDateTimeInputParam(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString();
}
