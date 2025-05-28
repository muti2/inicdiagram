# Nahrávání souborů

## Popis
Modul pro nahrávání a parsování datových souborů různých formátů. Zajišťuje načtení dat do aplikace a jejich základní strukturální validaci.

## Podporované formáty
- CSV (.csv)
- Excel (.xlsx, .xls)
- JSON (.json)
- XML (.xml)

## Klíčové funkce

### `handleFileUpload`
Zpracovává nahrání souboru, detekuje formát podle přípony a předává ho příslušnému parseru.

### `parseTimestamp`
Konvertuje různé formáty časových značek do ISO 8601 formátu. Podporuje:
- ISO 8601 řetězce
- Excel sériová čísla datumů
- Formátované řetězce (DD.MM.YYYY, YYYY-MM-DD, atd.)
- JavaScript Date objekty

## Implementační detaily

### CSV parsování
- Používá knihovnu PapaParse
- Podpora souborů s hlavičkou i bez hlavičky
- Automatická detekce sloupců s časovou značkou a hodnotou

### XLSX parsování
- Používá knihovnu SheetJS (xlsx)
- Podpora pro Excel sériová čísla datumů
- Automatická extrakce dat z prvního listu

### JSON parsování
- Očekává pole objektů s atributy timestamp/value nebo podobnými
- Flexibilní mapování atributů

### XML parsování
- Používá nativní DOMParser
- Hledá elementy <record> a jejich potomky pro data

## Současný stav
- Implementováno nahrávání a parsování všech podporovaných formátů
- Základní detekce struktury souboru
- Automatická validace po nahrání souboru
- Robustní parsování časových značek včetně Excel sériových čísel
- Error handling s detailními chybovými hláškami
- Podpora různých formátů CSV (s/bez hlavičky)
- Flexibilní mapování JSON atributů

## Omezení
- Maximální velikost souboru 50MB
- Při nevalidním nebo neznámém formátu je zobrazena chybová hláška
- XML parser je základní a může vyžadovat další rozšíření

## Plán budoucího vývoje

### Krátkodobý plán
- Přidat možnost přetahování souborů (drag and drop)
- Přidat podporu pro ZIP soubory obsahující datové soubory
- Zlepšit vizuální zpětnou vazbu během nahrávání velkých souborů
- Implementovat čištění dat od formátování při importu (odstranění CTRL+C/CTRL+V artefaktů)
- Přidat automatické ořezávání mezer a čištění formátování

### Dlouhodobý plán
- Implementovat pokročilý XML parser s podporou různých struktur a jmenných prostorů
- Přidat možnost hromadného nahrávání více souborů najednou
- Umožnit ukládání a znovu-načítání již upravených souborů
- Implementovat průvodce mapováním sloupců pro nestandardní formáty souborů
- Vytvořit API pro odesílání/předávání dat do externích systémů
- Implementovat rozšířené možnosti při validních souborech (více akcí s nahraným platným souborem)
- **Generování diagramu na další rok**: Funkce pro nahrání n souborů iniciálních diagramů a vytvoření nového diagramu na následující rok na základě analýzy vzorců spotřeby