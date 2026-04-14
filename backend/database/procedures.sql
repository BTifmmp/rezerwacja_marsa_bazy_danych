CREATE PROCEDURE p_reserve(client_id INT, plot_id INT)
LANGUAGE SQL
DECLARE client_balance DECIMAL(15, 2);
DECLARE plot_price DECIMAL(15, 2);
DECLARE balance_change DECIMAL(15, 2);
BEGIN ATOMIC
    SELECT balance INTO client_balance FROM clients WHERE id = client_id;
    SELECT price INTO plot_price FROM plots WHERE id = plot_id;

    IF client_balance >= plot_price THEN
        INSERT INTO reservations (client_id, plot_id, operation, balance_change)
        VALUES (client_id, plot_id, 'add', -plot_price);
    ELSE
        RAISE EXCEPTION 'Insufficient balance to reserve the plot.'
    END IF;
END;

CREATE PROCEDURE p_remove_reservation(client_id INT, plot_id INT)
LANGUAGE SQL
DECLARE is_owned BOOLEAN;
DECLARE previous_balance_change DECIMAL(15, 2);
BEGIN ATOMIC

    SELECT EXISTS (
        SELECT 1 
        FROM plots 
        WHERE id = plot_id AND reserved_by = client_id
    ) INTO is_owned;

    IF NOT is_owned THEN
        RAISE EXCEPTION 'Plot % is not reserved by client %.', plot_id, client_id
        USING ERRCODE = 'P0002';
    END IF;

    SELECT balance_change INTO previous_balance_change
    FROM reservations
    WHERE client_id = client_id AND plot_id = plot_id AND operation = 'add';

    INSERT INTO reservations (client_id, plot_id, operation, balance_change)
    VALUES (client_id, plot_id, 'remove', previous_balance_change);
END;