CREATE PROCEDURE p_reserve(p_client_id INT, p_plot_id INT)
LANGUAGE plpgsql
AS $$
DECLARE v_client_balance DECIMAL(15, 2);
DECLARE v_plot_price DECIMAL(15, 2);
DECLARE v_balance_change DECIMAL(15, 2);
DECLARE v_is_available BOOLEAN;
BEGIN
    SELECT balance INTO v_client_balance FROM clients WHERE id = p_client_id FOR UPDATE;
    SELECT price, (reserved_by IS NULL) 
    INTO v_plot_price, v_is_available
    FROM plots
    WHERE id = p_plot_id 
    FOR UPDATE;

    IF NOT v_is_available THEN
        RAISE EXCEPTION 'Plot % is already reserved.', p_plot_id;
    END IF;

    IF v_client_balance >= v_plot_price THEN
        INSERT INTO reservations (client_id, plot_id, operation, balance_change)
        VALUES (p_client_id, p_plot_id, 'add', -v_plot_price);

        UPDATE plots SET reserved_by = p_client_id WHERE id = p_plot_id;
    ELSE
        RAISE EXCEPTION 'Not enough balance to reserve the plot.';
    END IF;

COMMIT;
END;
$$;

CREATE PROCEDURE p_remove_reservation(p_client_id INT, p_plot_id INT)
LANGUAGE plpgsql
AS $$
DECLARE v_is_owned BOOLEAN;
DECLARE v_previous_balance_change DECIMAL(15, 2);
BEGIN
    SELECT (reserved_by = p_client_id) INTO v_is_owned
    FROM plots 
    WHERE id = p_plot_id
    FOR UPDATE;

    IF NOT v_is_owned THEN
        RAISE EXCEPTION 'Plot % is not reserved by client %.', p_plot_id, p_client_id;
    END IF;

    SELECT balance_change INTO v_previous_balance_change
    FROM reservations
    WHERE client_id = p_client_id AND plot_id = p_plot_id AND operation = 'add';

    INSERT INTO reservations (client_id, plot_id, operation, balance_change)
    VALUES (p_client_id, p_plot_id, 'remove', -v_previous_balance_change);

    UPDATE plots SET reserved_by = NULL WHERE id = p_plot_id;

    COMMIT;
END;
$$;