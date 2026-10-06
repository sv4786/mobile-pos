# Mobile POS - ACTIONS / Verification Checklist

Last reviewed against `master`.

## 1. Build & dependency integrity
- [x] `package.json` contains every runtime package imported by the app.
- [x] `package-lock.json` root dependencies match `package.json`.
- [x] Expo SDK 57 package versions remain aligned.
- [ ] Run `npm install` locally after pulling changes.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npx expo start -c`.
- [ ] Run Android debug build with `gradlew.bat assembleDebug`.

## 2. POS / sales
- [x] Cash payment.
- [x] Card payment.
- [x] EFT / Other payment.
- [x] Credit payment with customer credit-limit checks.
- [x] Walk-in customer cannot buy on credit.
- [x] Cash change calculation.
- [x] Insufficient payment blocked.
- [x] Invoice PDF generation.
- [x] Quote PDF generation.
- [x] Invoice / quote re-open.
- [x] PDF sharing.
- [x] Native Android print action.

## 3. Barcode / hardware workflow
- [x] Manual barcode input.
- [x] Camera barcode scanning.
- [x] Scan-first POS input focus.
- [x] Stock-take scanning.
- [x] Native Android print service used instead of a paid printer SDK.
- [ ] Test with a physical Bluetooth thermal printer.
- [ ] Test with a USB barcode scanner on the target Android device.

## 4. Products / inventory
- [x] Create product.
- [x] Edit product.
- [x] Delete product.
- [x] CSV product import.
- [x] Receive stock.
- [x] Stock adjustment.
- [x] Store transfer.
- [x] Movement history.
- [x] Stock take.
- [x] Negative-stock protection.
- [x] Audit logging for product and inventory changes.

## 5. Customers / credit
- [x] Create customer.
- [x] Edit customer.
- [x] Delete customer with sales-history protection.
- [x] Customer credit limit.
- [x] Available-credit calculation.
- [x] Credit sale.
- [x] Invoice payment.
- [x] General account payment.
- [x] Partial payment.
- [x] Customer statement PDF.
- [x] Audit logging for customer changes and account payments.

## 6. Promotions / discounts
- [x] Promotion CRUD.
- [x] Active/inactive promotions.
- [x] Start/end dates.
- [x] Promotional price.
- [x] Percentage discount.
- [x] Fixed discount.
- [x] Minimum quantity.
- [x] Promotion limit.
- [x] One-off POS line discounts.
- [x] Promotion audit logging.
- [x] Stock-take finalization audit logging.
- [ ] Verify combined promotion + one-off discount behaviour with real sales.

## 7. Reporting
- [x] Analytics dashboard.
- [x] Revenue trend.
- [x] Popular products.
- [x] Payment methods.
- [x] Top customers.
- [x] Low-stock view.
- [x] Analytics PDF.
- [x] Business report date range.
- [x] Business report PDF.
- [ ] Verify report totals against a manually calculated test day.

## 8. Backup / recovery
- [x] SQLite database backup.
- [x] Backup sharing/export.
- [x] SQLite restore.
- [x] Restore-file validation.
- [x] Data reload after restore.
- [x] Backup/restore audit events.
- [ ] Test restore after creating invoices, customers and stock movements.
- [ ] Test restore from an intentionally invalid file.

## 8. Automated unit tests

- [x] Jest test runner configured.
- [x] POS payment and credit rules covered.
- [x] Inventory rules covered.
- [x] Customer credit rules covered.
- [x] Promotion/discount rules covered.
- [x] Reporting calculations covered.
- [x] Security PIN rules covered.
- [x] Backup/recovery rules covered.
- [x] Commercial formatting rules covered.
- [ ] Run `npm test -- --coverage` locally.
- [ ] Require the GitHub Actions quality workflow to pass before release.

## 9. Security / audit
- [x] Optional owner 4-digit PIN.
- [x] PIN stored through SecureStore.
- [x] PIN is hashed before storage.
- [x] App lock on startup when enabled.
- [x] PIN change.
- [x] PIN disable confirmation.
- [x] Local audit trail.
- [x] Audit retention capped at 500 records.
- [x] Product audit events.
- [x] Customer audit events.
- [x] Inventory audit events.
- [x] Invoice / quote audit events.
- [x] Account-payment audit events.
- [x] Promotion audit events.
- [x] Backup / restore audit events.
- [ ] Test incorrect PIN behaviour on a physical device.
- [ ] Test app restart while PIN is enabled.
- [ ] Confirm sensitive customer data is not included in debug logging.

## 10. Commercial product requirements
- [x] Local-first SQLite architecture.
- [x] No required cloud account.
- [x] No required monthly payment gateway.
- [x] No required printer SDK/subscription.
- [x] Suitable for small/informal businesses.
- [x] No per-user pricing requirement.
- [x] No forced multi-store/staff complexity.
- [ ] Finalise business branding.
- [ ] Finalise production version number.
- [ ] Finalise pricing before release.

## 11. Known release pricing target
Initial target:
- Free trial: 30 days.
- Main plan: R99/month.
- Annual: R999/year.
- Optional once-off offline licence: R799.

Pricing must be reviewed against actual support, distribution and payment-processing costs before launch.

## 12. Release gate

Do not call the app production-ready until all unchecked local/device tests above are completed.

Current code-review status: **PASS WITH LOCAL/DEVICE TESTS PENDING**.

Static repository audit completed after the latest security and audit changes. The GitHub quality workflow was added, but no workflow run was available yet at the time of this review.
