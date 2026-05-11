/** Workaround for mobile browsers shifting scroll on input blur */
export function resetScrollOnBlur(): void {
  window.scrollTo(0, 0);
}
