# Správa uživatelů a uživatelská sekce

## Popis
Kompletní systém pro správu uživatelských účtů, profilů a personalizaci aplikace. Zahrnuje autentifikaci, uživatelské profily, historii aktivit a pokročilé funkce.

## Hlavní komponenty

### Autentifikace
- **Firebase Authentication** - bezpečná správa uživatelů
- **Email/heslo registrace** - standardní přihlašování
- **Google OAuth** - rychlé přihlášení přes Google účet
- **Zapomenuté heslo** - reset hesla přes email
- **Email verifikace** - potvrzení emailové adresy

### Uživatelský profil
- **Základní informace** - jméno, email, datum registrace
- **Profilový obrázek** - upload a správa avataru
- **Nastavení aplikace** - dark mode, výchozí formáty exportu
- **Statistiky použití** - počet nahraných souborů, zpracovaných záznamů

### Historie a správa dat
- **Historie nahraných souborů** - seznam všech nahraných souborů s metadaty
- **Uložené projekty** - možnost uložit a znovu načíst analýzy
- **Historie exportů** - sledování všech exportovaných dat
- **Cloud backup** - automatické zálohování důležitých dat

## Implementované funkce

### Aktuální stav
- ❌ **Autentifikace** - zatím neimplementována
- ❌ **Uživatelské profily** - zatím neimplementovány
- ❌ **Historie souborů** - zatím neimplementována
- ✅ **Dark mode** - implementován s localStorage persistence

### Plánované funkce (verze 0.5.0)
- **Firebase Auth setup** - konfigurace autentifikačního systému
- **Login/Register komponenty** - přihlašovací formuláře
- **Protected Routes** - ochrana aplikace před nepřihlášenými uživateli
- **User Context** - globální stav uživatele
- **Basic User Profile** - základní informace a nastavení

## Datové struktury

### User Profile
```typescript
interface User {
  uid: string;                    // Firebase UID
  email: string;                  // Email adresa
  displayName?: string;           // Zobrazované jméno
  photoURL?: string;              // URL profilového obrázku
  emailVerified: boolean;         // Stav verifikace emailu
  createdAt: Date;               // Datum registrace
  lastLoginAt: Date;             // Poslední přihlášení
  settings: UserSettings;        // Uživatelská nastavení
}

interface UserSettings {
  darkMode: boolean;                              // Tmavý režim
  defaultExportFormat: 'csv' | 'xlsx' | 'json';  // Výchozí formát exportu
  autoSaveEnabled: boolean;                       // Automatické ukládání
  notificationsEnabled: boolean;                  // Povolit notifikace
  language: 'cs' | 'en';                         // Jazyk rozhraní
}
```

### File History
```typescript
interface FileUpload {
  id: string;                    // Jedinečný identifikátor
  userId: string;                // ID uživatele
  fileName: string;              // Název souboru v systému
  originalName: string;          // Původní název souboru
  uploadDate: Date;              // Datum nahrání
  fileSize: number;              // Velikost souboru v bytech
  fileType: string;              // Typ souboru (CSV, XLSX, etc.)
  processedRecords: number;      // Počet zpracovaných záznamů
  validationResults: ValidationSummary;  // Výsledky validace
  downloadURL?: string;          // URL pro stažení
  tags: string[];               // Uživatelské štítky
}

interface Project {
  id: string;                    // Jedinečný identifikátor
  userId: string;                // ID uživatele
  name: string;                  // Název projektu
  description?: string;          // Popis projektu
  createdAt: Date;              // Datum vytvoření
  updatedAt: Date;              // Datum poslední úpravy
  fileIds: string[];            // Seznam ID přiložených souborů
  analysisResults: any;         // Uložené výsledky analýzy
  isPublic: boolean;            // Veřejně sdílený projekt
}
```

## Komponenty

### Autentifikační komponenty
```typescript
// src/components/auth/
├── AuthContext.tsx           // React Context pro autentifikaci
├── LoginForm.tsx            // Přihlašovací formulář
├── RegisterForm.tsx         // Registrační formulář
├── ForgotPassword.tsx       // Formulář pro reset hesla
├── ProtectedRoute.tsx       // Ochrana routes
└── AuthGuard.tsx           // Wrapper pro autentifikaci
```

### Uživatelské komponenty
```typescript
// src/components/user/
├── UserProfile.tsx          // Zobrazení a editace profilu
├── UserSettings.tsx         // Nastavení účtu
├── UserMenu.tsx            // Dropdown menu v navigaci
├── AvatarUpload.tsx        // Nahrávání profilového obrázku
└── UserStatistics.tsx      // Statistiky použití
```

### Správa dat
```typescript
// src/components/data/
├── FileHistory.tsx          // Historie nahraných souborů
├── ProjectManager.tsx       // Správa uložených projektů
├── ExportHistory.tsx        // Historie exportů
└── DataBackup.tsx          // Backup a restore
```

