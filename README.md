# dc-server-mappings

Repozytorium zawiera mappingi serwerów dla **Dream Client** — dzięki nim serwery Minecraft mogą wyświetlać własne ikony, bannery i opisy bezpośrednio w kliencie i launcherze.

## Do czego to służy?

Dream Client pobiera dane z tego repozytorium, żeby na liście serwerów pokazywać coś więcej niż tylko adres IP — własną grafikę, opis i linki do social mediów. To repozytorium jest miejscem, gdzie administratorzy serwerów mogą zgłosić swój serwer do wyświetlenia.

Narzędzia zawarte w projekcie automatycznie sprawdzają poprawność każdego zgłoszenia i budują jeden plik dystrybucyjny, który klient pobiera przy starcie.

## Struktura katalogów

```
servers/          — jeden podfolder na serwer (manifest.json + grafiki)
tools/            — skrypty Node.js do walidacji i budowania
.github/          — konfiguracja GitHub Actions i szablon PR
docs/             — dokumentacja
dist/             — wygenerowany plik wynikowy (tworzony automatycznie)
```

## Dokumentacja

- [Przewodnik krok po kroku](docs/getting-started.md)
- [Format pliku manifest.json](docs/manifest-format.md)
- [Wymagania dotyczące grafik](docs/assets.md)

## Jak dodać swój serwer

1. Zrób **fork** tego repozytorium na GitHubie
2. Utwórz folder `servers/<id-serwera>/` i dodaj do niego `manifest.json` — szczegóły w [manifest-format.md](docs/manifest-format.md)
3. Dodaj `icon.png` (kwadratowy, 64–512 px) i `bg.png` (dokładnie 1920×1080 px)
4. Otwórz Pull Request — automatyczna walidacja uruchomi się natychmiast
5. Poczekaj na przegląd od opiekuna projektu

## Testowanie lokalne

```bash
npm install

# Sprawdzenie poprawności wszystkich wpisów i grafik
npm run validate

# Zbudowanie pliku wynikowego do dist/
npm run build
```

## Najczęstsze powody odrzucenia PR

- Serwer był offline lub w trybie konserwacji podczas przeglądu
- Grafiki mają zły rozmiar lub format (patrz [assets.md](docs/assets.md))
- Plik `manifest.json` zawiera błędy walidacji
- Wartość pola `id` nie zgadza się z nazwą folderu
