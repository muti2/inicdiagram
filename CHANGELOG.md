# Changelog

## [Verze 0.5.0] - 2025-06-10 ✅ DOKONČENO
### Přidáno
- **Firebase Authentication**: Kompletní autentifikační systém s Email/Password a Google OAuth
- **Uživatelské účty**: Registrace, přihlášení, zapomenuté heslo
- **Protected Routes**: Zabezpečení aplikace pouze pro přihlášené uživatele
- **User Context**: Globální správa uživatelského stavu s React Context
- **UserMenu**: Dropdown menu s profilem, nastavením a odhlášením
- **React Router**: Kompletní routing s chráněnými routes
- **Auth komponenty**: LoginForm, RegisterForm, ForgotPassword komponenty
- **Firebase konfigurace**: Production-ready setup s inicdiagram projektem

### Změněno
- **Architektura aplikace**: Přechod na multi-user architekturu s autentifikací
- **Navigace**: Přidání user menu a auth tlačítek (Přihlásit/Registrace)
- **Dark mode**: Přesunut do UserMenu místo samostatného tlačítka
- **Aplikační flow**: Nepřihlášení uživatelé vidí pouze auth stránky
- **Main App**: Refaktorováno do komponenty s router wrapping

### Opraveno
- **UserMenu positioning**: Použití React Portal pro správné zobrazení
- **Dark mode toggle**: Funkční přepínač v user menu
- **Firebase emulators**: Vypnuty pro production použití
- **Menu animace**: Odstraněny všechny animace pro okamžité zobrazení
- **Blikání menu**: Eliminováno problikávání při prvním otevření

### Bezpečnost
- **Protected Routes**: Aplikace přístupná pouze pro autentifikované uživatele
- **Firebase Auth**: Bezpečná správa uživatelských účtů
- **Token validation**: Automatické ověřování auth tokenů
- **Route protection**: Redirect na login pro neautentifikované uživatele

### Technické detaily
- **React Router 7.6.2**: Moderní routing s protected routes
- **Firebase Auth 10.x**: Nejnovější verze s emulator support
- **TypeScript**: Plná typová bezpečnost pro auth komponenty
- **Tailwind CSS**: Responzivní design pro všechny auth komponenty

## [Verze 0.4.0] - 2025-06-05

### Přidáno
- **Dark Mode**: Implementován kompletní tmavý režim pro celou aplikaci
- **Přepínač tema**: Přepínač mezi světlým a tmavým režimem v pravém horním rohu navigace
- **Persistentní nastavení**: Dark mode se ukládá do localStorage a zachovává se mezi relacemi
- **Responzivní ikony**: Ikony měsíce (🌙) a slunce (☀️) pro intuitivní přepínání režimů
- **Komplexní styly**: Dark mode styly pro všechny komponenty včetně dialogů, karet a formulářů

### Změněno
- **Navigation komponenta**: Refaktorována do samostatné komponenty s podporou dark mode
- **Tailwind konfigurace**: Přidána podpora class-based dark mode
- **Konzistentní barvy**: Aktualizovány všechny barvy pro optimální kontrast v obou režimech
- **Vylepšené UI**: Smooth přechody a hover efekty pro lepší uživatelskou zkušenost

### Opraveno
- **Kontrastní barvy**: Změna amber/žluté barvy na oranžovou pro lepší čitelnost v dark mode
- **Dialog komponenty**: ConfirmDialog a všechny modální okna mají dark mode podporu
- **Formulářové prvky**: Input pole, checkboxy a tlačítka s dark mode styly
- **Datová tabulka**: Kompletní dark mode včetně hlavičky, řádků a paginace
- **Statistické karty**: Všechny karty v sekcích Analýza a Validace
- **Grafy a vizualizace**: Tooltips, legenda a ovládací prvky grafů
- **Export komponenta**: Radio buttony a všechny interaktivní prvky

### Technické detaily
- Implementace pomocí Tailwind CSS class-based dark mode
- Automatické načítání uložených preferencí při spuštění aplikace
- Dynamické přepínání CSS tříd na document.documentElement
- Zachování funkcionality všech existujících komponent
- Optimalizace barev pro přístupnost a čitelnost

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