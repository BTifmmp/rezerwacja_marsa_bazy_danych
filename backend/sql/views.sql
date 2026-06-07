
CREATE OR REPLACE VIEW v_available_plots AS
SELECT * FROM plots
WHERE reserved_by IS NULL;

CREATE OR REPLACE VIEW v_client_summary AS
WITH 
client_plots AS (
    SELECT 
        reserved_by AS client_id,
        COUNT(id) AS plots_owned_count,
        COALESCE(SUM(size), 0) AS total_size
    FROM plots
    GROUP BY reserved_by
),
client_reservations AS (
    SELECT 
        client_id,
        SUM(balance_change) AS total_paid
    FROM reservations
    GROUP BY client_id
)
SELECT 
    c.id AS client_id,
    c.name || ' ' || c.last_name AS full_name,
    c.balance AS current_account_balance,
    COALESCE(cp.plots_owned_count, 0) AS plots_owned_count,
    COALESCE(cp.total_size, 0) AS total_size,
    COALESCE(cr.total_paid, 0) AS total_paid
FROM clients c
LEFT JOIN client_plots cp ON c.id = cp.client_id
LEFT JOIN client_reservations cr ON c.id = cr.client_id;