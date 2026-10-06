describe('Reporting calculations', () => {
  test('gross profit is sales less cost', () => {
    expect(1000 - 650).toBe(350);
  });

  test('margin is gross profit divided by sales', () => {
    expect((350 / 1000) * 100).toBe(35);
  });

  test('VAT at 15 percent is calculated from taxable amount', () => {
    expect(1000 * 0.15).toBe(150);
  });
});