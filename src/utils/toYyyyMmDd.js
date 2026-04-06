/** Нормализация даты к yyyy-mm-dd (input type=date, dd.MM.yyyy, ISO). */
export function toYyyyMmDd(value) {
  if (value == null || value === "") return null;
  let str = String(value).trim();
  if (str.includes("T")) str = str.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return null;
}
