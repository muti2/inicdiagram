# Changelog

## [Verze 0.3.1] - 2025-05-23

### Přidáno
- **Inteligentní limity interpolace**: Implementovány optimální požadavky pro bezpečnou interpolaci
- **Automatická kontrola požadavků**: Kontrola se spouští při validaci a nahrání souborů
- **Vylepšené UI pro interpolaci**: Checkbox se automaticky zakáže pro nevyhovující data
- **Informativní chybové hlášky**: Specifické důvody zamítnutí interpolace
- **Dokumentace požadavků**: Nový soubor INTERPOLATION_REQUIREMENTS.md

### Změněno
- **Optimální limity**: Hustota dat zvýšena na 10%, časová mezera snížena na 7 dní
- **Konzistentní styling**: Hlášky pro interpolaci mají stejný styl jako ostatní omezení
- **Lepší UX**: Uživatel nemůže spustit problematickou interpolaci

### Opraveno
- **Prevence přetížení**: Ochrana před generováním příliš mnoha záznamů
- **TypeScript chyby**: Opraveny duplicitní deklarace proměnných

## [Verze 0.3.0] - 2025-05-21

### Přidáno
- Grafy pro vizualizaci dat (čárový, sloupcový, bodový)
- Filtrování časového rozsahu grafů (vše, měsíc, týden, den)
- Interaktivní prvky pro grafy (tooltip, zoom)
- Optimalizace zobrazení datumů na ose X
- Komplexní statistické ukazatele v panelu analýzy

### Opraveno
- Problém s kódováním českých znaků v grafech
- Chyba s nezobrazením grafů při určitých časových filtrech
- Vylepšená podpora pro velké datové sady

### Změněno
- Aktualizovaná dokumentace pro všechny moduly
- Rozšířené plány budoucího vývoje na základě zpětné vazby zákazníka

## [Verze 0.2.0] - 2025-05-20

### Přidáno
- Řádková editace dat v tabulce (tlačítka pro úpravu a smazání záznamu)
- Automatická kontrola dat z více let při validaci
- Blokování interpolace při detekci dat z více let
- Export dat ve formátech CSV, XLSX a JSON
- Detekce extrémních hodnot pomocí statistických metod

### Opraveno
- Problém s vykreslováním zbytečných znaků u volby interpolace
- Správné umístění tlačítek pro úpravu v tabulce dat

## [Verze 0.1.0] - 2025-05-18

### Přidáno
- Základní funkcionalita pro nahrávání souborů
- Podpora formátů CSV, XLS, XLSX, JSON, XML
- Validace chybějících záznamů a duplicitních časových značek
- Základní analýza dat (minimum, maximum, průměr, medián)
- Automatické opravy dat (interpolace, odstranění duplicit)