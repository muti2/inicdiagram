# Plán vývoje (Roadmap)

Tento dokument shrnuje plánovaný vývoj aplikace Validátor dat o energetické spotřebě napříč všemi moduly. Slouží jako centrální přehled budoucích vylepšení a nových funkcí.

## Krátkodobý plán (0-6 měsíců)

### Vylepšení uživatelského rozhraní
- Přidání drag and drop pro nahrávání souborů
- Vylepšení vizuální zpětné vazby během nahrávání velkých souborů
- Zvýraznění upravených řádků v tabulce dat
- Zobrazení náhledu oprav před jejich aplikací

### Optimalizace výkonu
- ✅ **Implementace limitu na počet generovaných záznamů při interpolaci** - Dokončeno v0.3.1
- Zlepšení výkonu při zpracování velkých datových sad
- Optimalizace zobrazení grafů pro velké datové sady

### Grafy a vizualizace
- Implementace teplotní mapy (heatmap) týdenní spotřeby
- Export grafů do PNG nebo PDF formátu
- Vylepšení zobrazení datumů u dlouhých časových řad

### Správa dat
- Podpora hromadné editace více řádků najednou
- Implementace funkce kopírování a vkládání záznamů
- Pokročilé možnosti filtrování (rozsahy hodnot, více kritérií)
- Automatické čištění dat od formátování při importu (CTRL+C/CTRL+V artefakty)

### Import/Export
- Přidání podpory pro ZIP soubory obsahující datové soubory
- Implementace exportu pouze vybraných řádků
- Možnost výběru sloupců při exportu

### Specifické funkce
- Úprava diagramu s ohledem na specifická data (víkendy, svátky)
- Funkce detekce a respektování závodní dovolené a odstávek
- Nástroje pro návrh oprav při nevalidních datech

## Střednědobý plán (6-12 měsíců)

### Pokročilá analýza a validace
- Pokročilá validace vzorců spotřeby (denní/týdenní/sezónní)
- Detekce a zvýraznění anomálií v datech
- Porovnávání hodnot s referenčními daty pro daný typ spotřeby
- Detailnější kontroly konzistence jednotek

### Pokročilé úpravy dat
- Možnost výběru algoritmu interpolace (lineární, kvadratická, spline)
- Vlastní pravidla pro opravu specifických typů dat
- Implementace historie změn a možnost návratu ke starší verzi (undo/redo)

### API a integrace
- Vytvoření API pro odesílání/předávání dat do externích systémů
- Podpora API promptů pro zadávání očekávané spotřeby
- Export do oceňovacích systémů a předávání časových řad

### Rozšířené grafy
- Možnost zobrazení agregovaných dat (denní, týdenní, měsíční sumy/průměry)
- Porovnávací režim pro různá období
- Vizualizace spojených/oddělených diagramů
- Filtrování v grafech s možností vyloučení víkendů, svátků a závodních dovolených

### Vylepšení importu
- Implementace průvodce mapováním sloupců pro nestandardní formáty souborů
- Pokročilý XML parser s podporou různých struktur a jmenných prostorů
- Možnost hromadného nahrávání více souborů najednou

## Dlouhodobý plán (12+ měsíců)

### AI a strojové učení
- Implementace algoritmů strojového učení pro inteligentnější opravy dat
- Automatická klasifikace typů spotřebních vzorců
- Jednoduchá predikce budoucí spotřeby
- AI modul pro předvyplnění diagramu na základě typu provozovny a celkového objemu
- Samoučící se algoritmy pro detekci anomálií adaptované na specifické vzorce spotřeby

### Cloudové funkce a sdílení
- Přímý export do cloudových úložišť (Google Drive, Dropbox, atd.)
- Možnost sdílení dat pomocí odkazu nebo QR kódu
- Automatizovaný export v nastavených intervalech
- Kolaborativní editace v reálném čase pro více uživatelů najednou

### Správa a archivace
- Systém pro historizaci exportovaných souborů s možností opětovného stažení
- Pokročilý systém uživatelských práv pro editaci dat
- Možnost zamykání řádků proti úpravám
- Dávkové zpracování pro velké soubory

### Komplexní operace s diagramy
- Vytvoření funkce pro přípravu jednoho diagramu podle druhého (vzorového)
- Možnost spojení dvou nebo více diagramů
- Funkce oddělení jednoho diagramu od druhého
- Porovnání vzoru diagramu s aktuálními daty
- **Generování nového diagramu na další rok**: Ze vstupních n souborů iniciálních diagramů vytvoř nový diagram na následující rok

## Aktuální stav implementace (verze 0.4.0)

### ✅ Dokončené funkce
- **Základní grafy**: Čárový, sloupcový a bodový graf s interaktivními prvky
- **Filtry grafů**: Časové rozsahy (vše, měsíc, týden, den)
- **Statistické ukazatele**: Minimum, průměr, maximum v grafech
- **Optimalizace zobrazení**: Kompaktní formát datumů, vzorkování dat
- **Kompletní validace**: Všechny typy kontrol včetně detekce více let
- **Řádková editace**: Inline editace s filtrováním a stránkováním
- **Export dat**: CSV, XLSX, JSON formáty s automatickými názvy
- **Bezpečné limity interpolace**: Implementovány inteligentní kontroly před interpolací
- **Dark Mode**: Kompletní tmavý režim s persistentním nastavením

### 🔄 Částečně implementované
- **XML parser**: Základní funkcionalita, potřebuje rozšíření

## Prioritní oblasti pro nadcházející verzi (0.5.0) - Autentifikace a uživatelé

1. **🔐 Autentifikační systém (NOVÁ PRIORITA)**
   - Firebase Authentication setup
   - Login/Register komponenty s Email/Google OAuth
   - Protected Routes pro zabezpečení aplikace
   - User Context a session management
   - Zapomenuté heslo a email verifikace

2. **👤 Uživatelská sekce**
   - User Profile s editací základních údajů
   - Avatar upload a správa profilového obrázku
   - User Menu v navigaci s quick actions
   - Uživatelská nastavení (dark mode, export formáty)
   - Statistiky použití (nahraných souborů, záznamů)

3. **📁 Správa dat a historie**
   - Historie nahraných souborů s metadaty
   - Uložené projekty a analýzy
   - Historie exportů s možností opětovného stažení
   - Cloud backup pomocí Firebase Storage

4. **🎨 UI/UX vylepšení pro multi-user**
   - Responzivní design auth komponent
   - Loading states a error handling
   - Seamless transition mezi přihlášeným/nepřihlášeným stavem
   - Dark mode integrace s user preferencemi

5. **🔒 Bezpečnost a privacy**
   - Firebase Security Rules pro data isolation
   - User-specific data storage
   - GDPR compliance příprava
   - Audit logging základů

## Následující prioritní oblasti (0.6.0)

1. **Rozšíření grafů**
   - Teplotní mapa týdenní spotřeby
   - Export grafů do PNG/PDF
   - Agregační pohledy (denní/týdenní/měsíční průměry)

2. **Pokročilé uživatelské funkce**
   - Team collaboration a shared projects
   - API key management pro external integrations
   - Advanced user statistics a analytics
   - Subscription management příprava

3. **Import/Export vylepšení**
   - Čištění dat od CTRL+C/CTRL+V artefaktů
   - API pro předávání dat do externích systémů
   - Export vybraných řádků nebo sloupců

4. **Drag and drop a UX**
   - Vylepšení zpětné vazby při nahrávání a zpracování velkých souborů
   - Drag and drop nahrávání
   - Zvýraznění upravených řádků