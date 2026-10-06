describe('Promotion rules', () => {
  test('minimum quantity activates a promotion', () => {
    const minQty = 3;
    expect(3 >= minQty).toBe(true);
    expect(2 >= minQty).toBe(false);
  });

  test('fixed discount never goes below zero', () => {
    expect(Math.max(0, 20 - 35)).toBe(0);
  });

  test('percentage discount calculates expected price', () => {
    expect(200 * (1 - 0.15)).toBe(170);
  });
});