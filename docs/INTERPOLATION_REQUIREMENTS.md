# Požadavky pro interpolaci dat

## Přehled

Interpolace chybějících záznamů je pokročilá funkce, která vyžaduje splnění specifických kritérií pro zajištění kvality výsledků a technické bezpečnosti aplikace.

## Optimální požadavky (implementované)

### 1. **Hustota dat: 10% pokrytí**
- **Požadavek**: Alespoň 10% z očekávaného počtu záznamů v časovém rozsahu
- **Příklad pro roční data**: Minimálně 3 504 záznamů z celkových 35 040 (4 záznamy/hodina × 24 hodin × 365 dní)
- **Prakticky**: Přibližně 1 záznam týdně v průměru
- **Důvod**: Zajištění dostatečného množství referenčních bodů pro kvalitní interpolaci

### 2. **Maximální časová mezera: 7 dní**
- **Požadavek**: Mezi žádnými dvěma po sobě jdoucími záznamy nesmí být více než 7 dní
- **Důvod**: Interpolace přes delší období není spolehlivá pro energetická data
- **Benefit**: Zachování přesnosti vzorců spotřeby

### 3. **Minimální pokrytí měsíců: 6 měsíců**
- **Požadavek**: Pro data pokrývající více než 6 měsíců musí být záznamy alespoň ze 6 různých měsíců
- **Důvod**: Zajištění reprezentativního vzorku pro sezónní variace
- **Aplikace**: Platí pouze pro roční nebo víceměsíční datové sady

### 4. **Maximum generovaných záznamů: 8 000**
- **Požadavek**: Interpolace nesmí vygenerovat více než 8 000 nových záznamů najednou
- **Důvod**: Ochrana před přetížením paměti a zamrznutím prohlížeče
- **Řešení**: Při překročení limitu je nutné nahrát více vstupních dat

### 5. **Zákaz pro víceleta data**
- **Požadavek**: Data nesmí obsahovat záznamy z více než jednoho roku
- **Důvod**: Interpolace přes roční hranice není energeticky smysluplná
- **Detekce**: Automatická kontrola při validaci

## Praktické příklady

### ✅ **Vyhovující scénáře**
1. **Týdenní měření**: 52 záznamů rovnoměrně rozložených přes rok (1 týdně)
2. **Denní vzorkování**: 365 záznamů, jeden každý den
3. **Částečné pokrytí**: 4 000 záznamů z 8 měsíců s maximální mezerou 5 dní

### ❌ **Nevyhovující scénáře**
1. **Příliš řídká data**: 20 záznamů za celý rok
2. **Velké mezery**: Data jen z ledna a prosince (11 měsíců mezera)
3. **Víceleta data**: Záznamy z let 2023 a 2024 současně
4. **Příliš malé pokrytí**: 500 záznamů z ročních dat (1,4% pokrytí)

## Chybové hlášky

Aplikace poskytuje specifické chybové hlášky pro každý typ problému:

### Nedostatečná hustota dat
```
Interpolace zamítnuta: Nedostatečná hustota dat. Máte X záznamů, 
potřebujete alespoň Y (10% pokrytí časového rozsahu Z dní). 
Pro kvalitní interpolace doporučujeme alespoň 1 záznam týdně.
```

### Příliš velká mezera
```
Interpolace zamítnuta: Příliš velká mezera mezi záznamy (X dní). 
Maximum je 7 dní pro kvalitní interpolaci. Doplňte více dat 
v období DD.MM.YYYY - DD.MM.YYYY.
```

### Nedostatečné pokrytí měsíců
```
Interpolace zamítnuta: Data pokrývají pouze X měsíců. 
Pro roční data je potřeba alespoň 6 měsíců s daty 
pro spolehlivou interpolaci.
```

### Příliš mnoho záznamů k vygenerování
```
Interpolace zamítnuta: Příliš mnoho záznamů k vygenerování (X). 
Maximum je 8 000. Nahrajte více vstupních dat pro zmenšení mezer.
```

## Doporučení pro uživatele

### Pro optimální výsledky:
1. **Pravidelné měření**: Snažte se o rovnoměrné rozložení záznamů
2. **Minimální frekvence**: Alespoň 1 záznam týdně
3. **Pokrytí roku**: Zahrňte data z celého roku, ne jen z části
4. **Kontrola mezer**: Vyhněte se mezerám delším než týden

### Při problémech:
1. **Doplňte data**: Přidejte více záznamů v problematických obdobích
2. **Rozdělte data**: Pro víceleta data použijte samostatné soubory pro každý rok
3. **Zkontrolujte kvalitu**: Ověřte, že časové značky jsou správné

## Technické poznámky

- Kontroly se provádějí před spuštěním interpolace
- Všechny limity jsou konfigurovatelné v kódu
- Interpolace používá lineární algoritmus mezi nejbližšími body
- Při chybějících krajních bodech se používá nejbližší dostupná hodnota
- Jako fallback se používá globální průměr ze všech platných hodnot