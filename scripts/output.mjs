// Presentation helpers only; never used inside a calculation.
export function preview(result) {
  if (Array.isArray(result) && result.length > 3) {
    return {preview: true, totalDays: result.length, displayedDays: 3, days: result.slice(0, 3)};
  }
  if (Array.isArray(result?.days) && result.days.length > 3) {
    return {...result, preview: true, totalDays: result.days.length, displayedDays: 3, days: result.days.slice(0, 3)};
  }
  return result;
}

// Snapshot published-minute/date/status outputs, without platform-sensitive raw
// floating-point geometry. These are model regressions, not reference calendars.
export function renderedProjection(value, path = '') {
  const rows = [];
  if (value === null) return [[path, null]];
  if (typeof value === 'string') {
    const key = path.split('.').at(-1);
    if (/^\d{2}:\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value) ||
        ['status', 'reason', 'code'].includes(key)) rows.push([path, value]);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => rows.push(...renderedProjection(item, `${path}[${index}]`)));
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value).sort()) {
      if (/raw|unrounded/i.test(key)) continue;
      rows.push(...renderedProjection(value[key], path ? `${path}.${key}` : key));
    }
  }
  return rows;
}
