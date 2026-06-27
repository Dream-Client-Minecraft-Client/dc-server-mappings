# Wymagania dotyczące grafik

Każdy wpis wymaga dwóch plików graficznych: ikony i tła. Poniżej znajdziesz wszystkie wymagania — niespełnienie ich spowoduje automatyczne odrzucenie PR.

---

## Ikona — `icon.png`

- Format: **PNG**
- Rozmiar: kwadratowy, od **64×64** do **512×512** px
- Przezroczystość: obsługiwana i zalecana
- Ikona powinna być czytelna nawet w małym rozmiarze — unikaj drobnych szczegółów i niskiego kontrastu

## Tło — `bg.png`

- Format: **PNG**
- Rozmiar: dokładnie **1920×1080** px — żadnych wyjątków
- Przezroczystość: niedopuszczalna (musi być w pełni nieprzezroczyste)
- Tło jest wyświetlane zarówno w kliencie Minecraft (Java Edition), jak i w Dream Client Web UI
- Nie umieszczaj na tle dużego tekstu ani logo — mogą być zakryte przez nakładkę klienta
- Używaj bezstratnej kompresji PNG, żeby zachować jakość

---

## Użycie w manifeście

```json
"assets": {
  "icon":       "./icon.png",
  "background": "./bg.png"
}
```

Ścieżki muszą zaczynać się od `./` i być względne względem pliku `manifest.json`.

---

## Nazwy plików w katalogu wynikowym

Skrypt budujący automatycznie zmienia nazwę `bg.png` na `background.png` w pliku wynikowym — nie musisz nic zmieniać ręcznie.