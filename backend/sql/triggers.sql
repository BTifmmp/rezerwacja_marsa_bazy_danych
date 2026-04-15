CREATE OR REPLACE FUNCTION f_update_payments() RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO payments (client_id, amount)
        SELECT NEW.client_id, NEW.balance_change;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_payments
AFTER INSERT ON reservations
REFERENCING NEW TABLE AS newtab
FOR EACH ROW
EXECUTE FUNCTION f_update_payments();

CREATE OR REPLACE FUNCTION f_update_user_balance() RETURNS TRIGGER AS $$
    BEGIN
        UPDATE clients
        SET balance = balance + NEW.amount
        WHERE id = NEW.client_id;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_client_balance
AFTER INSERT ON payments
REFERENCING NEW TABLE AS newtab
FOR EACH ROW
EXECUTE FUNCTION f_update_user_balance();


CREATE OR REPLACE FUNCTION f_update_reserved() RETURNS TRIGGER AS $$
    BEGIN
        UPDATE plots
        SET reserved_by = NEW.client_id
        WHERE id = NEW.plot_id;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plot_reserved
AFTER INSERT ON reservations
REFERENCING NEW TABLE AS newtab
FOR EACH ROW
EXECUTE FUNCTION f_update_reserved();


