export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')      // убрать спецсимволы
    .replace(/[\s_]+/g, '-')        // пробелы/подчёркивания → дефис
    .replace(/-+/g, '-')            // несколько дефисов → один
    .replace(/^-|-$/g, '')          // убрать дефисы по краям
    || 'element'
}
