# Validace dat

## Popis
Modul pro kontrolu kvality a konzistence dat. Provádí sérii kontrol k odhalení problémů v datech jako jsou chybějící záznamy, duplicity nebo extrémní hodnoty.

## Klíčové funkce

### `validateData`
Hlavní funkce pro validaci dat, která spouští všechny kontroly a vrací souhrnnou zprávu.

### `validateDataFile`
Implementace v samostatném modulu (validateDataFile.ts), která se používá jako primární metoda validace. Obsahuje komplexnější kontroly.

## Kontrolované problémy

1. **Neplatné časové značky**
   - Záznamy s chybějícími nebo nevalidními časovými značkami
   - Detekuje formáty, které nelze převést na standardní datum

2. **Chybějící záznamy**
   - Kontrola očekávaného počtu záznamů v 15-minutových intervalech
   - Výpočet procenta chybějících záznamů v datové řadě

3. **Duplicitní časové značky**
   - Identifikace záznamů se stejným časovým razítkem
   - Počítání duplicit pro statistiku

4. **Extrémní hodnoty**
   - Detekce statistických odlehlých hodnot (outliers) pomocí směrodatné odchylky
   - Identifikace hodnot, které jsou více než 3 směrodatné odchylky od průměru

5. **Data z více let**
   - Kontrola, zda data obsahují záznamy z různých let
   - Zabránění interpolace pro data, která přesahují více let

## Současný stav
- Implementovány všechny výše uvedené kontroly
- Přehledná vizualizace výsledků validace
- Automatické blokování oprav pro data z více let
- Detailní statistiky pro informované rozhodování uživatele
- Robustní parsování různých formátů časových značek
- Validace struktury dat při nahrání souborů
- Integrace s automatickými opravami

## Výstup validace

Výsledek validace obsahuje:

- **valid**: Boolean indikující celkovou validitu dat
- **messages**: Pole textových zpráv popisujících nalezené problémy
- **stats**: Objekt obsahující statistiky jako:
  - totalRecords: Celkový počet záznamů
  - validTimestamps: Počet platných časových značek
  - expectedRecords: Očekávaný počet záznamů v časovém rozsahu
  - missingRecords: Počet chybějících záznamů
  - duplicateValues: Počet duplicitních časových značek
  - invalidValues: Počet extrémních hodnot
  - differentYears: Počet různých let v datech
  - years: Pole let obsažených v datech

## Závislosti
Validace využívá funkce pro detekci neplatných časových značek a formátování dat, které jsou sdíleny i s jinými částmi aplikace.

## Plán budoucího vývoje

### Krátkodobý plán
- Přidat detailnější kontroly konzistence jednotek
- Implementovat porovnávání hodnot s referenčními daty pro daný typ spotřeby
- Rozšířit vizualizaci problémů přímo v datové tabulce (zvýraznění problematických záznamů)
- Implementovat nástroje pro návrh oprav při nevalidních datech (přímo v rozhraní)
- Přidat pokyny pro uživatele o postupu při zjištění nevalidních dat

### Dlouhodobý plán
- Implementovat pokročilou validaci vzorců spotřeby (denní/týdenní/sezónní)
- Vyvinout automatickou klasifikaci typů spotřebních vzorců
- Přidat možnost definovat vlastní validační pravidla
- Implementovat samoučící se algoritmy pro detekci anomálií adaptované na specifické vzorce spotřeby
- Vytvořit AI prvky pro analýzu a validaci dat (např. model spotřeby strojírny vs. jiných typů podniků)
- Přidat kontrolu dat podle očekávané spotřeby zadané uživatelem (např. přes API prompty)