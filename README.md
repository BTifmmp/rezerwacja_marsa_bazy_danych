## MarsReservation - rezerwacja działek na marsie
Blazej Turczynowicz  
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
* **`v_client_summary`**: Podsumowanie klienta

### Triggery
* **`trg_plot_reserved`**: Zmienia stan rezerwacji dzialki po pojawieniu sie zmiany w `reservations`.
* **`trg_client_balance`**: Aktualizuje posiadane srodki na koncie klienta po zmianie w systemie platnosci `payments`.
* **`trg_update_payments`**: Aktualizuje posiadane srodki na koncie klienta po zmianie w systemie platnosci `payments`.

### Funkcje
* **`fn_plots_sold_between`**: Raport sprzedazy rezerwacji w danym przedziale dat.
