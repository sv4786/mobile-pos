import * as SQLite from 'expo-sqlite';
import { Product, Store, Customer, Quote, Invoice, Promotion } from './types';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    const opened = await SQLite.openDatabaseAsync('mobile_pos.db');
    await initDatabaseSchema(opened);
    db = opened;
    return opened;
  })();

  try {
    return await dbInitPromise;
  } finally {
    dbInitPromise = null;
  }
}

async function initDatabaseSchema(d: SQLite.SQLiteDatabase) {
  await d.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS store (
      StoreId INTEGER PRIMARY KEY,
      StoreCode TEXT,
      StoreDesc TEXT,
      Tel TEXT,
      Cell TEXT,
      Email TEXT,
      IsOnLine REAL
    );

    CREATE TABLE IF NOT EXISTS initem (
      ItemId INTEGER PRIMARY KEY,
      ItemCode TEXT,
      ItemDesc TEXT,
      SizeTypeId INTEGER,
      ColourTypeId INTEGER,
      PackSize REAL,
      Vat TEXT,
      IsScannable REAL
    );

    CREATE TABLE IF NOT EXISTS instock (
      ItemId INTEGER,
      StockId INTEGER,
      StockCode TEXT,
      ColourId INTEGER,
      SizeId INTEGER,
      IsActive REAL,
      PRIMARY KEY (ItemId, StockId)
    );

    CREATE TABLE IF NOT EXISTS incolour (
      ColourId INTEGER PRIMARY KEY,
      ColourCode TEXT,
      ColourDesc TEXT
    );

    CREATE TABLE IF NOT EXISTS insize (
      SizeId INTEGER PRIMARY KEY,
      SizeCode TEXT,
      Size TEXT,
      SizeDesc TEXT
    );

    CREATE TABLE IF NOT EXISTS instockbarcode (
      ItemId INTEGER,
      StockId INTEGER,
      BarcodeId INTEGER,
      Barcode TEXT,
      IsActive REAL
    );

    CREATE TABLE IF NOT EXISTS inprice (
      ItemId INTEGER,
      StockId INTEGER,
      LastCost REAL,
      AvgCost REAL,
      POSPrice1 REAL,
      SellPrice1 REAL,
      PRIMARY KEY (ItemId, StockId)
    );

    CREATE TABLE IF NOT EXISTS inqty (
      ItemId INTEGER,
      StockId INTEGER,
      StoreId INTEGER,
      QtyOnHand REAL,
      PRIMARY KEY (ItemId, StockId, StoreId)
    );

    CREATE TABLE IF NOT EXISTS aracc (
      AccId INTEGER PRIMARY KEY,
      AccCode TEXT,
      Company TEXT,
      Contact TEXT,
      Tel TEXT,
      Cell TEXT,
      Email TEXT,
      PriceListId INTEGER,
      AutoDisc REAL,
      AllowPriceMatrix REAL,
      CrLimit REAL
    );

    CREATE TABLE IF NOT EXISTS arpmatrix (
      AccId INTEGER,
      ItemId INTEGER,
      StockId INTEGER,
      Price REAL,
      IsActive REAL
    );

    CREATE TABLE IF NOT EXISTS inpromotion (
      PromotionId INTEGER PRIMARY KEY,
      PromotionDesc TEXT,
      FromText TEXT,
      ToText TEXT,
      IsActive REAL
    );

    CREATE TABLE IF NOT EXISTS inpromotionitem (
      PromotionId INTEGER,
      ItemId INTEGER,
      StockId INTEGER,
      Price REAL,
      PromotionLimit REAL,
      DiscountType TEXT DEFAULT 'PRICE',
      DiscountValue REAL DEFAULT 0,
      MinQty REAL DEFAULT 1,
      IsActive REAL
    );

    CREATE TABLE IF NOT EXISTS inpromotionstore (
      PromotionId INTEGER,
      StoreId INTEGER,
      IsActive REAL
    );

    CREATE TABLE IF NOT EXISTS inqulist (
      AccId INTEGER,
      StoreId INTEGER,
      Company TEXT,
      DAddress TEXT,
      QuoteNo TEXT PRIMARY KEY,
      Date TEXT,
      TradingDate TEXT,
      OrderNo TEXT,
      RepId INTEGER,
      QUStatus TEXT,
      SubTotal REAL,
      VatTotal REAL,
      DiscPerc REAL,
      Discount REAL,
      VatPerc REAL,
      Message TEXT,
      Notes TEXT,
      CreatedBy TEXT,
      CreatedDt TEXT,
      SerialNo TEXT,
      Posted TEXT,
      PdfPath TEXT
    );

    CREATE TABLE IF NOT EXISTS inqustock (
      TransSerialNo TEXT,
      TrNo TEXT,
      ItemId INTEGER,
      StockId INTEGER,
      ItemDesc TEXT,
      Qty REAL,
      UnitExcl REAL,
      UnitIncl REAL,
      VatAmount REAL,
      Vat TEXT,
      DiscPerc REAL,
      Amount REAL,
      CreatedBy TEXT,
      CreatedDt TEXT,
      PromotionId INTEGER
    );

    CREATE TABLE IF NOT EXISTS ininvlist (
      AccId INTEGER,
      StoreId INTEGER,
      Company TEXT,
      DAddress TEXT,
      INVNo TEXT PRIMARY KEY,
      OrderNo TEXT,
      RepId INTEGER,
      SubTotal REAL,
      VatTotal REAL,
      DiscPerc REAL,
      Discount REAL,
      VatPerc REAL,
      AmtPaid REAL,
      PTypeId INTEGER,
      PMRef TEXT,
      Notes TEXT,
      IsQuote REAL,
      CreatedBy TEXT,
      CreatedDt TEXT,
      Posted TEXT,
      SerialNo TEXT,
      PdfPath TEXT
    );

    CREATE TABLE IF NOT EXISTS ininvstock (
      TransSerialNo TEXT,
      TrNo TEXT,
      ItemId INTEGER,
      StockId INTEGER,
      ItemDesc TEXT,
      Qty REAL,
      CostPrice REAL,
      UnitExcl REAL,
      UnitIncl REAL,
      VatAmount REAL,
      Vat TEXT,
      DiscPerc REAL,
      Amount REAL,
      CreatedBy TEXT,
      CreatedDt TEXT,
      PromotionId INTEGER
    );

    CREATE TABLE IF NOT EXISTS instocktake (
      StoreId INTEGER,
      StockTakeId INTEGER PRIMARY KEY,
      StockTakeNo TEXT,
      StockTakeText TEXT,
      CreatedDt TEXT,
      CreatedBy TEXT,
      Posted TEXT
    );

    CREATE TABLE IF NOT EXISTS arreps (
      RepId INTEGER PRIMARY KEY,
      StoreId INTEGER,
      RepCode TEXT,
      FullName TEXT
    );

    CREATE TABLE IF NOT EXISTS instockmovement (
      MovementId INTEGER PRIMARY KEY,
      StoreId INTEGER,
      ItemId INTEGER,
      StockId INTEGER,
      MovementType TEXT,
      Quantity REAL,
      BalanceBefore REAL,
      BalanceAfter REAL,
      ReferenceNo TEXT,
      Notes TEXT,
      RelatedStoreId INTEGER,
      CreatedBy TEXT,
      CreatedDt TEXT
    );

    CREATE TABLE IF NOT EXISTS araccounttransaction (
      TransactionId INTEGER PRIMARY KEY,
      AccId INTEGER NOT NULL,
      TransactionType TEXT NOT NULL,
      RefNo TEXT,
      InvoiceNo TEXT,
      Debit REAL DEFAULT 0,
      Credit REAL DEFAULT 0,
      Balance REAL DEFAULT 0,
      Notes TEXT,
      CreatedBy TEXT,
      CreatedDt TEXT
    );

    CREATE TABLE IF NOT EXISTS instocktakeline (
      StockTakeId INTEGER,
      ItemId INTEGER,
      StockId INTEGER,
      ExpectedQty REAL,
      CountedQty REAL,
      Difference REAL,
      CreatedDt TEXT,
      PRIMARY KEY (StockTakeId, ItemId, StockId)
    );
  `);

  const ensureColumn = async (table: string, column: string) => {
    const columns = await d.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    if (columns.some(existing => existing.name.toLowerCase() === column.toLowerCase())) return;

    try {
      await d.runAsync(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (!message.toLowerCase().includes('duplicate column')) throw error;
    }
  };

  await ensureColumn('inqulist', 'PdfPath');
  await ensureColumn('ininvlist', 'PdfPath');
  await ensureColumn('inpromotionitem', 'DiscountType');
  await ensureColumn('inpromotionitem', 'DiscountValue');
  await ensureColumn('inpromotionitem', 'MinQty');
}

async function seedDatabase(d: SQLite.SQLiteDatabase) {
  const storeCheck = await d.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM store');
  if (storeCheck && storeCheck.count > 0) return;

  await d.execAsync(`
    INSERT INTO store (StoreId, StoreCode, StoreDesc, Tel, Email, IsOnLine) VALUES 
      (1, 'MAIN01', 'Central Superstore & Warehouse', '011-805-4422', 'contact@business.com', 1),
      (2, 'STORE02', 'Downtown Retail Branch', '031-301-9988', 'branch2@business.com', 1),
      (3, 'STORE03', 'Westside Express Outlet', '021-555-1234', 'branch3@business.com', 1);

    INSERT INTO arreps (RepId, StoreId, RepCode, FullName) VALUES (1, 1, 'REP01', 'Sales Rep 01');

    INSERT INTO incolour (ColourId, ColourCode, ColourDesc) VALUES (1, '01', 'Standard'), (2, '02', 'Black / Steel');
    INSERT INTO insize (SizeId, SizeCode, Size, SizeDesc) VALUES (1, '01', 'Standard', 'Standard Pack');

    INSERT INTO initem (ItemId, ItemCode, ItemDesc, PackSize, Vat, IsScannable) VALUES 
      (4276, '5041', '10-in-1 Multi-Tool Stainless Steel', 10, 'Y', 1),
      (1001, '1001', 'Premium Heavy Duty Cabinet Handle 96mm', 10, 'Y', 1),
      (1002, '1002', 'Soft-Close Telescopic Drawer Slide 450mm', 1, 'Y', 1),
      (1003, '1003', 'Hydraulic Concealed Soft-Close Hinge', 1, 'Y', 1),
      (1004, '1004', 'Chrome Wire Pull-Out Corner Basket System', 1, 'Y', 1);

    INSERT INTO instock (ItemId, StockId, StockCode, ColourId, SizeId, IsActive) VALUES 
      (4276, 1, '504101', 1, 1, 1),
      (1001, 1, '100101', 1, 1, 1),
      (1002, 1, '100201', 1, 1, 1),
      (1003, 1, '100301', 1, 1, 1),
      (1004, 1, '100401', 1, 1, 1);

    INSERT INTO inprice (ItemId, StockId, LastCost, AvgCost, POSPrice1, SellPrice1) VALUES 
      (4276, 1, 17.46, 17.46, 29.99, 29.99),
      (1001, 1, 25.00, 25.00, 45.00, 45.00),
      (1002, 1, 75.00, 75.00, 120.00, 120.00),
      (1003, 1, 9.50, 9.50, 18.50, 18.50),
      (1004, 1, 520.00, 520.00, 850.00, 850.00);

    INSERT INTO inqty (ItemId, StockId, StoreId, QtyOnHand) VALUES 
      (4276, 1, 1, 250), (1001, 1, 1, 180), (1002, 1, 1, 95), (1003, 1, 1, 400), (1004, 1, 1, 45);

    INSERT INTO aracc (AccId, AccCode, Company, Contact, Tel, AutoDisc, AllowPriceMatrix) VALUES 
      (1, 'CASH', 'Walk-In Cash Customer', 'Over the counter', '000-000-0000', 0, 0),
      (2, 'BUILD01', 'BuildMax Construction Group', 'Dave Smith', '011-999-1234', 5, 1),
      (3, 'CABINET01', 'Custom Woodworks & Interiors', 'Sarah Jenkins', '021-888-5678', 10, 1);

    INSERT INTO arpmatrix (AccId, ItemId, StockId, Price, IsActive) VALUES (2, 1002, 1, 95.00, 1);

    INSERT INTO inpromotion (PromotionId, PromotionDesc, FromText, ToText, IsActive) VALUES (1, 'Seasonal Hardware Discount Sale', '2026-09-01', '2026-12-31', 1);
    INSERT INTO inpromotionitem (PromotionId, ItemId, StockId, Price, PromotionLimit, IsActive) VALUES (1, 1001, 1, 35.00, 100, 1);
    INSERT INTO inpromotionstore (PromotionId, StoreId, IsActive) VALUES (1, 1, 1);
  `);
}

// ----------------------------------------------------
// NATIVE REACT NATIVE DB REPOSITORY API
// ----------------------------------------------------

export const posDb = {
  getDbStats: async () => {
    const d = await getDb();
    const tables = [
      'initem', 'instock', 'inqty', 'aracc', 'inprice', 
      'arpmatrix', 'inpromotion', 'inqulist', 'inqustock',
      'ininvlist', 'ininvstock', 'store', 'arreps'
    ];
    const stats: Record<string, number> = {};
    for (const t of tables) {
      const res = await d.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM [${t}]`);
      stats[t] = res?.count || 0;
    }
    return stats;
  },

  getStores: async (): Promise<Store[]> => {
    const d = await getDb();
    return await d.getAllAsync<Store>("SELECT StoreId, StoreCode, StoreDesc, Tel, Cell, Email, IsOnLine FROM store ORDER BY StoreDesc");
  },

  getCustomers: async (q: string = ''): Promise<Customer[]> => {
    const d = await getDb();
    if (q) {
      const queryStr = `%${q}%`;
      return await d.getAllAsync<Customer>(`
        SELECT AccId, AccCode, Company, Contact, Tel, Cell, Email, PriceListId,
               COALESCE(AutoDisc, 0) as AutoDisc, COALESCE(AllowPriceMatrix, 0) as AllowPriceMatrix, CrLimit
        FROM aracc
        WHERE Company LIKE ? OR AccCode LIKE ? OR Contact LIKE ? OR Tel LIKE ? OR Cell LIKE ? OR Email LIKE ?
        ORDER BY Company LIMIT 50
      `, [queryStr, queryStr, queryStr, queryStr, queryStr, queryStr]);
    }
    return await d.getAllAsync<Customer>(`SELECT AccId, AccCode, Company, Contact, Tel, Cell, Email, PriceListId, COALESCE(AutoDisc, 0) as AutoDisc, COALESCE(AllowPriceMatrix, 0) as AllowPriceMatrix, CrLimit FROM aracc ORDER BY Company LIMIT 50`);
  },

  createCustomer: async (data: {
    code: string; company: string; contact?: string; tel?: string; cell?: string; email?: string;
    priceListId?: number; autoDisc?: number; allowPriceMatrix?: number; crLimit?: number;
  }) => {
    const d = await getDb();
    const code = data.code.trim();
    const company = data.company.trim();
    if (!code || !company) throw new Error('Customer code and company name are required.');
    const duplicate = await d.getFirstAsync<{ AccId: number }>('SELECT AccId FROM aracc WHERE AccCode = ? LIMIT 1', [code]);
    if (duplicate) throw new Error('A customer with this account code already exists.');
    const idRow = await d.getFirstAsync<{ nextId: number }>('SELECT COALESCE(MAX(AccId), 0) + 1 as nextId FROM aracc');
    const accId = idRow?.nextId || 1;
    const autoDisc = Number.isFinite(data.autoDisc) ? Math.max(0, Number(data.autoDisc)) : 0;
    const allowMatrix = data.allowPriceMatrix ? 1 : 0;
    const crLimit = Number.isFinite(data.crLimit) ? Math.max(0, Number(data.crLimit)) : 0;
    await d.runAsync(`
      INSERT INTO aracc (AccId, AccCode, Company, Contact, Tel, Cell, Email, PriceListId, AutoDisc, AllowPriceMatrix, CrLimit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [accId, code, company, data.contact?.trim() || '', data.tel?.trim() || '', data.cell?.trim() || '', data.email?.trim() || '', data.priceListId || null, autoDisc, allowMatrix, crLimit]);
    return await d.getFirstAsync<Customer>('SELECT AccId, AccCode, Company, Contact, Tel, Cell, Email, PriceListId, COALESCE(AutoDisc,0) AutoDisc, COALESCE(AllowPriceMatrix,0) AllowPriceMatrix, CrLimit FROM aracc WHERE AccId = ?', [accId]);
  },

  updateCustomer: async (accId: number, data: {
    code: string; company: string; contact?: string; tel?: string; cell?: string; email?: string;
    priceListId?: number; autoDisc?: number; allowPriceMatrix?: number; crLimit?: number;
  }) => {
    const d = await getDb();
    const code = data.code.trim();
    const company = data.company.trim();
    if (!code || !company) throw new Error('Customer code and company name are required.');
    const duplicate = await d.getFirstAsync<{ AccId: number }>('SELECT AccId FROM aracc WHERE AccCode = ? AND AccId <> ? LIMIT 1', [code, accId]);
    if (duplicate) throw new Error('Another customer already uses this account code.');
    const autoDisc = Number.isFinite(data.autoDisc) ? Math.max(0, Number(data.autoDisc)) : 0;
    const allowMatrix = data.allowPriceMatrix ? 1 : 0;
    const crLimit = Number.isFinite(data.crLimit) ? Math.max(0, Number(data.crLimit)) : 0;
    await d.runAsync(`
      UPDATE aracc SET AccCode = ?, Company = ?, Contact = ?, Tel = ?, Cell = ?, Email = ?,
        PriceListId = ?, AutoDisc = ?, AllowPriceMatrix = ?, CrLimit = ?
      WHERE AccId = ?
    `, [code, company, data.contact?.trim() || '', data.tel?.trim() || '', data.cell?.trim() || '', data.email?.trim() || '', data.priceListId || null, autoDisc, allowMatrix, crLimit, accId]);
    return await d.getFirstAsync<Customer>('SELECT AccId, AccCode, Company, Contact, Tel, Cell, Email, PriceListId, COALESCE(AutoDisc,0) AutoDisc, COALESCE(AllowPriceMatrix,0) AllowPriceMatrix, CrLimit FROM aracc WHERE AccId = ?', [accId]);
  },

  deleteCustomer: async (accId: number) => {
    const d = await getDb();
    if (accId === 1) throw new Error('The walk-in cash customer cannot be deleted.');
    const invoice = await d.getFirstAsync<{ count: number }>('SELECT COUNT(*) count FROM ininvlist WHERE AccId = ?', [accId]);
    const quote = await d.getFirstAsync<{ count: number }>('SELECT COUNT(*) count FROM inqulist WHERE AccId = ?', [accId]);
    if ((invoice?.count || 0) > 0 || (quote?.count || 0) > 0) {
      throw new Error('This customer has sales history and cannot be deleted.');
    }
    await d.runAsync('DELETE FROM arpmatrix WHERE AccId = ?', [accId]);
    await d.runAsync('DELETE FROM aracc WHERE AccId = ?', [accId]);
  },


  getCustomerAccount: async (accId: number) => {
    const d = await getDb();
    const customer = await d.getFirstAsync<Customer>(
      'SELECT AccId, AccCode, Company, Contact, Tel, Cell, Email, PriceListId, COALESCE(AutoDisc,0) AutoDisc, COALESCE(AllowPriceMatrix,0) AllowPriceMatrix, COALESCE(CrLimit,0) CrLimit FROM aracc WHERE AccId = ?',
      [accId]
    );
    if (!customer) throw new Error('Customer not found.');
    const row = await d.getFirstAsync<{ balance: number }>(
      'SELECT COALESCE(SUM(Debit - Credit),0) AS balance FROM araccounttransaction WHERE AccId = ?',
      [accId]
    );
    const balance = Math.round(Number(row?.balance || 0) * 100) / 100;
    return {
      customer,
      balance,
      availableCredit: Math.round(Math.max(0, Number(customer.CrLimit || 0) - balance) * 100) / 100,
    };
  },

  getCustomerAccountTransactions: async (accId: number) => {
    const d = await getDb();
    return await d.getAllAsync<any>(
      'SELECT TransactionId, AccId, TransactionType, RefNo, InvoiceNo, Debit, Credit, Balance, Notes, CreatedBy, CreatedDt FROM araccounttransaction WHERE AccId = ? ORDER BY CreatedDt DESC, TransactionId DESC',
      [accId]
    );
  },

  getOutstandingInvoices: async (accId: number) => {
    const d = await getDb();
    return await d.getAllAsync<any>(`
      SELECT INVNo, CreatedDt, Company, SubTotal, VatTotal, AmtPaid,
             ROUND((SubTotal + VatTotal) - COALESCE(AmtPaid,0), 2) AS Outstanding,
             PMRef
      FROM ininvlist
      WHERE AccId = ?
        AND ROUND((SubTotal + VatTotal) - COALESCE(AmtPaid,0), 2) > 0
      ORDER BY CreatedDt ASC, INVNo ASC
    `, [accId]);
  },

  recordAccountPayment: async (data: { accId: number; invoiceNo?: string; amount: number; notes?: string }) => {
    const d = await getDb();
    if (data.accId === 1) throw new Error('The walk-in cash customer cannot use credit accounts.');
    const amount = Math.round(Number(data.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Payment amount must be greater than zero.');
    const invoice = data.invoiceNo
      ? await d.getFirstAsync<any>('SELECT INVNo, SubTotal, VatTotal, AmtPaid FROM ininvlist WHERE INVNo = ? AND AccId = ?', [data.invoiceNo, data.accId])
      : null;
    if (data.invoiceNo && !invoice) throw new Error('Invoice not found for this customer.');
    if (invoice) {
      const outstanding = Math.round((Number(invoice.SubTotal || 0) + Number(invoice.VatTotal || 0) - Number(invoice.AmtPaid || 0)) * 100) / 100;
      if (amount > outstanding) throw new Error('Payment cannot exceed the invoice outstanding amount.');
    }
    const row = await d.getFirstAsync<{ balance: number }>('SELECT COALESCE(SUM(Debit - Credit),0) AS balance FROM araccounttransaction WHERE AccId = ?', [data.accId]);
    const before = Number(row?.balance || 0);
    const after = Math.round((before - amount) * 100) / 100;
    const idRow = await d.getFirstAsync<{ nextId: number }>('SELECT COALESCE(MAX(TransactionId),0)+1 AS nextId FROM araccounttransaction');
    const now = new Date().toISOString().replace('T',' ').slice(0,19);
    await d.withTransactionAsync(async () => {
      if (invoice) {
        await d.runAsync('UPDATE ininvlist SET AmtPaid = COALESCE(AmtPaid,0) + ? WHERE INVNo = ? AND AccId = ?', [amount, invoice.INVNo, data.accId]);
      }
      await d.runAsync(
        `INSERT INTO araccounttransaction
          (TransactionId, AccId, TransactionType, RefNo, InvoiceNo, Debit, Credit, Balance, Notes, CreatedBy, CreatedDt)
         VALUES (?, ?, 'PAYMENT', ?, ?, 0, ?, ?, ?, 'MOBILE_POS', ?)`,
        [idRow?.nextId || 1, data.accId, data.invoiceNo || `PAY-${idRow?.nextId || 1}`, data.invoiceNo || null, amount, after, data.notes || 'Account payment', now]
      );
    });
    return { transactionId: idRow?.nextId || 1, balance: after };
  },

  getCustomerStatementData: async (accId: number, fromDate?: string, toDate?: string) => {
    const d = await getDb();
    const customer = await d.getFirstAsync<Customer>(
      'SELECT AccId, AccCode, Company, Contact, Tel, Cell, Email, PriceListId, COALESCE(AutoDisc,0) AutoDisc, COALESCE(AllowPriceMatrix,0) AllowPriceMatrix, COALESCE(CrLimit,0) CrLimit FROM aracc WHERE AccId = ?',
      [accId]
    );
    if (!customer) throw new Error('Customer not found.');
    const filters = ['AccId = ?'];
    const params: any[] = [accId];
    if (fromDate) { filters.push('CreatedDt >= ?'); params.push(fromDate + ' 00:00:00'); }
    if (toDate) { filters.push('CreatedDt <= ?'); params.push(toDate + ' 23:59:59'); }
    const transactions = await d.getAllAsync<any>(`
      SELECT TransactionId, TransactionType, RefNo, InvoiceNo, Debit, Credit, Balance, Notes, CreatedDt
      FROM araccounttransaction
      WHERE ${filters.join(' AND ')}
      ORDER BY CreatedDt ASC, TransactionId ASC
    `, params);
    const totalDebit = transactions.reduce((s, x) => s + Number(x.Debit || 0), 0);
    const totalCredit = transactions.reduce((s, x) => s + Number(x.Credit || 0), 0);
    const balanceRow = await d.getFirstAsync<{ balance: number }>('SELECT COALESCE(SUM(Debit - Credit),0) AS balance FROM araccounttransaction WHERE AccId = ?', [accId]);
    return {
      customer,
      transactions,
      totals: {
        debit: Math.round(totalDebit * 100) / 100,
        credit: Math.round(totalCredit * 100) / 100,
        balance: Math.round(Number(balanceRow?.balance || 0) * 100) / 100,
      },
    };
  },

  getCustomerDetails: async (accId: number) => {
    const d = await getDb();
    const customer = await d.getFirstAsync<Customer>('SELECT AccId, AccCode, Company, Contact, Tel, Cell, Email, PriceListId, COALESCE(AutoDisc,0) AutoDisc, COALESCE(AllowPriceMatrix,0) AllowPriceMatrix, CrLimit FROM aracc WHERE AccId = ?', [accId]);
    if (!customer) return null;
    const invoices = await d.getAllAsync<Invoice>(`
      SELECT INVNo, AccId, StoreId, Company, CreatedDt, SubTotal, VatTotal, AmtPaid, SerialNo, PdfPath
      FROM ininvlist WHERE AccId = ? ORDER BY CreatedDt DESC, INVNo DESC LIMIT 100
    `, [accId]);
    const quotes = await d.getAllAsync<Quote>(`
      SELECT QuoteNo, AccId, StoreId, Company, Date, SubTotal, VatTotal, DiscPerc, QUStatus, PdfPath
      FROM inqulist WHERE AccId = ? ORDER BY Date DESC, QuoteNo DESC LIMIT 100
    `, [accId]);
    const invoiceTotal = invoices.reduce((sum, row) => sum + Number(row.SubTotal || 0) + Number(row.VatTotal || 0), 0);
    const paidTotal = invoices.reduce((sum, row) => sum + Number(row.AmtPaid || 0), 0);
    const quoteTotal = quotes.reduce((sum, row) => sum + Number(row.SubTotal || 0) + Number(row.VatTotal || 0), 0);
    return {
      customer,
      invoices,
      quotes,
      totals: {
        purchases: Math.round(invoiceTotal * 100) / 100,
        paid: Math.round(paidTotal * 100) / 100,
        outstanding: Math.round(Math.max(0, invoiceTotal - paidTotal) * 100) / 100,
        invoiceCount: invoices.length,
        quoteCount: quotes.length,
        quoteValue: Math.round(quoteTotal * 100) / 100,
      },
    };
  },

  getInventoryOverview: async (storeId: number, q: string = '') => {
    const d = await getDb();
    const like = `%${q.trim()}%`;
    return await d.getAllAsync<any>(`
      SELECT i.ItemId, i.ItemCode, i.ItemDesc, s.StockId, s.StockCode,
             COALESCE(q.QtyOnHand, 0) AS QtyOnHand,
             COALESCE(p.LastCost, 0) AS LastCost,
             COALESCE(p.AvgCost, 0) AS AvgCost,
             COALESCE(p.POSPrice1, p.SellPrice1, 0) AS SellPrice
      FROM initem i
      JOIN instock s ON s.ItemId = i.ItemId AND s.IsActive = 1
      LEFT JOIN inqty q ON q.ItemId = i.ItemId AND q.StockId = s.StockId AND q.StoreId = ?
      LEFT JOIN inprice p ON p.ItemId = i.ItemId AND p.StockId = s.StockId
      WHERE i.ItemDesc LIKE ? OR i.ItemCode LIKE ? OR s.StockCode LIKE ?
      ORDER BY i.ItemDesc
    `, [storeId, like, like, like]);
  },

  getInventorySummary: async (storeId: number) => {
    const d = await getDb();
    const row = await d.getFirstAsync<any>(`
      SELECT COUNT(*) AS itemCount,
             COALESCE(SUM(CASE WHEN COALESCE(q.QtyOnHand,0) > 0 THEN 1 ELSE 0 END),0) AS inStock,
             COALESCE(SUM(CASE WHEN COALESCE(q.QtyOnHand,0) <= 0 THEN 1 ELSE 0 END),0) AS outOfStock,
             COALESCE(SUM(CASE WHEN COALESCE(q.QtyOnHand,0) > 0 AND COALESCE(q.QtyOnHand,0) <= 5 THEN 1 ELSE 0 END),0) AS lowStock,
             COALESCE(SUM(COALESCE(q.QtyOnHand,0) * COALESCE(p.AvgCost, p.LastCost, 0)),0) AS stockValue
      FROM initem i
      JOIN instock s ON s.ItemId = i.ItemId AND s.IsActive = 1
      LEFT JOIN inqty q ON q.ItemId = i.ItemId AND q.StockId = s.StockId AND q.StoreId = ?
      LEFT JOIN inprice p ON p.ItemId = i.ItemId AND p.StockId = s.StockId
    `, [storeId]);
    return row || { itemCount: 0, inStock: 0, outOfStock: 0, lowStock: 0, stockValue: 0 };
  },

  getInventoryMovements: async (storeId: number, q: string = '') => {
    const d = await getDb();
    const like = `%${q.trim()}%`;
    return await d.getAllAsync<any>(`
      SELECT m.MovementId, m.StoreId, m.ItemId, m.StockId, m.MovementType,
             m.Quantity, m.BalanceBefore, m.BalanceAfter, m.ReferenceNo, m.Notes,
             m.RelatedStoreId, m.CreatedBy, m.CreatedDt,
             i.ItemCode, i.ItemDesc, s.StockCode,
             rs.StoreCode AS RelatedStoreCode, rs.StoreDesc AS RelatedStoreDesc
      FROM instockmovement m
      JOIN initem i ON i.ItemId = m.ItemId
      JOIN instock s ON s.ItemId = m.ItemId AND s.StockId = m.StockId
      LEFT JOIN store rs ON rs.StoreId = m.RelatedStoreId
      WHERE m.StoreId = ?
        AND (i.ItemDesc LIKE ? OR i.ItemCode LIKE ? OR s.StockCode LIKE ? OR m.MovementType LIKE ? OR COALESCE(m.ReferenceNo,'') LIKE ?)
      ORDER BY m.CreatedDt DESC, m.MovementId DESC
      LIMIT 200
    `, [storeId, like, like, like, like, like]);
  },

  recordInventoryMovement: async (data: {
    storeId: number; itemId: number; stockId: number;
    movementType: 'RECEIVE' | 'ADJUST' | 'TRANSFER_OUT' | 'TRANSFER_IN';
    quantity: number; notes?: string; referenceNo?: string; relatedStoreId?: number; createdBy?: string;
  }) => {
    const d = await getDb();
    const quantity = Number(data.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Enter a quantity greater than zero.');
    if (data.movementType === 'TRANSFER_OUT' && (!data.relatedStoreId || data.relatedStoreId === data.storeId)) {
      throw new Error('Select a different destination store for the transfer.');
    }

    const now = new Date().toISOString();
    const idRow = await d.getFirstAsync<{ nextId: number }>('SELECT COALESCE(MAX(MovementId), 0) + 1 AS nextId FROM instockmovement');
    const movementId = idRow?.nextId || 1;
    const referenceNo = data.referenceNo?.trim() || `MOV-${String(movementId).padStart(6, '0')}`;

    await d.withTransactionAsync(async () => {
      const current = await d.getFirstAsync<{ QtyOnHand: number }>(
        'SELECT COALESCE(QtyOnHand,0) AS QtyOnHand FROM inqty WHERE ItemId = ? AND StockId = ? AND StoreId = ?',
        [data.itemId, data.stockId, data.storeId]
      );
      const before = Number(current?.QtyOnHand || 0);
      const delta = data.movementType === 'RECEIVE' || data.movementType === 'TRANSFER_IN' ? quantity : -quantity;
      const after = before + delta;
      if (after < 0) throw new Error(`Insufficient stock. Available: ${before}, requested: ${quantity}.`);

      await d.runAsync('INSERT OR IGNORE INTO inqty (ItemId, StockId, StoreId, QtyOnHand) VALUES (?, ?, ?, 0)', [data.itemId, data.stockId, data.storeId]);
      const updated = await d.runAsync('UPDATE inqty SET QtyOnHand = ? WHERE ItemId = ? AND StockId = ? AND StoreId = ?', [after, data.itemId, data.stockId, data.storeId]);
      if (updated.changes !== 1) throw new Error('Could not update inventory quantity.');

      await d.runAsync(`
        INSERT INTO instockmovement
          (MovementId, StoreId, ItemId, StockId, MovementType, Quantity, BalanceBefore, BalanceAfter, ReferenceNo, Notes, RelatedStoreId, CreatedBy, CreatedDt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [movementId, data.storeId, data.itemId, data.stockId, data.movementType, quantity, before, after, referenceNo, data.notes?.trim() || '', data.relatedStoreId || null, data.createdBy || 'POS', now]);

      if (data.movementType === 'TRANSFER_OUT') {
        const otherStoreId = data.relatedStoreId!;
        const dest = await d.getFirstAsync<{ QtyOnHand: number }>('SELECT COALESCE(QtyOnHand,0) AS QtyOnHand FROM inqty WHERE ItemId = ? AND StockId = ? AND StoreId = ?', [data.itemId, data.stockId, otherStoreId]);
        const destBefore = Number(dest?.QtyOnHand || 0);
        const destAfter = destBefore + quantity;
        await d.runAsync('INSERT OR IGNORE INTO inqty (ItemId, StockId, StoreId, QtyOnHand) VALUES (?, ?, ?, 0)', [data.itemId, data.stockId, otherStoreId]);
        await d.runAsync('UPDATE inqty SET QtyOnHand = ? WHERE ItemId = ? AND StockId = ? AND StoreId = ?', [destAfter, data.itemId, data.stockId, otherStoreId]);
        const destIdRow = await d.getFirstAsync<{ nextId: number }>('SELECT COALESCE(MAX(MovementId), 0) + 1 AS nextId FROM instockmovement');
        await d.runAsync(`
          INSERT INTO instockmovement
            (MovementId, StoreId, ItemId, StockId, MovementType, Quantity, BalanceBefore, BalanceAfter, ReferenceNo, Notes, RelatedStoreId, CreatedBy, CreatedDt)
          VALUES (?, ?, ?, ?, 'TRANSFER_IN', ?, ?, ?, ?, ?, ?, ?, ?)
        `, [destIdRow?.nextId || movementId + 1, otherStoreId, data.itemId, data.stockId, quantity, destBefore, destAfter, referenceNo, data.notes?.trim() || `Transfer from store ${data.storeId}`, data.storeId, data.createdBy || 'POS', now]);
      }
    });
    return { movementId, referenceNo };
  },

  getStockTakeItems: async (storeId: number) => {
    const d = await getDb();
    return await d.getAllAsync<any>(`
      SELECT i.ItemId, i.ItemCode, i.ItemDesc, s.StockId, s.StockCode,
             COALESCE(q.QtyOnHand, 0) as ExpectedQty,
             b.Barcode
      FROM initem i
      JOIN instock s ON s.ItemId = i.ItemId AND s.IsActive = 1
      LEFT JOIN inqty q ON q.ItemId = i.ItemId AND q.StockId = s.StockId AND q.StoreId = ?
      LEFT JOIN instockbarcode b ON b.ItemId = i.ItemId AND b.StockId = s.StockId AND b.IsActive = 1
      ORDER BY i.ItemDesc
    `, [storeId]);
  },

  finalizeStockTake: async (storeId: number, scans: Array<{ itemId: number; stockId: number; countedQty: number }>, createdBy = 'POS') => {
    const d = await getDb();
    if (!scans.length) throw new Error('Scan at least one product before finalising the stock take.');
    const now = new Date().toISOString();
    const idRow = await d.getFirstAsync<{ nextId: number }>('SELECT COALESCE(MAX(StockTakeId), 0) + 1 as nextId FROM instocktake');
    const stockTakeId = idRow?.nextId || 1;
    const stockTakeNo = 'ST-' + String(stockTakeId).padStart(6, '0');

    await d.withTransactionAsync(async () => {
      await d.runAsync(
        'INSERT INTO instocktake (StoreId, StockTakeId, StockTakeNo, StockTakeText, CreatedDt, CreatedBy, Posted) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [storeId, stockTakeId, stockTakeNo, 'Mobile POS Stock Take', now, createdBy, 'Y']
      );

      for (const row of scans) {
        const expected = await d.getFirstAsync<{ QtyOnHand: number }>(
          'SELECT COALESCE(QtyOnHand, 0) as QtyOnHand FROM inqty WHERE ItemId = ? AND StockId = ? AND StoreId = ?',
          [row.itemId, row.stockId, storeId]
        );
        const expectedQty = Number(expected?.QtyOnHand || 0);
        const countedQty = Math.max(0, Number(row.countedQty || 0));
        const difference = countedQty - expectedQty;

        await d.runAsync(
          'INSERT INTO instocktakeline (StockTakeId, ItemId, StockId, ExpectedQty, CountedQty, Difference, CreatedDt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [stockTakeId, row.itemId, row.stockId, expectedQty, countedQty, difference, now]
        );

        await d.runAsync(
          'INSERT OR IGNORE INTO inqty (ItemId, StockId, StoreId, QtyOnHand) VALUES (?, ?, ?, 0)',
          [row.itemId, row.stockId, storeId]
        );
        await d.runAsync(
          'UPDATE inqty SET QtyOnHand = ? WHERE ItemId = ? AND StockId = ? AND StoreId = ?',
          [countedQty, row.itemId, row.stockId, storeId]
        );
      }
    });

    return { stockTakeId, stockTakeNo };
  },

  getStockTakeHistory: async (storeId: number) => {
    const d = await getDb();
    return await d.getAllAsync<any>(`
      SELECT h.StockTakeId, h.StockTakeNo, h.CreatedDt, h.CreatedBy,
             COUNT(l.ItemId) as ItemCount,
             SUM(CASE WHEN ABS(l.Difference) > 0.0001 THEN 1 ELSE 0 END) as VarianceCount,
             COALESCE(SUM(l.Difference), 0) as NetAdjustment
      FROM instocktake h
      LEFT JOIN instocktakeline l ON l.StockTakeId = h.StockTakeId
      WHERE h.StoreId = ?
      GROUP BY h.StockTakeId, h.StockTakeNo, h.CreatedDt, h.CreatedBy
      ORDER BY h.CreatedDt DESC
      LIMIT 100
    `, [storeId]);
  },

  getAnalytics: async (storeId: number) => {
    const d = await getDb();
    const summary = await d.getFirstAsync<any>(`
      SELECT COUNT(*) as invoiceCount,
             COALESCE(SUM(SubTotal + VatTotal), 0) as revenue,
             COALESCE(SUM(VatTotal), 0) as vat,
             COALESCE(SUM(AmtPaid), 0) as paid
      FROM ininvlist WHERE StoreId = ?
    `, [storeId]);
    const popularItems = await d.getAllAsync<any>(`
      SELECT s.ItemId, s.StockId, s.ItemDesc,
             COALESCE(SUM(s.Qty),0) as units,
             COALESCE(SUM(s.Amount),0) as sales
      FROM ininvstock s
      JOIN ininvlist h ON h.SerialNo = s.TransSerialNo
      WHERE h.StoreId = ?
      GROUP BY s.ItemId, s.StockId, s.ItemDesc
      ORDER BY units DESC, sales DESC
      LIMIT 10
    `, [storeId]);
    const topRevenue = await d.getAllAsync<any>(`
      SELECT s.ItemId, s.StockId, s.ItemDesc,
             COALESCE(SUM(s.Amount),0) as sales,
             COALESCE(SUM(s.Qty),0) as units
      FROM ininvstock s
      JOIN ininvlist h ON h.SerialNo = s.TransSerialNo
      WHERE h.StoreId = ?
      GROUP BY s.ItemId, s.StockId, s.ItemDesc
      ORDER BY sales DESC
      LIMIT 10
    `, [storeId]);
    const paymentMethods = await d.getAllAsync<any>(`
      SELECT COALESCE(PMRef, 'Unknown') as method, COUNT(*) as count, COALESCE(SUM(AmtPaid),0) as amount
      FROM ininvlist WHERE StoreId = ?
      GROUP BY PMRef ORDER BY amount DESC
    `, [storeId]);
    const customerSales = await d.getAllAsync<any>(`
      SELECT COALESCE(NULLIF(Company,''),'Walk-In Cash Customer') as customer,
             COUNT(*) as invoices, COALESCE(SUM(SubTotal + VatTotal),0) as sales
      FROM ininvlist WHERE StoreId = ?
      GROUP BY Company ORDER BY sales DESC LIMIT 10
    `, [storeId]);
    const lowStock = await d.getAllAsync<any>(`
      SELECT i.ItemId, i.ItemDesc, s.StockId, COALESCE(q.QtyOnHand,0) as qty
      FROM initem i JOIN instock s ON s.ItemId=i.ItemId AND s.IsActive=1
      LEFT JOIN inqty q ON q.ItemId=i.ItemId AND q.StockId=s.StockId AND q.StoreId=?
      WHERE COALESCE(q.QtyOnHand,0) <= 5
      ORDER BY qty ASC, i.ItemDesc LIMIT 10
    `, [storeId]);

    const salesTrend = await d.getAllAsync<any>(`
      SELECT substr(CreatedDt, 1, 10) as day,
             COUNT(*) as invoices,
             COALESCE(SUM(SubTotal + VatTotal), 0) as revenue
      FROM ininvlist
      WHERE StoreId = ?
      GROUP BY substr(CreatedDt, 1, 10)
      ORDER BY day DESC
      LIMIT 30
    `, [storeId]);
    salesTrend.reverse();

    return { summary, popularItems, topRevenue, paymentMethods, customerSales, lowStock, salesTrend };
  },

  createProduct: async (data: {
    name: string;
    code: string;
    barcode?: string;
    price: number;
    cost?: number;
    quantity?: number;
    vat?: string;
    storeId: number;
  }) => {
    const d = await getDb();
    const name = data.name.trim();
    const code = data.code.trim();

    if (!name || !code) throw new Error('Product name and product code are required.');
    if (!Number.isFinite(data.price) || data.price < 0) throw new Error('Price must be a valid number.');

    const existing = await d.getFirstAsync<{ ItemId: number }>(
      'SELECT ItemId FROM initem WHERE ItemCode = ? LIMIT 1',
      [code]
    );
    if (existing) throw new Error('A product with this code already exists.');

    const itemRow = await d.getFirstAsync<{ nextId: number }>(
      'SELECT COALESCE(MAX(ItemId), 0) + 1 as nextId FROM initem'
    );
    const stockRow = await d.getFirstAsync<{ nextId: number }>(
      'SELECT COALESCE(MAX(StockId), 0) + 1 as nextId FROM instock'
    );

    const itemId = itemRow?.nextId || 1;
    const stockId = stockRow?.nextId || 1;
    const quantity = Number.isFinite(data.quantity) ? data.quantity || 0 : 0;
    const cost = Number.isFinite(data.cost) ? data.cost || 0 : 0;
    const vat = (data.vat || 'Y').trim().toUpperCase() || 'Y';

    await d.withTransactionAsync(async () => {
      await d.runAsync(
        'INSERT INTO initem (ItemId, ItemCode, ItemDesc, PackSize, Vat, IsScannable) VALUES (?, ?, ?, ?, ?, ?)',
        [itemId, code, name, 1, vat, data.barcode?.trim() ? 1 : 0]
      );

      await d.runAsync(
        'INSERT INTO instock (ItemId, StockId, StockCode, IsActive) VALUES (?, ?, ?, 1)',
        [itemId, stockId, code]
      );

      await d.runAsync(
        'INSERT INTO inprice (ItemId, StockId, LastCost, AvgCost, POSPrice1, SellPrice1) VALUES (?, ?, ?, ?, ?, ?)',
        [itemId, stockId, cost, cost, data.price, data.price]
      );

      await d.runAsync(
        'INSERT INTO inqty (ItemId, StockId, StoreId, QtyOnHand) VALUES (?, ?, ?, ?)',
        [itemId, stockId, data.storeId, quantity]
      );

      if (data.barcode?.trim()) {
        await d.runAsync(
          'INSERT INTO instockbarcode (ItemId, StockId, BarcodeId, Barcode, IsActive) VALUES (?, ?, ?, ?, 1)',
          [itemId, stockId, itemId, data.barcode.trim()]
        );
      }
    });

    return { itemId, stockId };
  },

  importProducts: async (products: Array<{
    name: string;
    code: string;
    barcode?: string;
    price: number;
    cost?: number;
    quantity?: number;
    vat?: string;
  }>, storeId: number) => {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i++) {
      try {
        await posDb.createProduct({ ...products[i], storeId });
        imported++;
      } catch (err: any) {
        skipped++;
        errors.push(`Row ${i + 2}: ${err?.message || 'Could not import row'}`);
      }
    }

    return { imported, skipped, errors };
  },

  updateProduct: async (data: {
    itemId: number; stockId: number; name: string; code: string; barcode?: string;
    price: number; cost?: number; quantity?: number; vat?: string; storeId: number;
  }) => {
    const d = await getDb();
    const name = data.name.trim();
    const code = data.code.trim();
    if (!name || !code) throw new Error('Product name and product code are required.');
    if (!Number.isFinite(data.price) || data.price < 0) throw new Error('Price must be a valid number.');
    const duplicate = await d.getFirstAsync<{ ItemId: number }>(
      'SELECT ItemId FROM initem WHERE ItemCode = ? AND ItemId <> ? LIMIT 1', [code, data.itemId]
    );
    if (duplicate) throw new Error('Another product already uses this code.');
    const quantity = Number.isFinite(data.quantity) ? data.quantity || 0 : 0;
    const cost = Number.isFinite(data.cost) ? data.cost || 0 : 0;
    const vat = (data.vat || 'Y').trim().toUpperCase() || 'Y';
    const barcode = data.barcode?.trim() || '';
    await d.withTransactionAsync(async () => {
      await d.runAsync('UPDATE initem SET ItemCode = ?, ItemDesc = ?, Vat = ?, IsScannable = ? WHERE ItemId = ?',
        [code, name, vat, barcode ? 1 : 0, data.itemId]);
      await d.runAsync('UPDATE instock SET StockCode = ?, IsActive = 1 WHERE ItemId = ? AND StockId = ?',
        [code, data.itemId, data.stockId]);
      await d.runAsync('UPDATE inprice SET LastCost = ?, AvgCost = ?, POSPrice1 = ?, SellPrice1 = ? WHERE ItemId = ? AND StockId = ?',
        [cost, cost, data.price, data.price, data.itemId, data.stockId]);
      await d.runAsync(`INSERT INTO inqty (ItemId, StockId, StoreId, QtyOnHand) VALUES (?, ?, ?, ?)
        ON CONFLICT(ItemId, StockId, StoreId) DO UPDATE SET QtyOnHand = excluded.QtyOnHand`,
        [data.itemId, data.stockId, data.storeId, quantity]);
      await d.runAsync('DELETE FROM instockbarcode WHERE ItemId = ? AND StockId = ?', [data.itemId, data.stockId]);
      if (barcode) await d.runAsync('INSERT INTO instockbarcode (ItemId, StockId, BarcodeId, Barcode, IsActive) VALUES (?, ?, ?, ?, 1)',
        [data.itemId, data.stockId, data.itemId, barcode]);
    });
  },

  deleteProduct: async (itemId: number, stockId: number) => {
    const d = await getDb();
    await d.withTransactionAsync(async () => {
      await d.runAsync('DELETE FROM instockbarcode WHERE ItemId = ? AND StockId = ?', [itemId, stockId]);
      await d.runAsync('DELETE FROM inqty WHERE ItemId = ? AND StockId = ?', [itemId, stockId]);
      await d.runAsync('DELETE FROM inprice WHERE ItemId = ? AND StockId = ?', [itemId, stockId]);
      await d.runAsync('DELETE FROM instock WHERE ItemId = ? AND StockId = ?', [itemId, stockId]);
      await d.runAsync('DELETE FROM initem WHERE ItemId = ?', [itemId]);
    });
  },

  adjustProductStock: async (itemId: number, stockId: number, storeId: number, delta: number) => {
    const d = await getDb();
    if (!Number.isFinite(delta) || delta === 0) throw new Error('Enter a stock adjustment other than zero.');
    const row = await d.getFirstAsync<{ QtyOnHand: number }>(
      'SELECT QtyOnHand FROM inqty WHERE ItemId = ? AND StockId = ? AND StoreId = ?', [itemId, stockId, storeId]
    );
    const current = row?.QtyOnHand || 0;
    const next = current + delta;
    if (next < 0) throw new Error('Stock cannot go below zero.');
    await d.runAsync(`INSERT INTO inqty (ItemId, StockId, StoreId, QtyOnHand) VALUES (?, ?, ?, ?)
      ON CONFLICT(ItemId, StockId, StoreId) DO UPDATE SET QtyOnHand = excluded.QtyOnHand`,
      [itemId, stockId, storeId, next]);
    return next;
  },

  getProductByBarcode: async (barcode: string, storeId: number = 1): Promise<Product> => {
    const d = await getDb();
    const row = await d.getFirstAsync<Product>(`
      SELECT 
        i.ItemId, s.StockId, i.ItemCode, s.StockCode, i.ItemDesc, i.PackSize, i.Vat, i.IsScannable,
        c.ColourDesc, sz.SizeDesc,
        p.POSPrice1, p.SellPrice1, p.LastCost, p.AvgCost,
        COALESCE(q.QtyOnHand, 0) as QtyOnHand
      FROM instock s
      JOIN initem i ON s.ItemId = i.ItemId
      LEFT JOIN incolour c ON s.ColourId = c.ColourId
      LEFT JOIN insize sz ON s.SizeId = sz.SizeId
      LEFT JOIN inprice p ON (p.ItemId = s.ItemId AND p.StockId = s.StockId)
      LEFT JOIN inqty q ON (q.ItemId = s.ItemId AND q.StockId = s.StockId AND q.StoreId = ?)
      LEFT JOIN instockbarcode b ON (b.ItemId = s.ItemId AND b.StockId = s.StockId AND b.IsActive = 1)
      WHERE s.StockCode = ? OR i.ItemCode = ? OR b.Barcode = ?
      LIMIT 1
    `, [storeId, barcode, barcode, barcode]);

    if (!row) {
      throw new Error(`Product with code '${barcode}' not found in SQLite DB.`);
    }
    return row;
  },

  searchProducts: async (q: string = '', storeId: number = 1, limit: number = 40): Promise<Product[]> => {
    const d = await getDb();
    if (q) {
      const queryStr = `%${q}%`;
      return await d.getAllAsync<Product>(`
        SELECT 
          i.ItemId, s.StockId, i.ItemCode, s.StockCode, i.ItemDesc, i.PackSize, i.Vat, i.IsScannable,
          c.ColourDesc, sz.SizeDesc,
          p.POSPrice1, p.SellPrice1, p.LastCost, p.AvgCost,
          COALESCE(q.QtyOnHand, 0) as QtyOnHand
        FROM initem i
        JOIN instock s ON i.ItemId = s.ItemId
        LEFT JOIN incolour c ON s.ColourId = c.ColourId
        LEFT JOIN insize sz ON s.SizeId = sz.SizeId
        LEFT JOIN inprice p ON (p.ItemId = s.ItemId AND p.StockId = s.StockId)
        LEFT JOIN inqty q ON (q.ItemId = s.ItemId AND q.StockId = s.StockId AND q.StoreId = ?)
        WHERE i.ItemCode LIKE ? OR i.ItemDesc LIKE ? OR s.StockCode LIKE ?
        ORDER BY i.ItemDesc
        LIMIT ?
      `, [storeId, queryStr, queryStr, queryStr, limit]);
    }
    return await d.getAllAsync<Product>(`
      SELECT 
        i.ItemId, s.StockId, i.ItemCode, s.StockCode, i.ItemDesc, i.PackSize, i.Vat, i.IsScannable,
        c.ColourDesc, sz.SizeDesc,
        p.POSPrice1, p.SellPrice1, p.LastCost, p.AvgCost,
        COALESCE(q.QtyOnHand, 0) as QtyOnHand
      FROM initem i
      JOIN instock s ON i.ItemId = s.ItemId
      LEFT JOIN incolour c ON s.ColourId = c.ColourId
      LEFT JOIN insize sz ON s.SizeId = sz.SizeId
      LEFT JOIN inprice p ON (p.ItemId = s.ItemId AND p.StockId = s.StockId)
      LEFT JOIN inqty q ON (q.ItemId = s.ItemId AND q.StockId = s.StockId AND q.StoreId = ?)
      ORDER BY i.ItemDesc
      LIMIT ?
    `, [storeId, limit]);
  },

  checkPrice: async (itemId: number, stockId: number, accId?: number, storeId: number = 1, qty: number = 1) => {
    const d = await getDb();
    let finalPrice = 0.0;
    let priceSource = "Standard POS Price";
    let promoId: number | undefined = undefined;
    let promoDesc: string | undefined = undefined;

    const pRow = await d.getFirstAsync<{ POSPrice1: number; SellPrice1: number }>(
      "SELECT POSPrice1, SellPrice1 FROM inprice WHERE ItemId = ? AND StockId = ?", [itemId, stockId]
    );
    const standardPrice = pRow?.POSPrice1 && pRow.POSPrice1 > 0 ? pRow.POSPrice1 : (pRow?.SellPrice1 || 0.0);
    finalPrice = standardPrice;

    if (accId) {
      const accRow = await d.getFirstAsync<{ AllowPriceMatrix: number; AutoDisc: number }>(
        "SELECT AllowPriceMatrix, AutoDisc FROM aracc WHERE AccId = ?", [accId]
      );
      if (accRow?.AllowPriceMatrix === 1) {
        const matrixRow = await d.getFirstAsync<{ Price: number }>(
          "SELECT Price FROM arpmatrix WHERE AccId = ? AND ItemId = ? AND StockId = ? AND IsActive = 1", [accId, itemId, stockId]
        );
        if (matrixRow?.Price) {
          finalPrice = matrixRow.Price;
          priceSource = "Customer Matrix Price";
        }
      } else if (accRow?.AutoDisc && accRow.AutoDisc > 0) {
        finalPrice = standardPrice * (1 - accRow.AutoDisc / 100.0);
        priceSource = `Standard with ${accRow.AutoDisc}% Auto Disc`;
      }
    }

    if (priceSource === "Standard POS Price" && storeId) {
      const today = new Date().toISOString().slice(0, 10);
      const promoRow = await d.getFirstAsync<{
        Price: number;
        PromotionId: number;
        PromotionDesc: string;
        DiscountType: string;
        DiscountValue: number;
        MinQty: number;
      }>(`
        SELECT pi.Price, p.PromotionId, p.PromotionDesc,
               COALESCE(pi.DiscountType, 'PRICE') as DiscountType,
               COALESCE(pi.DiscountValue, pi.Price) as DiscountValue,
               COALESCE(pi.MinQty, 1) as MinQty
        FROM inpromotionitem pi
        JOIN inpromotion p ON pi.PromotionId = p.PromotionId
        JOIN inpromotionstore ps ON p.PromotionId = ps.PromotionId
        WHERE pi.ItemId = ? AND pi.StockId = ?
          AND ps.StoreId = ?
          AND pi.IsActive = 1 AND p.IsActive = 1 AND ps.IsActive = 1
          AND (p.FromText IS NULL OR p.FromText = '' OR substr(p.FromText, 1, 10) <= ?)
          AND (p.ToText IS NULL OR p.ToText = '' OR substr(p.ToText, 1, 10) >= ?)
          AND COALESCE(pi.MinQty, 1) <= ?
        ORDER BY COALESCE(pi.MinQty, 1) DESC
        LIMIT 1
      `, [itemId, stockId, storeId, today, today, qty]);

      if (promoRow) {
        if (promoRow.DiscountType === 'PERCENT') {
          finalPrice = standardPrice * (1 - Math.max(0, Math.min(100, Number(promoRow.DiscountValue || 0))) / 100);
        } else if (promoRow.DiscountType === 'FIXED') {
          finalPrice = Math.max(0, standardPrice - Math.max(0, Number(promoRow.DiscountValue || 0)));
        } else {
          finalPrice = Number(promoRow.Price || 0);
        }

        priceSource = `Promotion: ${promoRow.PromotionDesc}`;
        promoId = promoRow.PromotionId;
        promoDesc = promoRow.PromotionDesc;
      }
    }

    return {
      item_id: itemId,
      stock_id: stockId,
      standard_price: standardPrice,
      unit_price: Math.round(Math.max(0, finalPrice) * 100) / 100,
      price_source: priceSource,
      promotion_id: promoId,
      promotion_desc: promoDesc
    };
  },

  getQuotes: async (): Promise<Quote[]> => {
    const d = await getDb();
    return await d.getAllAsync<Quote>(`
      SELECT q.QuoteNo, q.AccId, q.StoreId, q.Company, q.Date, q.SubTotal, q.VatTotal, q.DiscPerc, q.QUStatus, q.PdfPath,
             s.StoreDesc
      FROM inqulist q
      LEFT JOIN store s ON q.StoreId = s.StoreId
      ORDER BY q.Date DESC, q.QuoteNo DESC
      LIMIT 50
    `);
  },

  createQuote: async (data: any) => {
    const d = await getDb();
    const maxRow = await d.getFirstAsync<{ maxNo: number }>("SELECT MAX(CAST(QuoteNo as INTEGER)) as maxNo FROM inqulist");
    const nextNo = (maxRow?.maxNo || 1000) + 1;
    const quoteNo = String(nextNo);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const serialNo = `QU-${quoteNo}`;

    await d.runAsync(`
      INSERT INTO inqulist (
        AccId, StoreId, Company, DAddress, QuoteNo, Date, TradingDate, OrderNo, RepId, QUStatus,
        SubTotal, VatTotal, DiscPerc, Discount, VatPerc, Message, Notes, CreatedBy, CreatedDt, SerialNo, Posted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.acc_id, data.store_id, data.company, data.d_address || '', quoteNo, nowStr, nowStr,
      data.order_no || '', data.rep_id || null, 'O', data.sub_total, data.vat_total, data.disc_perc || 0,
      data.discount || 0, data.vat_perc || 15.0, data.message || '', data.notes || '', 'MOBILE_POS', nowStr, serialNo, 'N'
    ]);

    let trNo = 1;
    for (const item of data.items) {
      await d.runAsync(`
        INSERT INTO inqustock (
          TransSerialNo, TrNo, ItemId, StockId, ItemDesc, Qty, UnitExcl, UnitIncl, VatAmount, Vat, DiscPerc, Amount, CreatedBy, CreatedDt, PromotionId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        serialNo, String(trNo), item.item_id, item.stock_id, item.item_desc, item.qty,
        item.unit_excl, item.unit_incl, item.vat_amount, 'Y', item.disc_perc || 0, item.amount,
        'MOBILE_POS', nowStr, item.promotion_id || null
      ]);
      trNo++;
    }

    return { quote_no: quoteNo, serial_no: serialNo, status: "CREATED" };
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const d = await getDb();
    return await d.getAllAsync<Invoice>(`
      SELECT i.INVNo, i.AccId, i.StoreId, i.Company, i.CreatedDt, i.SubTotal, i.VatTotal, i.AmtPaid, i.SerialNo, i.PdfPath,
             s.StoreDesc
      FROM ininvlist i
      LEFT JOIN store s ON i.StoreId = s.StoreId
      ORDER BY i.CreatedDt DESC, i.INVNo DESC
      LIMIT 50
    `);
  },

  createInvoice: async (data: any) => {
    const d = await getDb();
    const countRow = await d.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM ininvlist');
    const invNo = `INV${10001 + (countRow?.count || 0)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const serialNo = `INV-SER-${10001 + (countRow?.count || 0)}`;

    await d.withTransactionAsync(async () => {
      for (const item of data.items) {
        const stock = await d.getFirstAsync<{ QtyOnHand: number }>(
          'SELECT QtyOnHand FROM inqty WHERE ItemId = ? AND StockId = ? AND StoreId = ?',
          [item.item_id, item.stock_id, data.store_id]
        );
        const available = Number(stock?.QtyOnHand || 0);
        if (available < Number(item.qty || 0)) {
          throw new Error(`Insufficient stock for "${item.item_desc}". Available: ${available}, requested: ${item.qty}.`);
        }
      }

      if (String(data.pm_ref || '').toUpperCase() === 'CREDIT') {
        if (Number(data.acc_id || 1) === 1) throw new Error('The walk-in cash customer cannot buy on credit.');
        const row = await d.getFirstAsync<{ balance: number }>('SELECT COALESCE(SUM(Debit - Credit),0) AS balance FROM araccounttransaction WHERE AccId = ?', [data.acc_id]);
        const currentBalance = Number(row?.balance || 0);
        const customer = await d.getFirstAsync<{ CrLimit: number }>('SELECT COALESCE(CrLimit,0) AS CrLimit FROM aracc WHERE AccId = ?', [data.acc_id]);
        if (!customer) throw new Error('Customer account not found.');
        const total = Number(data.sub_total || 0) + Number(data.vat_total || 0);
        if (Number(customer.CrLimit || 0) <= 0) throw new Error('This customer has no credit limit configured.');
        if (currentBalance + total > Number(customer.CrLimit)) throw new Error('Credit limit exceeded. Available credit: R ' + Math.max(0, Number(customer.CrLimit) - currentBalance).toFixed(2) + '.');
      }

      await d.runAsync(`
        INSERT INTO ininvlist (
          AccId, StoreId, Company, DAddress, INVNo, OrderNo, RepId, SubTotal, VatTotal, DiscPerc, Discount,
          VatPerc, AmtPaid, PTypeId, PMRef, Notes, IsQuote, CreatedBy, CreatedDt, Posted, SerialNo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.acc_id, data.store_id, data.company, data.d_address || '', invNo, data.order_no || '', data.rep_id || null,
        data.sub_total, data.vat_total, data.disc_perc || 0, data.discount || 0, data.vat_perc || 15.0, data.amt_paid,
        data.p_type_id || 1, data.pm_ref || 'CASH', data.notes || '', data.is_quote || 0, 'MOBILE_POS', nowStr, 'Y', serialNo
      ]);

      let trNo = 1;
      for (const item of data.items) {
        await d.runAsync(`
          INSERT INTO ininvstock (
            TransSerialNo, TrNo, ItemId, StockId, ItemDesc, Qty, CostPrice, UnitExcl, UnitIncl, VatAmount, Vat, DiscPerc, Amount, CreatedBy, CreatedDt, PromotionId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          serialNo, String(trNo), item.item_id, item.stock_id, item.item_desc, item.qty,
          item.cost_price || 0, item.unit_excl, item.unit_incl, item.vat_amount, 'Y', item.disc_perc || 0,
          item.amount, 'MOBILE_POS', nowStr, item.promotion_id || null
        ]);

        const updateResult = await d.runAsync(`
          UPDATE inqty
          SET QtyOnHand = QtyOnHand - ?
          WHERE ItemId = ? AND StockId = ? AND StoreId = ? AND QtyOnHand >= ?
        `, [item.qty, item.item_id, item.stock_id, data.store_id, item.qty]);

        if (updateResult.changes !== 1) {
          throw new Error(`Stock changed before the sale could be completed for "${item.item_desc}". Please try again.`);
        }

        trNo++;
      }
    });

    if (String(data.pm_ref || '').toUpperCase() === 'CREDIT') {
      const row = await d.getFirstAsync<{ balance: number }>('SELECT COALESCE(SUM(Debit - Credit),0) AS balance FROM araccounttransaction WHERE AccId = ?', [data.acc_id]);
      const idRow = await d.getFirstAsync<{ nextId: number }>('SELECT COALESCE(MAX(TransactionId),0)+1 AS nextId FROM araccounttransaction');
      const balance = Number(row?.balance || 0);
      const total = Number(data.sub_total || 0) + Number(data.vat_total || 0);
      await d.runAsync(`INSERT INTO araccounttransaction
        (TransactionId, AccId, TransactionType, RefNo, InvoiceNo, Debit, Credit, Balance, Notes, CreatedBy, CreatedDt)
        VALUES (?, ?, 'INVOICE', ?, ?, ?, 0, ?, 'Credit sale', 'MOBILE_POS', ?)`,
        [idRow?.nextId || 1, data.acc_id, invNo, invNo, total, balance, new Date().toISOString().replace('T',' ').slice(0,19)]
      );
    }

    return { inv_no: invNo, serial_no: serialNo, status: 'COMPLETED' };
  },

  setQuotePdfPath: async (quoteNo: string, pdfPath: string) => {
    const d = await getDb();
    await d.runAsync('UPDATE inqulist SET PdfPath = ? WHERE QuoteNo = ?', [pdfPath, quoteNo]);
  },

  setInvoicePdfPath: async (invNo: string, pdfPath: string) => {
    const d = await getDb();
    await d.runAsync('UPDATE ininvlist SET PdfPath = ? WHERE INVNo = ?', [pdfPath, invNo]);
  },

  getQuoteDetails: async (quoteNo: string) => {
    const d = await getDb();
    const quote = await d.getFirstAsync<any>('SELECT q.*, s.StoreDesc, s.StoreCode, s.Tel, s.Cell, s.Email FROM inqulist q LEFT JOIN store s ON q.StoreId = s.StoreId WHERE q.QuoteNo = ? LIMIT 1', [quoteNo]);
    if (!quote) throw new Error('Quote not found.');
    const items = await d.getAllAsync<any>('SELECT * FROM inqustock WHERE TransSerialNo = ? ORDER BY CAST(TrNo AS INTEGER)', [quote.SerialNo]);
    return { document: quote, items };
  },

  getInvoiceDetails: async (invNo: string) => {
    const d = await getDb();
    const invoice = await d.getFirstAsync<any>('SELECT i.*, s.StoreDesc, s.StoreCode, s.Tel, s.Cell, s.Email FROM ininvlist i LEFT JOIN store s ON i.StoreId = s.StoreId WHERE i.INVNo = ? LIMIT 1', [invNo]);
    if (!invoice) throw new Error('Invoice not found.');
    const items = await d.getAllAsync<any>('SELECT * FROM ininvstock WHERE TransSerialNo = ? ORDER BY CAST(TrNo AS INTEGER)', [invoice.SerialNo]);
    return { document: invoice, items };
  },
  getPromotions: async (storeId: number = 1, includeInactive = false): Promise<Promotion[]> => {
    const d = await getDb();
    return await d.getAllAsync<Promotion>(`
      SELECT p.PromotionId, p.PromotionDesc, p.FromText, p.ToText, p.IsActive,
             COUNT(pi.ItemId) as ItemCount
      FROM inpromotion p
      JOIN inpromotionstore ps ON p.PromotionId = ps.PromotionId
      LEFT JOIN inpromotionitem pi ON p.PromotionId = pi.PromotionId AND pi.IsActive = 1
      WHERE ps.StoreId = ? AND (? = 1 OR p.IsActive = 1)
      GROUP BY p.PromotionId
      ORDER BY p.IsActive DESC, p.PromotionDesc
    `, [storeId, includeInactive ? 1 : 0]);
  },

  getPromotionItems: async (promotionId: number) => {
    const d = await getDb();
    return await d.getAllAsync<any>(`
      SELECT pi.PromotionId, pi.ItemId, pi.StockId, i.ItemDesc, s.StockCode,
             COALESCE(pr.POSPrice1, pr.SellPrice1, 0) as StandardPrice,
             COALESCE(pi.DiscountType, 'PRICE') as DiscountType,
             COALESCE(pi.DiscountValue, pi.Price, 0) as DiscountValue,
             COALESCE(pi.MinQty, 1) as MinQty,
             COALESCE(pi.PromotionLimit, 0) as PromotionLimit,
             pi.IsActive
      FROM inpromotionitem pi
      JOIN initem i ON i.ItemId = pi.ItemId
      JOIN instock s ON s.ItemId = pi.ItemId AND s.StockId = pi.StockId
      LEFT JOIN inprice pr ON pr.ItemId = pi.ItemId AND pr.StockId = pi.StockId
      WHERE pi.PromotionId = ?
      ORDER BY i.ItemDesc
    `, [promotionId]);
  },

  createPromotion: async (data: {
    storeId: number;
    description: string;
    fromText: string;
    toText: string;
  }) => {
    const d = await getDb();
    const description = data.description.trim();
    if (!description) throw new Error('Promotion description is required.');
    const idRow = await d.getFirstAsync<{ nextId: number }>('SELECT COALESCE(MAX(PromotionId), 0) + 1 as nextId FROM inpromotion');
    const promotionId = idRow?.nextId || 1;
    await d.withTransactionAsync(async () => {
      await d.runAsync(
        'INSERT INTO inpromotion (PromotionId, PromotionDesc, FromText, ToText, IsActive) VALUES (?, ?, ?, ?, 1)',
        [promotionId, description, data.fromText.trim(), data.toText.trim()]
      );
      await d.runAsync(
        'INSERT INTO inpromotionstore (PromotionId, StoreId, IsActive) VALUES (?, ?, 1)',
        [promotionId, data.storeId]
      );
    });
    return promotionId;
  },

  updatePromotion: async (promotionId: number, data: { description: string; fromText: string; toText: string; isActive: number }) => {
    const d = await getDb();
    const description = data.description.trim();
    if (!description) throw new Error('Promotion description is required.');
    await d.runAsync(
      'UPDATE inpromotion SET PromotionDesc = ?, FromText = ?, ToText = ?, IsActive = ? WHERE PromotionId = ?',
      [description, data.fromText.trim(), data.toText.trim(), data.isActive ? 1 : 0, promotionId]
    );
  },

  deletePromotion: async (promotionId: number) => {
    const d = await getDb();
    await d.withTransactionAsync(async () => {
      await d.runAsync('DELETE FROM inpromotionitem WHERE PromotionId = ?', [promotionId]);
      await d.runAsync('DELETE FROM inpromotionstore WHERE PromotionId = ?', [promotionId]);
      await d.runAsync('DELETE FROM inpromotion WHERE PromotionId = ?', [promotionId]);
    });
  },

  addPromotionItem: async (data: {
    promotionId: number;
    itemId: number;
    stockId: number;
    price?: number;
    discountType: 'PRICE' | 'PERCENT' | 'FIXED';
    discountValue: number;
    minQty?: number;
    promotionLimit?: number;
  }) => {
    const d = await getDb();
    const minQty = Math.max(1, Number(data.minQty || 1));
    const discountValue = Math.max(0, Number(data.discountValue || 0));
    let price = Number(data.price || 0);

    if (data.discountType === 'PRICE') {
      if (!price && discountValue > 0) price = discountValue;
      if (!Number.isFinite(price) || price < 0) throw new Error('Promotional price must be valid.');
    } else {
      const standard = await d.getFirstAsync<{ POSPrice1: number; SellPrice1: number }>(
        'SELECT POSPrice1, SellPrice1 FROM inprice WHERE ItemId = ? AND StockId = ?', [data.itemId, data.stockId]
      );
      const standardPrice = Number(standard?.POSPrice1 || standard?.SellPrice1 || 0);
      if (!standardPrice) throw new Error('Product has no selling price.');
      if (data.discountType === 'PERCENT' && discountValue > 100) throw new Error('Percentage discount cannot exceed 100%.');
      price = data.discountType === 'FIXED' ? Math.max(0, standardPrice - discountValue) : Math.max(0, standardPrice * (1 - discountValue / 100));
    }

    const existing = await d.getFirstAsync<{ PromotionId: number }>(
      'SELECT PromotionId FROM inpromotionitem WHERE PromotionId = ? AND ItemId = ? AND StockId = ?',
      [data.promotionId, data.itemId, data.stockId]
    );
    if (existing) {
      await d.runAsync(`
        UPDATE inpromotionitem
        SET Price = ?, DiscountType = ?, DiscountValue = ?, MinQty = ?, PromotionLimit = ?, IsActive = 1
        WHERE PromotionId = ? AND ItemId = ? AND StockId = ?
      `, [price, data.discountType, discountValue, minQty, Math.max(0, Number(data.promotionLimit || 0)), data.promotionId, data.itemId, data.stockId]);
    } else {
      await d.runAsync(`
        INSERT INTO inpromotionitem
          (PromotionId, ItemId, StockId, Price, PromotionLimit, DiscountType, DiscountValue, MinQty, IsActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [data.promotionId, data.itemId, data.stockId, price, Math.max(0, Number(data.promotionLimit || 0)), data.discountType, discountValue, minQty]);
    }
  },

  removePromotionItem: async (promotionId: number, itemId: number, stockId: number) => {
    const d = await getDb();
    await d.runAsync('DELETE FROM inpromotionitem WHERE PromotionId = ? AND ItemId = ? AND StockId = ?', [promotionId, itemId, stockId]);
  }
};



