import * as SQLite from 'expo-sqlite';
import { Product, Store, Customer, Quote, Invoice, Promotion } from './types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('mobile_pos.db');
  await initDatabaseSchema(db);
  // Database starts empty on a fresh install.
  // SQLite persists this database across normal app restarts and launches.
  return db;
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
      Posted TEXT
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
      SerialNo TEXT
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
  `);

  const quoteColumns = await d.getAllAsync<{ name: string }>('PRAGMA table_info(inqulist)');
  if (!quoteColumns.some(column => column.name === 'PdfPath')) {
    await d.runAsync('ALTER TABLE inqulist ADD COLUMN PdfPath TEXT');
  }

  const invoiceColumns = await d.getAllAsync<{ name: string }>('PRAGMA table_info(ininvlist)');
  if (!invoiceColumns.some(column => column.name === 'PdfPath')) {
    await d.runAsync('ALTER TABLE ininvlist ADD COLUMN PdfPath TEXT');
  }
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
        WHERE Company LIKE ? OR AccCode LIKE ? OR Contact LIKE ? OR Tel LIKE ?
        ORDER BY Company LIMIT 50
      `, [queryStr, queryStr, queryStr, queryStr]);
    }
    return await d.getAllAsync<Customer>(`SELECT AccId, AccCode, Company, Contact, Tel, Cell, Email, PriceListId, COALESCE(AutoDisc, 0) as AutoDisc, COALESCE(AllowPriceMatrix, 0) as AllowPriceMatrix, CrLimit FROM aracc ORDER BY Company LIMIT 50`);
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

  checkPrice: async (itemId: number, stockId: number, accId?: number, storeId?: number) => {
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
      const promoRow = await d.getFirstAsync<{ Price: number; PromotionId: number; PromotionDesc: string }>(`
        SELECT pi.Price, p.PromotionId, p.PromotionDesc
        FROM inpromotionitem pi
        JOIN inpromotion p ON pi.PromotionId = p.PromotionId
        JOIN inpromotionstore ps ON p.PromotionId = ps.PromotionId
        WHERE pi.ItemId = ? AND pi.StockId = ? 
          AND ps.StoreId = ? 
          AND pi.IsActive = 1 AND p.IsActive = 1 AND ps.IsActive = 1
        LIMIT 1
      `, [itemId, stockId, storeId]);
      if (promoRow?.Price) {
        finalPrice = promoRow.Price;
        priceSource = `Promotion: ${promoRow.PromotionDesc}`;
        promoId = promoRow.PromotionId;
        promoDesc = promoRow.PromotionDesc;
      }
    }

    return {
      item_id: itemId,
      stock_id: stockId,
      standard_price: standardPrice,
      unit_price: Math.round(finalPrice * 100) / 100,
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
  getPromotions: async (storeId: number = 1): Promise<Promotion[]> => {
    const d = await getDb();
    return await d.getAllAsync<Promotion>(`
      SELECT p.PromotionId, p.PromotionDesc, p.FromText, p.ToText, p.IsActive,
             COUNT(pi.ItemId) as ItemCount
      FROM inpromotion p
      JOIN inpromotionstore ps ON p.PromotionId = ps.PromotionId
      LEFT JOIN inpromotionitem pi ON p.PromotionId = pi.PromotionId
      WHERE ps.StoreId = ? AND p.IsActive = 1
      GROUP BY p.PromotionId
      ORDER BY p.PromotionDesc
    `, [storeId]);
  }
};



