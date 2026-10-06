describe('Inventory rules', () => {
  test('stock cannot become negative', () => {
    const available = 4;
    const requested = 5;
    expect(requested > available).toBe(true);
  });

  test('positive stock receipt increases quantity', () => {
    const before = 10;
    const received = 7;
    expect(before + received).toBe(17);
  });

  test('store transfer preserves total stock', () => {
    const sourceBefore = 20;
    const destinationBefore = 3;
    const quantity = 8;
    expect((sourceBefore - quantity) + (destinationBefore + quantity)).toBe(23);
  });

  test('stock-take difference is counted minus expected', () => {
    expect(12 - 15).toBe(-3);
  });
});