# Dadathlon Latvija — reģistrācijas forma

Next.js reģistrācijas vietne pasākumam **Dadathlon Latvija**, kas notiks **2026. gada 12. septembrī, 10:30–13:00, Pasta salā, Jelgavā**.

## Iekļautā funkcionalitāte

- ģimenes / komandas nosaukums;
- viena kopīga **1 km** distance tēviem un bērniem;
- tēva vārds, e-pasts un tālrunis;
- dinamiski pievienojami bērni;
- par katru bērnu tiek prasīts tikai vecums, nevis vārds;
- T-krekla izmērs tēvam un katram bērnam;
- izmēru tabulas izvietotas tieši blakus izmēra izvēlei;
- T-kreklu izmēru lauki tiek rādīti tikai pirmajām 150 reģistrētajām ģimenēm;
- pēc veiksmīgas iesniegšanas atveras atsevišķs **“Reģistrācija veiksmīga!”** logs;
- veiksmīgajā logā redzams pieteikuma kods, T-kreklu statuss un e-pasta nosūtīšanas statuss;
- uz tēva norādīto e-pastu automātiski tiek nosūtīts reģistrācijas apstiprinājums;
- apstiprinājuma e-pastā ir pasākuma informācija, 1 km skrējiens, pieteikuma kods un pieteikuma labošanas saite;
- pieteikumu iespējams labot vai atsaukt;
- Google Sheet automātiski saņem visus reģistrācijas datus;
- pārskatāma lapa **“Reģistrētās ģimenes”** — viena rinda katrai ģimenei;
- atsevišķa lapa **“Bērni”** — viena rinda katram bērnam, tikai vecums un T-krekla izmērs;
- tehniskā lapa `Registrations` tiek paslēpta, bet tajā glabājas pilnie sistēmas dati;
- trīs obligāti apstiprinājumi, tostarp informācija par fotografēšanu un filmēšanu;
- organizatoru, partnera un ES līdzfinansējuma logotipi un atruna;
- mobilajām ierīcēm pielāgots dizains Dadathlon krāsās.

## Ko redz ģimene pēc reģistrācijas

Pēc veiksmīgas reģistrācijas forma vairs nerāda tikai nelielu paziņojumu lapas augšā. Atveras atsevišķs modalais logs ar:

- tekstu **“Reģistrācija veiksmīga!”**;
- norādi, uz kuru e-pastu nosūtīts apstiprinājums;
- unikālo pieteikuma kodu;
- informāciju, vai ģimenei rezervēti T-krekli;
- atgādinājumu par medaļu skrējiena dalībniekiem;
- pogu pieteikuma labošanai.

Ja Google Apps Script saglabā pieteikumu, bet e-pasta nosūtīšana neizdodas, reģistrācija **netiek pazaudēta**. Veiksmīgajā logā tiek parādīts brīdinājums un pieteikuma kods.

## T-kreklu loģikas princips

T-kreklu vietas tiek piešķirtas **pirmajām 150 reģistrētajām ģimenēm**. Ja kāda no šīm ģimenēm vēlāk atsauc dalību, tās vieta automātiski netiek nodota nākamajai ģimenei. Tas saglabā formulējuma “pirmās 150 ģimenes, kas reģistrējas” precīzu nozīmi.

## 1. Vietnes palaišana lokāli

```bash
npm install
cp .env.example .env.local
npm run dev
```

Atveriet `http://localhost:3000`.

Šajā projekta versijā Google Apps Script Web App adrese jau ir pieslēgta. `NEXT_PUBLIC_APPS_SCRIPT_URL` ir arī saglabāts `.env.local` un `.env.example`, un kodā ir iestatīta tā pati adrese kā rezerves vērtība.

## 2. Google Sheet, reģistrāciju tabula un e-pasti

### A. Izveidojiet Google Sheet

1. Izveidojiet jaunu Google Sheet, piemēram, **Dadathlon Latvija — Reģistrācija**.
2. Atveriet **Extensions → Apps Script**.
3. Iekopējiet faila `apps-script/Code.gs` saturu.
4. `CONFIG.SITE_URL` jau ir iestatīts uz publisko Dadathlon Latvija vietni:

```javascript
SITE_URL: 'https://dadathlonlatvija.com'
```

### B. Sagatavojiet tabulas un atļaujas

Apps Script redaktorā funkciju sarakstā izvēlieties `setupDadathlon` un nospiediet **Run**.

