# Pierwsze kroki — jak dodać swój serwer

Nie wiesz od czego zacząć? Ten przewodnik przeprowadzi Cię przez cały proces — od zera do gotowego wpisu na liście serwerów Dream Client.

---

## 0. Co właściwie się tu dzieje?

Dream Client wyświetla na liście serwerów dodatkowe informacje: własną ikonę, baner i opis. Te dane nie są przechowywane w samym kliencie — klient pobiera je z tego repozytorium. Żeby Twój serwer miał własny wpis, musisz go tutaj dodać.

Przykładowy manifest znajdziesz w `servers/hypixel/manifest.json`.

---

## 1. Utwórz fork repozytorium

Nie możesz edytować tego repozytorium bezpośrednio — nie masz do niego uprawnień. Zamiast tego tworzysz własną kopię (tzw. **fork**), wprowadzasz w niej zmiany, a potem prosisz o ich włączenie przez Pull Request.

Żeby to zrobić, potrzebujesz konta na GitHubie. Kiedy je masz, wejdź na stronę repozytorium i kliknij przycisk **Fork** w prawym górnym rogu.

---

## 2. Dodaj pliki swojego serwera

W swoim forku otwórz katalog `servers/` i utwórz nowy podfolder. Nazwa folderu to `id` Twojego serwera — używaj tylko małych liter i myślników (np. `moj-serwer`).

Wewnątrz tego folderu umieść plik `manifest.json` (wymagany) oraz opcjonalnie własną ikonę i/lub tło:

| Plik            | Wymagany?    | Co to jest                                                          |
| --------------- | ------------ | --------------------------------------------------------------------|
| `manifest.json` | tak          | Dane serwera — patrz [manifest-format.md](manifest-format.md)       |
| `icon.png`      | opcjonalnie  | Kwadratowa ikona, 64–512 px — patrz [assets.md](assets.md)          |
| `bg.png`        | opcjonalnie  | Obraz tła, dokładnie 1920×1080 px — patrz [assets.md](assets.md)    |

Możesz dodać oba pliki graficzne, tylko jeden z nich, albo żaden — serwer bez własnych grafik po prostu użyje domyślnego wyglądu klienta.

Nazwa folderu musi być identyczna z wartością pola `id` w manifeście — jeśli się różnią, walidacja automatycznie odrzuci zgłoszenie.

---

## 3. Otwórz Pull Request

Gdy masz już gotowe pliki, wróć na stronę repozytorium (nie swojego forka, lecz oryginału). Powinieneś zobaczyć żółty baner z informacją, że Twoja gałąź jest do przodu względem `main`. Kliknij **Contribute**, a następnie **Open pull request**.

Wypełnij checklistę w opisie PR — każdy punkt to coś, co faktycznie powinieneś sprawdzić przed wysłaniem. Następnie kliknij **Create pull request**.

---

## 4. Poczekaj na wyniki automatycznej walidacji

Po otwarciu PR GitHub Actions uruchamia dwa sprawdzenia:

- **Sprawdzenie manifestu** — schemat JSON, wymagane pola, dostępność serwera
- **Sprawdzenie grafik** — format PNG, rozmiary

Jeśli przy którymś widnieje ❌, kliknij je i przeczytaj komunikat o błędzie. Bot napisze też komentarz bezpośrednio w PR z podsumowaniem problemów. Popraw błędy, wypchnij zmiany — sprawdzenia uruchomią się ponownie.

**PR z nieudaną walidacją nie zostanie scalony.**

---

## 5. Poczekaj na recenzję

Jeden z opiekunów projektu przejrzy Twój PR. Może to potrwać kilka dni. Jeśli po tygodniu nie ma odpowiedzi, dołącz do naszego Discorda i otwórz ticket.

---

## Najczęstsze przyczyny odrzucenia

- Serwer był offline lub w trybie konserwacji w trakcie przeglądu
- Grafiki mają nieprawidłowe wymiary lub format
- Plik manifestu zawiera błędy
- Pole `id` nie zgadza się z nazwą folderu