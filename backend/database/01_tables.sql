
CREATE TABLE clients (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00
);


CREATE TABLE plots (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserved_by INT,
    price DECIMAL(15, 2) NOT NULL,
    size DECIMAL(15, 2) NOT NULL,

    FOREIGN KEY (reserved_by) REFERENCES clients(id) ON DELETE RESTRICT
);


CREATE TYPE reservation_operation AS ENUM ('add', 'remove');
CREATE TABLE reservations (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id INT NOT NULL,
    plot_id INT NOT NULL,
    operation reservation_operation NOT NULL,
    balance_change DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE RESTRICT
);


CREATE TABLE payments (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);

