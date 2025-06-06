# Validátor iniciálních diagramů

Nástroj pro analýzu, validaci a opravu dat spotřeby energie vyvinutý pomocí React + TypeScript + Vite.

## Funkce

- **Nahrávání souborů**: Podpora CSV, XLSX, XLS, JSON, XML formátů
- **Validace dat**: Kontrola integrity, duplicit a chybějících záznamů  
- **Automatické opravy**: Interpolace, odstranění duplicit, oprava extrémních hodnot
- **Vizualizace**: Interaktivní grafy pro analýzu dat
- **Export**: Možnost exportu upravených dat
- **Dark Mode**: Kompletní tmavý režim s přepínačem v navigaci

## Dark Mode

Aplikace podporuje tmavý režim s následujícími funkcemi:
- **Přepínač v navigaci**: Ikony měsíce (🌙) a slunce (☀️) v pravém horním rohu
- **Persistentní nastavení**: Volba se ukládá do localStorage
- **Automatické načítání**: Obnovení posledního nastaveného režimu při spuštění
- **Kompletní pokrytí**: Všechny komponenty podporují tmavý režim

## Technologie

- **React 19** - Moderní React framework
- **TypeScript** - Typová bezpečnost
- **Vite** - Rychlý build nástroj a dev server
- **Tailwind CSS** - Utility-first CSS framework s dark mode podporou
- **Recharts** - Knihovna pro interaktivní grafy
- **PapaParse** - Parsování CSV souborů
- **SheetJS** - Práce s Excel soubory
- **ESLint** - Linting a kvalita kódu

## Instalace a spuštění

```bash
# Instalace závislostí
npm install

# Spuštění dev serveru
npm run dev

# Build pro produkci
npm run build

# Preview produkční build
npm run preview
```

## Struktura projektu

```
src/
├── components/          # React komponenty
│   ├── Navigation.tsx   # Hlavní navigace s dark mode přepínačem
│   ├── ConfirmDialog.tsx
│   ├── ChartsPanel.tsx  # Grafy a vizualizace
│   ├── ExportPanel.tsx  # Export funkcionalita
│   └── ...
├── utils/              # Utility funkce
│   ├── dataUtils.ts    # Zpracování dat
│   └── validateDataFile.ts
├── App.tsx             # Hlavní aplikace
└── main.tsx           # Entry point
```

## Vývoj

Aplikace využívá moderní React patterns:
- **TypeScript** pro typovou bezpečnost
- **Tailwind CSS** s class-based dark mode
- **Komponentová architektura** s jasným oddělením odpovědností
- **localStorage** pro persistentní nastavení
- **Responsive design** pro různé velikosti obrazovek
