# Dadathlon Jelgava 2026 — reģistrācijas forma

Gatava Next.js reģistrācijas vietne pasākumam **Dadathlon Jelgava 2026**, kas notiks **2026. gada 12. septembrī Pasta salā, Jelgavā**.

## Iekļautā funkcionalitāte

- ģimenes/komandas nosaukums;
- distances izvēle: 500 m, 1 km vai 2,5 km;
- tēva vārds, e-pasts un tālrunis;
- neierobežoti dinamiski pievienojami bērni;
- katra bērna vārds un vecums;
- T-krekla izmērs tēvam un katram bērnam;
- vīriešu un bērnu izmēru tabulas;
- T-kreklu izmēru lauki tiek rādīti tikai tikmēr, kamēr nav reģistrējušās pirmās 150 ģimenes;
- Google Sheet reģistrāciju datubāze;
- droša pirmo 150 vietu piešķiršana ar `LockService`, lai vienlaicīgi pieteikumi nesaņemtu vienu un to pašu vietu;
- apstiprinājuma e-pasts ar unikālu labošanas kodu;
- pieteikuma labošana un atsaukšana;
- pēc iesniegšanas vai labošanas lapa automātiski ritina uz augšu pie paziņojuma;
- mobilajām ierīcēm pielāgots dizains Dadathlon krāsās.

## Būtisks T-kreklu loģikas princips

T-kreklu vietas tiek piešķirtas **pirmajām 150 reģistrētajām ģimenēm**. Ja kāda no šīm ģimenēm vēlāk atsauc dalību, tās vieta automātiski netiek nodota nākamajai ģimenei. Tas saglabā formulējuma “pirmās 150 ģimenes, kas reģistrējas” precīzu nozīmi.

## 1. Vietnes palaišana lokāli

```bash
npm install
cp .env.example .env.local
npm run dev
```

Atveriet `http://localhost:3000`.

Kamēr `.env.local` nav pievienota īsta Google Apps Script adrese, forma darbojas priekšskatījuma režīmā un saglabā datus tikai pārlūka `localStorage`.

## 2. Google Sheet un Apps Script

1. Izveidojiet jaunu Google Sheet.
2. Atveriet **Extensions → Apps Script**.
3. Iekopējiet `apps-script/Code.gs` saturu.
4. Faila sākumā nomainiet:

```javascript
SITE_URL: 'https://YOUR-SITE.vercel.app'
```

uz īsto vietnes adresi.

5. Izvēlieties **Deploy → New deployment → Web app**.
6. Iestatiet:
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Apstipriniet atļaujas un nokopējiet `/exec` adresi.
8. Izveidojiet `.env.local`:

```env
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

9. Pārstartējiet vietni vai atkārtoti izvietojiet to Vercel.

Apps Script automātiski izveidos lapu `Registrations` ar vajadzīgajām kolonnām pirmajā reģistrācijas reizē.

## 3. Izvietošana Vercel

1. Augšupielādējiet projektu GitHub repozitorijā.
2. Vercel izvēlieties **Add New → Project**.
3. Pievienojiet vides mainīgo:
   - `NEXT_PUBLIC_APPS_SCRIPT_URL`
4. Izvietojiet projektu.
5. Pēc īstās Vercel adreses saņemšanas atjaunojiet `CONFIG.SITE_URL` Apps Script failā.
6. Apps Script izvēlieties **Deploy → Manage deployments → Edit → New version → Deploy**.

## 4. Pirms publicēšanas pārbaudāmais

- kontaktinformācija `components/Footer.tsx` un `apps-script/Code.gs`;
- personas datu apstrādes formulējums;
- pasākuma sākuma laiks, kad tas būs zināms;
- vai nepieciešams norādīt bērna uzvārdu, dzimšanas gadu vai īpašas vajadzības;
- apstiprinājuma e-pasta teksts;
- T-kreklu pieejamības pārbaude ar testa pieteikumiem.

## Galvenie faili

- `app/page.tsx` — reģistrācijas sākumlapa;
- `app/edit/page.tsx` — pieteikuma labošana;
- `components/RegistrationForm.tsx` — visa formas loģika;
- `app/globals.css` — dizains;
- `apps-script/Code.gs` — Google Sheet un e-pastu backend;
- `public/` — Dadathlon logo un izmēru tabulas.
