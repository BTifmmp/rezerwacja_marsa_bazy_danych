
CREATE VIEW v_available_plots AS
    SELECT * FROM plots
    WHERE reserved_by IS NULL;

CREATE VIEW v_sales_report AS
    SELECT
        c.id AS client_id,
        c.name,
        c.last_name,
        SUM(r.balance_change) AS total_paid,
        COUNT(DISTINCT r.plot_id) AS plots_reserved
    FROM clients c
    LEFT JOIN reservations r ON c.id = r.client_id
    GROUP BY c.id;