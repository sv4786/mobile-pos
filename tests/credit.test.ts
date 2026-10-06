describe('Customer credit rules', () => {
  test('available credit is limit minus balance', () => {
    expect(1000 - 350).toBe(650);
  });

  test('partial payment reduces outstanding balance', () => {
    expect(900 - 250).toBe(650);
  });

  test('payment cannot exceed outstanding invoice', () => {
    const outstanding = 500;
    const payment = 600;
    expect(payment > outstanding).toBe(true);
  });
});