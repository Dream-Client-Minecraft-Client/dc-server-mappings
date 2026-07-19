# Wymagania dotyczące grafik

Ikona i tło są **opcjonalne i niezależne od siebie** — możesz podać jedno, oba, albo żadne z nich. Poniżej znajdziesz wymagania, które obowiązują tylko wtedy, gdy dany plik faktycznie podajesz w manifeście; niespełnienie ich (np. złe wymiary) spowoduje automatyczne odrzucenie PR, ale sam brak pliku nie jest błędem.

---

## Ikona — `icon.png` (opcjonalna)

- Format: **PNG**
- Rozmiar: kwadratowy, od **64×64** do **512×512** px
- Przezroczystość: obsługiwana i zalecana
- Ikona powinna być czytelna nawet w małym rozmiarze — unikaj drobnych szczegółów i niskiego kontrastu
- Jeśli pominięta, serwer wyświetli domyślną ikonę klienta

## Tło — `bg.png` (opcjonalne)

- Format: **PNG**
- Rozmiar: dokładnie **1920×1080** px — żadnych wyjątków
- Przezroczystość: niedopuszczalna (musi być w pełni nieprzezroczyste)
- Tło jest wyświetlane zarówno w kliencie Minecraft (Java Edition), jak i w Dream Client Web UI
- Nie umieszczaj na tle dużego tekstu ani logo — mogą być zakryte przez nakładkę klienta
- Używaj bezstratnej kompresji PNG, żeby zachować jakość
- Jeśli pominięte, serwer wyświetli się bez własnego tła (domyślny wygląd listy serwerów)

---

## Użycie w manifeście

Oba pola naraz:

```json
"assets": {
  "icon":       "./icon.png",
  "background": "./bg.png"
}
```

Albo tylko jedno z nich:

```json
"assets": {
  "icon": "./icon.png"
}
```

Ścieżki muszą zaczynać się od `./` i być względne względem pliku `manifest.json`.

---

## Nazwy plików w katalogu wynikowym

Skrypt budujący automatycznie zmienia nazwę `bg.png` na `background.png` w pliku wynikowym — nie musisz nic zmieniać ręcznie.