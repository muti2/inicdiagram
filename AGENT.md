# Agent Guidelines for Vite-React-TS Project

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript and Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Summary
Validátor a editor dat o energetické spotřebě ve verzi 0.3.0. Aplikace umožňuje nahrávání, validaci, editaci, opravu a export dat z různých formátů souborů (CSV, XLS, XLSX, JSON, XML).

## Implementované funkce
- **Nahrávání souborů** - Podporované formáty: CSV, XLS, XLSX, JSON, XML
- **Validace dat** - Kontrola chybějících záznamů, duplicitních časových značek, extrémních hodnot
- **Řádková editace** - Možnost editovat a mazat individuální záznamy v tabulce
- **Automatické opravy** - Interpolace chybějících záznamů, odstranění duplicit, oprava extrémních hodnot
- **Detekce dat z více let** - Zákaz interpolace pro data z různých let
- **Export dat** - Možnost exportu dat do CSV, XLSX a JSON formátů
- **Analýza dat** - Základní statistické ukazatele o datech
- **Grafy** - Vizualizace dat (čárový, sloupcový, bodový graf) s filtry časového rozsahu
- **Interaktivní prvky** - Tooltip, zoom, statistické ukazatele v grafech
- **Inteligentní limity interpolace** - Automatická kontrola požadavků před interpolací

## Plánované funkce (verze 0.4.0)
- **Teplotní mapa** - Heatmap týdenní spotřeby
- **Export grafů** - Export do PNG/PDF formátu
- **Drag & drop** - Přetahování souborů pro nahrání
- **API integrace** - Předávání dat do externích systémů

## Dlouhodobé plánované funkce
- **Generování diagramu na další rok** - Ze vstupních n souborů iniciálních diagramů vytvoření nového diagramu na následující rok

## Bezpečnostní opatření
- **Inteligentní limity interpolace**: Implementovány kontroly minimální hustoty dat (5% pokrytí), maximálního počtu generovaných záznamů (10 000) a maximální časové mezery (14 dní)
- **Ochrana před přetížením**: Automatické zamítnutí problematických interpolací s informativními chybovými hláškami
- **Upozornění uživatele**: Varování při generování více než 1 000 záznamů

## Známé limitace
- XML parser podporuje pouze základní strukturu
- Lineární interpolace nemusí být vhodná pro všechny typy energetických dat

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, with explicit typing
- **Components**: Use React.FC<Props> for functional components with interfaces for props
- **Formatting**: Import statements at top, followed by interfaces, then component definition
- **Naming**: PascalCase for components, camelCase for functions and variables
- **Imports**: Group React imports first, then external libraries, then local imports
- **Error Handling**: Try/catch with specific error types, use console.log for debugging
- **State Management**: Use React useState/useEffect hooks
- **File Structure**: Components in src/components, utilities in src/utils
- **CSS**: TailwindCSS for styling

## Struktura projektu
- `/src/App.tsx` - Hlavní aplikační komponenta obsahující logiku
- `/src/components/` - React komponenty pro jednotlivé části aplikace
- `/src/utils/` - Pomocné funkce pro validaci a zpracování dat