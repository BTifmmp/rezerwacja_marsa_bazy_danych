CREATE TRIGGER trg_plot_reserved
AFTER INSERT ON reservations
REFERENCING NEW TABLE AS newtab OLD TABLE AS oldtab
FOR EACH ROW
EXECUTE FUNCTION p_update_user_balance();

CREATE OR REPLACE FUNCTION f_update_user_balance() RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            INSERT INTO payments (client_id, amount)
            SELECT NEW.client_id, NEW.balance_change;
        END IF;
        RETURN NULL;
    END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_client_balance
AFTER INSERT ON payments
REFERENCING NEW TABLE AS newtab OLD TABLE AS oldtab
FOR EACH ROW
EXECUTE FUNCTION f_update_user_balance();

CREATE OR REPLACE FUNCTION f_update_user_balance() RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            UPDATE clients
            SET balance = balance + NEW.amount
            WHERE id = NEW.client_id;
        END IF;
        RETURN NULL;
    END;
$$ LANGUAGE plpgsql;