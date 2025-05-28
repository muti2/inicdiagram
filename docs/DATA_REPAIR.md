# Automatické opravy dat

## Popis
Modul pro automatickou opravu běžných problémů v datových sadách. Umožňuje uživateli opravit chybějící záznamy, odstranit duplicity a korigovat extrémní hodnoty.

## Funkce

### Oprava chybějících záznamů (interpolace)
Doplní chybějící záznamy v 15-minutových intervalech:
- Lineární interpolace mezi nejbližšími platnými hodnotami
- Pokud nejsou dostupné oba krajní body, použije nejbližší dostupnou hodnotu
- V případě absence relevantních hodnot použije globální průměr

**Omezení**: Neprovede se pro data obsahující záznamy z více než jednoho roku.

### Odstranění duplicitních časových značek
Odstraní záznamy se stejnou časovou značkou:
- Zachová první výskyt časové značky
- Odstraňuje všechny následné duplicity

### Oprava extrémních hodnot
Identifikuje a opravuje statistické odlehlé hodnoty:
- Detekuje hodnoty mimo rozsah 3 směrodatných odchylek od průměru
- Nahrazuje extrémní hodnoty průměrem z datové sady

## Současný stav
- Implementovány všechny výše uvedené opravy
- Automatická detekce a zákaz interpolace pro data z více let
- Interaktivní rozhraní pro výběr typů oprav
- Podrobné statistiky o provedených opravách
- Robustní error handling s try/catch bloky
- Validace dat před a po opravách

## Klíčová funkce

### `applyRepairs`
Provede vybrané opravy dat podle nastavených voleb:
1. Odstraní duplicity (časová značka + hodnota)
2. Opraví extrémní hodnoty
3. Doplní chybějící záznamy

Logika funkce:
- Pro každou opravu existuje samostatný algoritmus
- Opravy se aplikují v předurčeném pořadí
- Opravy generují statistické údaje o počtu upravených záznamů

## Uživatelské rozhraní

### Nastavení oprav
Uživatel může vybrat kombinaci různých oprav:
- Zaškrtávací políčko pro doplnění chybějících záznamů
- Zaškrtávací políčko pro odstranění duplicit
- Zaškrtávací políčko pro opravu extrémních hodnot

### Výsledky oprav
Zobrazuje report o provedených opravách:
- Počet doplněných záznamů
- Počet odstraněných duplicit
- Počet opravených extrémních hodnot

## Bezpečnostní limity interpolace

Aplikace nyní implementuje inteligentní limity pro zabránění problematické interpolaci:

### 1. **Minimální hustota dat**
- **Požadavek**: Alespoň 5% pokrytí časového rozsahu
- **Příklad**: Pro roční data (35 040 záznamů) je potřeba minimálně 1 752 záznamů
- **Důvod**: Zajištění smysluplné interpolace s dostatečným množstvím referenčních bodů

### 2. **Maximum generovaných záznamů**
- **Limit**: Maximálně 10 000 nových záznamů na jednu interpolaci
- **Důvod**: Ochrana před přetížením paměti a zamrznutím prohlížeče

### 3. **Maximální časová mezera**
- **Limit**: Maximálně 14 dní mezi po sobě jdoucími záznamy
- **Důvod**: Interpolace přes příliš dlouhé období není spolehlivá pro energetická data

### 4. **Upozornění při velkých interpolacích**
- **Práh**: Varování při generování více než 1 000 záznamů
- **Účel**: Informování uživatele o potenciálně dlouhém zpracování

## Známé limitace

1. **Víceleta data**:
   - Aplikace dokáže detekovat data z více let a zabránit jejich interpolaci
   - Kontrola probíhá jak při nahrání souboru, tak při opětovné validaci

2. **Kvalita interpolace**:
   - Lineární interpolace nemusí být vhodná pro všechny typy energetických dat
   - Nezohledňuje sezónní vzorce nebo specifické provozní režimy

## Plán budoucího vývoje

### Krátkodobý plán
- Implementovat limit na počet generovaných záznamů při interpolaci
- Přidat možnost výběru algoritmu interpolace (lineární, kvadratická, spline)
- Zobrazit preview oprav před jejich aplikací
- Zlepšit výkon při zpracování velkých datových sad
- Přidat možnost úpravy diagramu s ohledem na specifické datum (např. vynechání víkendů, svátků)
- Doplnit funkci detekce a respektování závodní dovolené či odstávek

### Dlouhodobý plán
- Implementovat algoritmy strojového učení pro inteligentnější opravy dat
- Vytvořit dávkové zpracování pro velké soubory
- Přidat možnost vlastních pravidel pro opravu specifických typů dat
- Implementovat undo/redo funkcionality pro opravy
- Vytvořit funkci pro přípravu jednoho diagramu podle druhého (vzorového)
- Přidat možnost spojení dvou nebo více diagramů
- Implementovat funkci oddělení jednoho diagramu od druhého