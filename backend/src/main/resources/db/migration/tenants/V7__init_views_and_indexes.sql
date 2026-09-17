-- ============================================================================
-- Modül 7: SQL Görünümleri ve Performans İndeksleri (Views & Indexes)
-- ============================================================================

-- 1. Varyantların tüm depolardaki konsolide stok durumunu veren SQL View
CREATE OR REPLACE VIEW v_variant_stock_summary AS
SELECT 
    pv.id AS variant_id,
    pv.product_id,
    pv.sku,
    pv.variant_name,
    COALESCE(SUM(ws.quantity), 0) AS total_physical_stock,
    COALESCE(SUM(ws.reserved_stock), 0) AS total_reserved_stock,
    COALESCE(SUM(ws.quantity), 0) - COALESCE(SUM(ws.reserved_stock), 0) AS total_available_stock
FROM product_variants pv
LEFT JOIN warehouse_stocks ws ON ws.variant_id = pv.id
GROUP BY pv.id, pv.product_id, pv.sku, pv.variant_name;

-- 2. JSONB İndeksleri (Dinamik arama ve filtreleme hızlandırma)
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING gin (attributes);
CREATE INDEX IF NOT EXISTS idx_variants_attributes ON product_variants USING gin (attributes);

-- 3. Depo & Stok İndeksleri
CREATE INDEX IF NOT EXISTS idx_wh_stocks_warehouse ON warehouse_stocks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wh_stocks_variant ON warehouse_stocks(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_source_wh ON stock_movements(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_target_wh ON stock_movements(target_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- 4. Foreign Key B-Tree İndeksleri (JOIN sorgu optimizasyonu)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_quotations_partner ON quotations(partner_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_variant ON quotation_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_quotation ON orders(quotation_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_waybills_partner ON waybills(partner_id);
CREATE INDEX IF NOT EXISTS idx_waybills_order ON waybills(order_id);
CREATE INDEX IF NOT EXISTS idx_waybills_source_wh ON waybills(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_waybills_target_wh ON waybills(target_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_waybill_items_waybill ON waybill_items(waybill_id);
CREATE INDEX IF NOT EXISTS idx_waybill_items_order_item ON waybill_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_waybill_items_variant ON waybill_items(variant_id);

-- 5. Durum ve Tarih Filtreleme İndeksleri (ERP Listeleme & Raporlama için)
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, order_date);
CREATE INDEX IF NOT EXISTS idx_quotations_status_date ON quotations(status, issue_date);
CREATE INDEX IF NOT EXISTS idx_waybills_status_date ON waybills(status, dispatch_date);

-- 6. Denetim Logu İndeksleri
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs (performed_at);
