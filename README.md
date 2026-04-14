## MarsReservation - rezerwacja działek na marsie
Projekt do zarządzania sprzedaża rezerwacji działek na marsie.

* **Technologie backend:** Node.js (Express), PostgreSQL, biblioteka `pg`.
* **Technologie frontend:** React, Shadcn UI - gotowe komponenty.

---

## Implementacja

### Tabele (Modele danych)
* **`clients`**: Dane klientow.
* **`plots`**: Rejestr gruntów.
* **`reservations`**: Zmian rezerwacji - nowe rezerwacje oraz zmiany statusu.
* **`payments`**: System platnosci.

### Procedury
* **`p_reserve`**: Rezerwuje dzialke.
* **`p_remove_reservation`**: Usuwa rezerwacje dzialki.

### Widoki
* **`v_available_plots`**: Widok tylko wolnych gruntów
* **`v_sales_report`**: Zestawienie pokazujące sumaryczną wartość działek zakupionych przez kazdego klienta

### Triggery
* **`trg_plot_reserved`**: Zmienia stan rezerwacji dzialki po pojawieniu sie zmiany w `reservations`.
* **`trg_client_balance`**: Aktualizuje posiadane srodki na koncie klienta po zmianie w systemie platnosci `payments`.

### Funkcje
* **`fn_plots_sold_between`**: Raport sprzedazy rezerwacji w danym przedziale dat.
* **`fn_owned_plots`**: Zwraca dzialki zarezerwowane przez danego klienta.