# Dadathlon Latvija — publicēšanas checklist

- [ ] Izveidots Google Sheet “Dadathlon Latvija — Reģistrācija”.
- [ ] `apps-script/Code.gs` ievietots Apps Script.
- [x] `CONFIG.SITE_URL` iestatīts uz `https://dadathlonlatvija.com`.
- [ ] Vienu reizi palaista funkcija `setupDadathlon()` un apstiprinātas Google atļaujas.
- [ ] Google Sheet redzamas lapas “Reģistrētās ģimenes” un “Bērni”.
- [x] Apps Script Web App `/exec` adrese ir saņemta un pievienota projektam.
- [ ] Apps Script pārpublicēts kā **New version** pēc `SITE_URL` atjauninājuma (Execute as Me / Anyone).
- [x] `/exec` adrese pievienota projektam kā `NEXT_PUBLIC_APPS_SCRIPT_URL` un rezerves endpoint vērtība.
- [ ] Vercel projekts pārpublicēts pēc vides mainīgā pievienošanas.
- [ ] Veikta testa reģistrācija.
- [ ] Pēc testa reģistrācijas atveras “Reģistrācija veiksmīga!” logs.
- [ ] Uz testa e-pastu pienāk apstiprinājuma e-pasts.
- [ ] E-pastā darbojas “Labot vai atsaukt pieteikumu” saite.
- [ ] Testa ģimene parādās lapā “Reģistrētās ģimenes”.
- [ ] Testa bērni parādās lapā “Bērni”.
- [ ] Pārbaudīts, ka pirmajām 150 ģimenēm tiek prasīti T-kreklu izmēri.
- [ ] Pārbaudīts mobilais skats.
