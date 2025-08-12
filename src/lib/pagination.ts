export function generatePagination(currentPage: number, totalPages: number) {
  const delta = 2; // Number of pages to show around the current page
  const range = [];
  const rangeWithDots = [];
  let l;

  range.push(1); // Always include the first page

  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    if (i < totalPages && i > 1) {
      range.push(i);
    }
  }
  range.push(totalPages); // Always include the last page

  range.sort((a, b) => a - b); // Ensure numbers are sorted

  for (let i = 0; i < range.length; i++) {
    if (l) {
      if (range[i] - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (range[i] - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(range[i]);
    l = range[i];
  }

  return rangeWithDots;
}