## Uživatelské rozhraní

### Navigace s přihlášeným uživatelem
```
┌─────────────────────────────────────────────────────┐
│ 🏠 Inicdiagram          🌙  👤 John D.  ⚙️  🚪    │
└─────────────────────────────────────────────────────┘
```

### User Menu
```
👤 John Doe
john.doe@email.com
───────────────────
👤 Můj profil
📊 Statistiky  
📁 Historie souborů
💾 Uložené projekty
───────────────────
⚙️ Nastavení
🌙 Tmavý režim: ✓
🔔 Notifikace: ✓
───────────────────
🚪 Odhlásit se
```

### User Profile stránka
```
┌─ Můj profil ──────────────────────────┐
│                                       │
│  [👤]  John Doe                      │
│        john.doe@email.com             │
│        ✓ Email ověřen                 │
│                                       │
│  📝 Editovat profil                   │
│  📸 Změnit profilový obrázek          │
│                                       │
│  📊 Statistiky                        │
│  • Nahráno souborů: 47                │
│  • Zpracováno záznamů: 1,234,567      │
│  • Exportováno: 23 souborů            │
│  • Člen od: 15.1.2025                 │
│                                       │
└───────────────────────────────────────┘
```

## Bezpečnostní opatření

### Firebase Security Rules
- **User isolation** - každý uživatel vidí pouze svá data
- **Authenticated access** - přístup pouze pro přihlášené uživatele
- **Role-based permissions** - různé úrovně přístupu
- **Data validation** - kontrola integrity dat na server side

### Frontend security
- **Token validation** - kontrola platnosti auth tokenů
- **Route protection** - ochrana všech důležitých stránek
- **Input sanitization** - čištění uživatelských vstupů
- **XSS protection** - ochrana proti cross-site scripting

## Storage a persistence

### Firebase Firestore
```javascript
// Kolekce v databázi
users/           // Uživatelské profily
  {userId}/
    profile      // Základní info
    settings     // Nastavení
    
uploads/         // Historie nahraných souborů
  {uploadId}
  
projects/        // Uložené projekty
  {projectId}
  
exports/         // Historie exportů
  {exportId}
```

### Firebase Storage
```
files/
  {userId}/
    uploads/     // Nahraté soubory
    exports/     // Exportované soubory
    avatars/     // Profilové obrázky
```

## Integrace se stávající aplikací

### Postupná migrace
1. **Přidání auth wrapperu** - obalení stávající aplikace
2. **Migrace localStorage** - převod na user-specific storage
3. **Ochrana features** - postupné přidávání autentifikace
4. **Data migration** - přesun dat do cloud storage

### Zachování stávající funkcionality
- **Seamless transition** - uživatel nepozná rozdíl v core funkcích
- **Backward compatibility** - podpora pro stávající workflow
- **Progressive enhancement** - postupné přidávání nových funkcí

## Monitoring a analytics

### User behavior tracking
- **Login/logout events** - sledování autentifikačních aktivit
- **Feature usage** - které funkce uživatelé nejvíce používají
- **File upload patterns** - analýza nahrávání souborů
- **Export preferences** - oblíbené formáty exportu

### Performance metrics
- **Auth response times** - rychlost přihlášení
- **File upload speeds** - rychlost nahrávání
- **Page load times** - vliv autentifikace na výkon
- **Error rates** - sledování chyb a problémů

## Budoucí rozšíření

### Team collaboration (v0.6.0+)
- **Shared projects** - sdílení projektů mezi uživateli
- **Team workspaces** - týmové prostory
- **Permission management** - správa oprávnění
- **Real-time collaboration** - společná editace

### Premium features (v0.7.0+)
- **Advanced analytics** - pokročilé analýzy dat
- **API access** - programmatický přístup
- **Priority support** - přednostní podpora
- **Extended storage** - větší úložiště

### Enterprise features (v1.0.0+)
- **SSO integration** - Single Sign-On
- **Admin dashboard** - administrátorské rozhraní
- **Audit logging** - detailní logy aktivit
- **Custom branding** - přizpůsobení vzhledu

## Plán implementace

### Sprint 1 (týden 1)
- [x] Plánování a dokumentace
- [ ] Firebase projekt setup
- [ ] Auth Context implementace
- [ ] Základní Login/Register komponenty

### Sprint 2 (týden 2)
- [ ] Protected Routes
- [ ] User Profile komponenta
- [ ] User Menu v navigaci
- [ ] Avatar upload funkcionalita

### Sprint 3 (týden 3)
- [ ] File History komponenta
- [ ] Project Manager
- [ ] User Settings stránka
- [ ] Testing a bug fixing

### Sprint 4 (týden 4)
- [ ] UI/UX polishing
- [ ] Performance optimalizace
- [ ] Documentation update
- [ ] Production deployment