export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return { start, end };
}

export function getLast3Days(): { start: Date; end: Date } {
  return getDateRange(3);
}

export function getLast7Days(): { start: Date; end: Date } {
  return getDateRange(7);
}

export function getLast30Days(): { start: Date; end: Date } {
  return getDateRange(30);
}
