# Plán implementace grafů

## Přehled
Tento dokument obsahuje plán pro implementaci sekce grafů v aplikaci Validátor dat o energetické spotřebě.

## Aktuální stav implementace

### ✅ Hotové funkce (verze 0.3.0)
- Základní typy grafů (čárový, sloupcový, bodový)
- Filtry časového rozsahu (vše, měsíc, týden, den)
- Interaktivní prvky (tooltip, posuvník pro zoom)
- Statistické ukazatele (minimum, průměr, maximum)
- Optimalizace zobrazení pro velké datové sady
- Kompaktní zobrazení datumů na ose X
- Vzorkování dat pro lepší výkon při velkém počtu záznamů
- Responzivní design s ResponsiveContainer
- Referenční čáry pro průměrné hodnoty

### Plánované funkce pro další vývoj
- Export grafů do PNG nebo PDF formátu
- Možnost zobrazení agregovaných dat (denní, týdenní, měsíční sumy/průměry)
- Teplotní mapa spotřeby během dne a týdne
- Porovnávací režim pro různá období
- Detekce a zvýraznění anomálií v datech
- Jednoduchá predikce budoucí spotřeby
- Filtrování dat s možností vyloučení víkendů, svátků a závodních dovolených
- Podpora API promptů pro zadávání očekávané spotřeby a časových období
- Vizualizace spojených/oddělených diagramů
- Možnost porovnání vzoru diagramu s aktuálními daty

## Vybraná knihovna
Pro implementaci grafů jsme použili knihovnu **Recharts**, která nabízí:
- Jednoduché API pro React komponenty
- Responzivní grafy s podporou pro různé obrazovky
- Dobrý výkon i pro větší množství dat
- Podpora pro interaktivitu (tooltips, zoom, atd.)

Instalace: `npm install recharts`

## Typy grafů k implementaci

### 1. Čárový graf spotřeby v čase (IMPLEMENTOVÁNO)
- Osa X: Časová značka s možností filtrace období
- Osa Y: Hodnota spotřeby
- Vlastnosti: zoom pomocí posuvníku, tooltips s detaily, referenční čára průměru

### 2. Sloupcový graf (IMPLEMENTOVÁNO)
- Osa X: Časové období 
- Osa Y: Hodnota spotřeby
- Vlastnosti: filtrace obdobím, tooltips s detaily

### 3. Bodový graf (IMPLEMENTOVÁNO)
- Vizualizace jednotlivých bodů měření
- Užitečný pro identifikaci odlehlých hodnot

### 4. Teplotní mapa (heatmap) týdenní spotřeby (PLÁNOVÁNO)
- Osa X: Hodiny během dne (0-23)
- Osa Y: Dny v týdnu (Pondělí-Neděle)
- Hodnota: Průměrná spotřeba v dané hodině a dni
- Zobrazení: Barevná škála od nízké po vysokou spotřebu

### 5. Agregační grafy (PLÁNOVÁNO)
- Zobrazení denních, týdenních, měsíčních součtů/průměrů
- Srovnávací grafy mezi obdobími

## Pokročilé funkce k implementaci

### Export grafů
- Export do PNG formátu pomocí html2canvas nebo podobné knihovny
- Možnost exportu dat grafu do CSV/Excel
- Tisk grafu

### Predikce a analýza
- Detekce pravidelných vzorců spotřeby
- Jednoduché předpovědi budoucí spotřeby
- Zvýraznění anomálií a odchylek od běžného vzorce

## Optimalizace výkonu
- Vzorkování dat pro lepší výkon při velkém počtu záznamů
- Memoizace výpočtů pro optimalizaci překreslování
- Lazy loading komponent

## Uživatelské rozhraní
- Konzistentní barevné schéma pro všechny grafy
- Přehledné a intuitivní ovládací prvky
- Responzivní design pro mobilní zařízení