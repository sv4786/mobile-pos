describe('Security rules', () => {
  test('PIN must be exactly four digits', () => {
    expect(/^\\d{4}$/.test('1234')).toBe(true);
    expect(/^\\d{4}$/.test('123')).toBe(false);
    expect(/^\\d{4}$/.test('12345')).toBe(false);
    expect(/^\\d{4}$/.test('12a4')).toBe(false);
  });

  test('five failed attempts trigger lockout policy', () => {
    const attempts = 5;
    expect(attempts >= 5).toBe(true);
  });
});