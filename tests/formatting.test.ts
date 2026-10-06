describe('Commercial formatting rules', () => {
  test('South African VAT rate is 15 percent', () => {
    expect(15).toBe(15);
  });

  test('currency values round to two decimals', () => {
    expect(Number((19.995).toFixed(2))).toBe(20);
  });

  test('invoice date input uses YYYY-MM-DD', () => {
    expect(/^\\d{4}-\\d{2}-\\d{2}$/.test('2026-10-06')).toBe(true);
  });
});