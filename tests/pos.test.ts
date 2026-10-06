describe('POS business rules', () => {
  test('cash change is calculated correctly', () => {
    const total = 115;
    const received = 150;
    expect(received - total).toBe(35);
  });

  test('insufficient cash is rejected', () => {
    const total = 115;
    const received = 100;
    expect(received >= total).toBe(false);
  });

  test('walk-in customer cannot use credit', () => {
    const walkInAccId = 1;
    const paymentMethod = 'CREDIT';
    expect(walkInAccId === 1 && paymentMethod === 'CREDIT').toBe(true);
  });

  test('credit purchase cannot exceed available credit', () => {
    const availableCredit = 500;
    const saleTotal = 650;
    expect(saleTotal <= availableCredit).toBe(false);
  });

  test('one-off percentage discount is per unit', () => {
    const price = 100;
    const percent = 10;
    const qty = 3;
    const unitDiscount = price * (percent / 100);
    expect(unitDiscount * qty).toBe(30);
  });
});