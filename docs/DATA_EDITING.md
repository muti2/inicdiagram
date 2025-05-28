# Editace dat

## Popis
Modul umožňující úpravu jednotlivých záznamů v tabulce dat. Poskytuje rozhraní pro ruční korekce a mazání záznamů.

## Funkce

### Editace řádků
Umožňuje uživateli upravit hodnoty jednotlivých polí v záznamu:
- Časová značka
- Hodnota
- Jednotka

### Mazání řádků
Umožňuje odstranit konkrétní záznamy z datové sady.

## Současný stav
- Implementována úplná podpora pro editaci jednotlivých záznamů
- Tlačítka pro úpravu a mazání přímo v tabulce
- Inline editace pro zachování kontextu dat
- Potvrzení před odstraněním záznamu pomocí ConfirmDialog
- Validace upravených záznamů s kontrolou formátu časových značek
- Automatické označení změněných dat pro export
- Robustní error handling při editaci

## Klíčové komponenty

### Tabulka dat
Zobrazuje data s možností filtrování a stránkování:
- ID záznamu
- Formátovaná časová značka
- Hodnota (s indikací chybějících hodnot)
- Jednotka
- Akce (tlačítka pro úpravu a mazání)

### Editační formulář
Vkládá se přímo do řádku tabulky při editaci:
- Vstupní pole pro časovou značku
- Vstupní pole pro hodnotu (numerické)
- Vstupní pole pro jednotku
- Tlačítka pro uložení a zrušení změn

## Klíčové funkce

### `handleEditClick`
Přepíná řádek do režimu editace a připravuje formulářová data.

### `handleEditFormChange`
Spravuje změny hodnot ve vstupních polích formuláře.

### `handleEditFormSubmit`
Zpracovává potvrzení formuláře a aktualizuje data.
Zajišťuje:
- Validaci formátu časové značky
- Převod na správné datové typy
- Aktualizaci stavu aplikace

### `handleCancelClick`
Zruší editaci bez uložení změn.

### `handleDeleteClick`
Odstraní záznam po potvrzení dialogem.

## Filtrování a stránkování

### Filtry
- Filtrování podle měsíce
- Filtrování podle dne
- Fulltextové vyhledávání v hodnotách a časových značkách

### Stránkování
- Nastavitelný počet řádků na stránku (10, 25, 50, 100, 500)
- Navigační tlačítka (první, předchozí, další, poslední stránka)
- Informace o zobrazeném rozsahu záznamů

## Plán budoucího vývoje

### Krátkodobý plán
- Přidat možnost hromadné editace více řádků najednou
- Implementovat funkci kopírování a vkládání záznamů
- Rozšířit filtrování o pokročilé možnosti (rozsahy hodnot, více kritérií)
- Zvýraznit řádky, které byly upraveny
- Přidat možnost editace s ohledem na konkrétní data (víkendy, svátky)
- Implementovat funkci detekce a označení závodní dovolené

### Dlouhodobý plán
- Implementovat historii změn a možnost vrátit se ke starší verzi dat (undo/redo)
- Přidat možnost zamykání řádků proti úpravám
- Vyvinout pokročilý systém uživatelských práv pro editaci dat
- Implementovat kolaborativní editaci v reálném čase pro více uživatelů najednou
- Vytvořit AI modul pro předvyplnění diagramu na základě typu provozovny a celkového objemu
- Přidat podrobnější zanoření komponentů a práci s nimi
- Implementovat prompty pro očekávanou spotřebu v různých obdobích