Pirmajā reizē Google lūgs apstiprināt piekļuvi:

- Google Sheet datu ierakstīšanai;
- e-pastu nosūtīšanai ar `MailApp`.

Pēc palaišanas automātiski tiks izveidotas:

- **Reģistrētās ģimenes** — galvenā organizatoru tabula;
- **Bērni** — bērnu vecumu un T-kreklu izmēru saraksts;
- `Registrations` — tehniskā sistēmas lapa, kas tiek paslēpta.

### C. Publicējiet Apps Script kā Web App

1. Izvēlieties **Deploy → New deployment → Web app**.
2. Iestatiet:
   - **Execute as:** Me
   - **Who has access:** Anyone
3. Apstipriniet atļaujas un nokopējiet `/exec` adresi.
4. Vietnē izveidojiet `.env.local`:

```env
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwkXt6N5L1tXgkRgc_JBdna4yDw8v9zxrrfogfKDLUIggEQTqdy8JigMcvxYB8NW4PN/exec
```

5. Pārstartējiet vietni vai atkārtoti izvietojiet to Vercel.

## 3. Apstiprinājuma e-pasts

Pēc katras veiksmīgas reģistrācijas uz tēva norādīto e-pastu automātiski tiek nosūtīts e-pasts ar tēmu:

**Dadathlon Latvija – reģistrācija apstiprināta**

E-pastā ir:

- pasākuma datums, laiks un vieta;
- 11:45 iesildīšanās;
- 12:00 — 1 km skrējiens ar šķēršļiem;
- informācija par medaļu;
- ģimenes / komandas nosaukums;
- bērnu skaits;
- T-kreklu informācija, ja ģimene ir pirmajās 150;
- unikālais pieteikuma kods;
- saite pieteikuma labošanai vai atsaukšanai;
- reģistrācijas kontaktadrese.

E-pasts tiek nosūtīts no Google konta, kuram pieder Apps Script, bet **Reply-To** ir `latvijassportafederacijupadome@gmail.com`.

## 4. Excel fails

Tiešā reģistrācijas datubāze ir Google Sheet, jo to Apps Script var droši papildināt ar katru jaunu reģistrāciju. Jebkurā brīdī to var saglabāt Excel formātā:

**File → Download → Microsoft Excel (.xlsx)**

Projektam pievienots arī fails `Dadathlon_Registracijas_dati.xlsx`, kas parāda tādu pašu pārskatāmo datu struktūru.

## 5. Izvietošana Vercel

1. Augšupielādējiet projektu GitHub repozitorijā.
2. Vercel izvēlieties **Add New → Project**.
3. Pievienojiet vides mainīgo `NEXT_PUBLIC_APPS_SCRIPT_URL`.
4. Izvietojiet projektu.
5. `CONFIG.SITE_URL` Apps Script failā jau ir iestatīts uz `https://dadathlonlatvija.com`.
6. Apps Script izvēlieties **Deploy → Manage deployments → Edit → New version → Deploy**, lai jaunā vietnes adrese tiktu izmantota apstiprinājuma e-pastu labošanas/atsaukšanas saitēs.

## Pirms publiskas reģistrācijas atvēršanas

Ieteicams veikt vienu pilnu testa reģistrāciju ar savu e-pasta adresi un pārbaudīt:

- vai atveras veiksmīgas reģistrācijas logs;
- vai saņemat apstiprinājuma e-pastu;
- vai ieraksts parādās lapā **Reģistrētās ģimenes**;
- vai katrs bērns parādās lapā **Bērni**;
- vai pieteikuma labošanas saite atver pareizo ierakstu;
- vai T-kreklu vietas skaitītājs darbojas korekti.

## Galvenie faili

- `app/page.tsx` — reģistrācijas sākumlapa;
- `app/edit/page.tsx` — pieteikuma labošana;
- `components/RegistrationForm.tsx` — formas un veiksmīgā loga loģika;
- `components/SizeGuide.tsx` — izmēru tabulas;
- `components/Footer.tsx` — organizatoru, partneru un ES sadaļa;
- `app/globals.css` — dizains, tostarp veiksmīgā loga stili;
- `apps-script/Code.gs` — Google Sheet, e-pastu un reģistrācijas backend;
- `Dadathlon_Registracijas_dati.xlsx` — Excel struktūras paraugs;
- `public/` — logotipi.
