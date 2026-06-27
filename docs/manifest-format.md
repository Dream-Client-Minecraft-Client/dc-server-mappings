# Format pliku manifest.json

Każdy serwer dodany do Dream Client musi zawierać plik `manifest.json` opisujący dane serwera. Poniżej znajdziesz wszystkie dostępne pola wraz z przykładami.

Pełny schemat walidacyjny dostępny jest w `servers/manifest-schema.json`.

---

## Struktura katalogu

```
servers/
└── id-twojego-serwera/
    ├── manifest.json
    ├── icon.png
    └── bg.png
```

Nazwa folderu musi być identyczna z wartością pola `id` w manifeście.

---

## Minimalny manifest

To jest najmniejszy poprawny manifest — zawiera tylko wymagane pola:

```json
{
  "id": "id-twojego-serwera",
  "name": "Nazwa Twojego Serwera",
  "description": "Krótki opis serwera.",
  "addresses": ["play.twojserwer.pl"],
  "primaryAddress": "play.twojserwer.pl",
  "minecraftVersions": ["1.8.*"],
  "primaryMinecraftVersion": "1.8.*",
  "categories": ["SURVIVAL"],
  "assets": {
    "icon": "./icon.png",
    "background": "./bg.png"
  }
}
```

---

## Wymagane pola

| Pole                        | Typ              | Opis                                                       | Przykład                         |
| --------------------------- | ---------------- | ---------------------------------------------------------- | -------------------------------- |
| `id`                        | string           | Unikalny identyfikator — tylko małe litery i myślniki      | `"moj-serwer"`                   |
| `name`                      | string           | Wyświetlana nazwa serwera                                  | `"Mój Serwer"`                   |
| `description`               | string           | Krótki opis, maksymalnie 300 znaków                        | `"Najlepszy serwer survivalowy"` |
| `addresses`                 | tablica stringów | Adresy / domeny serwera (minimum jedna)                    | `["play.mojserwer.pl"]`          |
| `primaryAddress`            | string           | Główny adres serwera wyświetlany użytkownikom              | `"play.mojserwer.pl"`            |
| `minecraftVersions`         | tablica stringów | Obsługiwane wersje Minecrafta, wildcards dozwolone         | `["1.8.*", "1.21.*"]`            |
| `primaryMinecraftVersion`   | string           | Główna/zalecana wersja Minecrafta dla serwera              | `"1.21.*"`                       |
| `categories`                | tablica stringów | Kategorie opisujące tryby gry (patrz tabela niżej)         | `["SURVIVAL", "PVP"]`            |
| `assets`                    | obiekt           | Ścieżki do ikony i tła (względne, zaczynające się od `./`) | `{"icon": "./icon.png", ...}`    |

---

## Opcjonalne pola

| Pole              | Typ              | Opis                                                                   |
| ----------------- | ---------------- | ---------------------------------------------------------------------- |
| `languages`       | tablica stringów | Języki serwera — kody ISO 639-1 dużymi literami, np. `PL`, `EN`, `DE` |
| `primaryLanguage` | string           | Główny język serwera (musi być w `languages`)                          |
| `offline`         | boolean          | `true` jeśli serwer akceptuje graczy z nieoryginalnym kontem (offline) |
| `social`          | obiekt           | Linki do stron i mediów społecznościowych (patrz sekcja poniżej)       |

---

## Kategorie

| Wartość     | Opis                              |
| ----------- | --------------------------------- |
| `PVP`       | Gracz kontra gracz                |
| `SURVIVAL`  | Tryb przetrwania                  |
| `CREATIVE`  | Tryb kreatywny                    |
| `MINIGAMES` | Minigry                           |
| `SKYBLOCK`  | Przeżycie na wyspie SkyBlock      |
| `PRISON`    | Serwer więzienny                  |
| `FACTIONS`  | Frakcje i walka drużynowa         |
| `UHC`       | Ultra Hardcore                    |
| `KITPVP`    | PvP z gotowymi zestawami          |
| `ANARCHY`   | Brak zasad                        |
| `RPG`       | Gry fabularne                     |
| `ADVENTURE` | Przygoda i eksploracja            |
| `BUILD`     | Budowanie                         |
| `TECHNICAL` | Redstone i techniczne Minecraft   |
| `VANILLA`   | Niezmodyfikowane Minecraft        |
| `MODDED`    | Mody lub rozbudowane pluginy      |
| `PARKOUR`   | Mapy parkourowe                   |
| `BEDWARS`   | Bed Wars                          |
| `SKYWARS`   | SkyWars                           |
| `HG`        | Hunger Games                      |
| `CITYBUILD` | Budowanie miast                   |
| `CUSTOM`    | Niestandardowe tryby gry          |

---

## Linki społecznościowe

Pole `social` jest opcjonalne. Możesz podać dowolną kombinację poniższych linków:

```json
"social": {
  "website":   "https://twojserwer.pl",
  "store":     "https://sklep.twojserwer.pl",
  "discord":   "https://discord.gg/twojserwer",
  "youtube":   "https://youtube.com/@twojserwer",
  "twitter":   "https://x.com/twojserwer",
  "instagram": "https://instagram.com/twojserwer",
  "tiktok":    "https://tiktok.com/@twojserwer",
  "facebook":  "https://facebook.com/twojserwer",
  "teamspeak": "ts.twojserwer.pl"
}
```

Wszystkie pola URL muszą zaczynać się od `https://`. Pole `teamspeak` przyjmuje samą nazwę hosta.

---

## Kompletny przykład

```json
{
  "id": "przykladowy-serwer",
  "name": "Przykładowy Serwer",
  "description": "Survivalowy serwer dla graczy w każdym wieku z aktywną społecznością.",
  "minecraftVersions": ["1.8.*", "1.20.*", "1.21.*"],
  "primaryMinecraftVersion": "1.21.*",
  "addresses": ["play.przyklad.pl", "mc.przyklad.pl"],
  "primaryAddress": "play.przyklad.pl",
  "categories": ["SURVIVAL", "PVP", "MINIGAMES"],
  "languages": ["PL", "EN"],
  "primaryLanguage": "PL",
  "offline": false,
  "assets": {
    "icon":       "./icon.png",
    "background": "./bg.png"
  },
  "social": {
    "website":  "https://przyklad.pl",
    "discord":  "https://discord.gg/przyklad",
    "youtube":  "https://youtube.com/@przyklad"
  }
}
```

---

## Walidacja lokalna

Przed otwarciem PR sprawdź manifest lokalnie:

```bash
npm install
npm run validate
```

CI uruchamia te same sprawdzenia automatycznie po otwarciu Pull Requesta.

---

## Częste błędy

| Komunikat błędu                     | Przyczyna i rozwiązanie                                             |
| ----------------------------------- | ------------------------------------------------------------------- |
| `"id" is required`                  | Brakuje pola `id` — dodaj je i upewnij się, że zgadza się z nazwą folderu |
| `"id" must match folder name`       | Nazwa folderu i wartość `id` muszą być identyczne                   |
| `"addresses" is required`           | Dodaj co najmniej jeden adres serwera                               |
| `Invalid category`                  | Użyj wartości z tabeli kategorii powyżej                            |
| `Language code pattern mismatch`    | Kody języków muszą być dwuliterowe i pisane dużymi literami: `PL`, `EN` |
| `Icon file not found`               | Sprawdź czy `icon.png` istnieje i czy ścieżka w manifeście jest poprawna |
| `Background dimensions incorrect`   | Obraz tła musi mieć dokładnie 1920×1080 px                          |