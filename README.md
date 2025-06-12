# Validátor iniciálních diagramů

Nástroj pro analýzu, validaci a opravu dat spotřeby energie vyvinutý pomocí React + TypeScript + Vite.

## Funkce

- **Nahrávání souborů**: Podpora CSV, XLSX, XLS, JSON, XML formátů
- **Validace dat**: Kontrola integrity, duplicit a chybějících záznamů  
- **Automatické opravy**: Interpolace, odstranění duplicit, oprava extrémních hodnot
- **Vizualizace**: Interaktivní grafy pro analýzu dat
- **Export**: Možnost exportu upravených dat
- **Dark Mode**: Kompletní tmavý režim s přepínačem v navigaci
- **Authentication**: Firebase autentifikace s Email/Password a Google OAuth
- **User Management**: Uživatelské účty, profily a zabezpečené přístupy

## Autentifikace

Aplikace vyžaduje přihlášení pro přístup k funkcím:
- **Firebase Authentication**: Bezpečná správa uživatelských účtů
- **Email/Password**: Standardní registrace a přihlášení
- **Google OAuth**: Rychlé přihlášení přes Google účet
- **Zapomenuté heslo**: Reset hesla přes email
- **Protected Routes**: Aplikace přístupná pouze přihlášeným uživatelům

## Dark Mode

Aplikace podporuje tmavý režim s následujícími funkcemi:
- **Přepínač v user menu**: Toggle switch v rozbalovacím menu uživatele
- **Persistentní nastavení**: Volba se ukládá do localStorage
- **Automatické načítání**: Obnovení posledního nastaveného režimu při spuštění
- **Kompletní pokrytí**: Všechny komponenty podporují tmavý režim včetně auth stránek

## Technologie

- **React 19** - Moderní React framework
- **TypeScript** - Typová bezpečnost
- **Vite** - Rychlý build nástroj a dev server
- **Tailwind CSS** - Utility-first CSS framework s dark mode podporou
- **Recharts** - Knihovna pro interaktivní grafy
- **PapaParse** - Parsování CSV souborů
- **SheetJS** - Práce s Excel soubory
- **Firebase** - Authentication, Firestore, Storage
- **React Router** - Routing a protected routes
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
│   ├── auth/           # Autentifikační komponenty
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ProtectedRoute.tsx
│   ├── user/           # Uživatelské komponenty
│   │   └── UserMenu.tsx
│   ├── Navigation.tsx   # Hlavní navigace s user menu
│   ├── MainApp.tsx     # Hlavní aplikace (původní App)
│   ├── ChartsPanel.tsx  # Grafy a vizualizace
│   ├── ExportPanel.tsx  # Export funkcionalita
│   └── ...
├── contexts/           # React kontexty
│   └── AuthContext.tsx # Globální auth state
├── config/             # Konfigurace
│   └── firebase.ts     # Firebase setup
├── utils/              # Utility funkce
│   ├── dataUtils.ts    # Zpracování dat
│   └── validateDataFile.ts
├── AppRouter.tsx       # Routing setup
├── App.tsx             # Aplikační wrapper
└── main.tsx           # Entry point s providers
```

## Vývoj

Aplikace využívá moderní React patterns:
- **TypeScript** pro typovou bezpečnost
- **Tailwind CSS** s class-based dark mode
- **Komponentová architektura** s jasným oddělením odpovědností
- **localStorage** pro persistentní nastavení
- **Responsive design** pro různé velikosti obrazovek
