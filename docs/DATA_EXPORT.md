# Export dat

## Popis
Modul pro export upravených nebo validovaných dat do různých formátů. Umožňuje uživatelům uložit výsledky své práce pro použití v jiných aplikacích.

## Podporované formáty exportu

### CSV (Comma-Separated Values)
- Základní textový formát oddělený čárkami
- Vhodný pro import do jiných nástrojů (Excel, SQL, atd.)
- Implementace využívá knihovnu PapaParse

### JSON (JavaScript Object Notation)
- Strukturovaný formát v čitelné textové podobě
- Vhodný pro webové API a další zpracování v JavaScriptu
- Implementace využívá nativní JSON.stringify

### XLSX (Excel Workbook)
- Binární formát pro Microsoft Excel
- Zachovává formátování a strukturální informace
- Implementace využívá knihovnu SheetJS (xlsx)

## Současný stav
- Implementován export do všech výše uvedených formátů
- Export z různých míst aplikace (záložka Export i přímo z datové tabulky)
- Automatické generování názvů souborů s aktuálním datem
- Vizualizace procesu exportu s indikací průběhu a výsledku
- Robustní error handling s detailními chybovými hláškami
- Validace dat před exportem

## Umístění exportu v aplikaci

### Záložka Export
Samostatná záložka s kompletními možnostmi exportu:
- Výběr formátu
- Pojmenování souboru
- Další možnosti exportu

### Záložka Data
Rychlý export přímo ze sekce dat:
- Zobrazuje se pouze po úpravě dat
- Omezené možnosti konfigurace
- Praktické pro rychlý export po úpravách

## Klíčové funkce

### `handleExportFromDataTab`
Zpracovává export z datové záložky:
- Exportuje aktuální datovou sadu
- Formátuje výstup podle vybraného formátu
- Vytváří název souboru s aktuálním datem

### Export komponenta
Komplexnější exportní nástroj v záložce Export:
- Více možností konfigurace
- Možnost exportu části dat

## Implementační detaily

### CSV Export
```javascript
exportData = Papa.unparse(data);
fileType = 'text/csv;charset=utf-8;';
```

### JSON Export
```javascript
exportData = JSON.stringify(data, null, 2);
fileType = 'application/json;charset=utf-8;';
```

### XLSX Export
```javascript
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
exportData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;';
```

## Generátor jména souboru
Vytváří standardizované jméno souboru s datem:
```javascript
filename = `export_data_${new Date().toISOString().slice(0, 10)}.${format}`;
```

## Plán budoucího vývoje

### Krátkodobý plán
- Přidat možnost exportu pouze vybraných řádků
- Implementovat export do dalších formátů (PDF, XML)
- Přidat možnost výběru, které sloupce exportovat
- Umožnit použití vlastních šablon pro export
- Přidat export grafů do PNG nebo PDF formátu
- Implementovat možnost exportu dat přes API do jiných systémů

### Dlouhodobý plán
- Implementovat přímý export do cloudových úložišť (Google Drive, Dropbox, atd.)
- Vytvořit možnost sdílení dat pomocí odkazu nebo QR kódu
- Implementovat automatizovaný export v nastavených intervalech
- Vytvořit systém pro historizaci exportovaných souborů s možností opětovného stažení
- Podporovat export do oceňovacích systémů a předávání připravených časových řad