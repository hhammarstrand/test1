# VerkstadsPilot — verkstadssystem POC

En proof-of-concept för ett komplett hanteringssystem för en mekanisk verkstad
(svarv, CNC-fräs m.m.): hela flödet från inkommen order, via beredning och
planering av slottider i maskiner, till inköp och lager.

**Helt statisk app** — körs på GitHub Pages utan backend. All data lagras i
webbläsarens localStorage och seedas med ett svenskt demodataset. Knappen
"Återställ demodata" i sidomenyn nollställer allt.

## Moduler

| Modul | Innehåll |
|---|---|
| **Översikt** | KPI:er: öppna/försenade ordrar, beläggning, väntande inköp, lågt lagersaldo |
| **Ordrar** | Kundordrar med statusflöde Offert → Bekräftad → I produktion → Klar → Levererad, materialbehovskontroll |
| **Beläggning** | Gantt-vy per maskin med automatisk schemaläggning (finit kapacitet, EDD-prioritet), manuell flytt/maskinbyte, konflikt- och förseningsmarkering |
| **Artiklar** | Artikelregister med beredning (operationer: ställtid + stycktid per maskin) och material (BOM) |
| **Lager** | Materialsaldon, beställningspunkter, inkommande kvantiteter |
| **Inköp** | Inköpsordrar till leverantörer; mottagning räknar upp lagersaldot |
| **Maskiner / Kunder / Leverantörer** | Grundregister |

## Demoflöde att testa

1. Öppna **Översikt** — notera den försenade ordern och materialen under beställningspunkt.
2. Skapa en **ny order**, bekräfta den — vid materialbrist visas en varning med knappen
   "Skapa inköpsorder för brist".
3. **Mottag** inköpsordern under Inköp — lagersaldot räknas upp.
4. **Frisläpp ordern till produktion** — operationerna schemaläggs automatiskt i första
   lediga luckor (mån–fre, maskinens arbetstid) och visas i **Beläggning**.
5. Klicka på en stapel i Gantt-vyn — flytta den ±1 h/±1 dag eller byt maskin.
   Operationen låses och övriga schemaläggs om runt den.
6. Markera ordern som Klar → Levererad.

## Kom igång lokalt

```bash
npm install
npm run dev       # http://localhost:5173/test1/
npm run build     # typkontroll + produktionsbygge till dist/
```

## Deploy till GitHub Pages

Workflowen `.github/workflows/deploy.yml` bygger och deployar automatiskt vid
push till `main`.

**Engångsinställning:** gå till repots *Settings → Pages* och sätt
*Source = GitHub Actions*. Appen publiceras sedan på
`https://<användare>.github.io/test1/`.

Appen använder hash-routing (`#/planering` osv.) så inga 404-omskrivningar behövs.

## Teknik

React 18 + Vite + TypeScript · Zustand (state + localStorage-persistens) ·
react-router-dom (HashRouter) · egen Gantt-rendering i CSS · inga övriga beroenden.

Domänmodellen är inspirerad av Monitor ERP, ProShop, Fulcrum, Odoo MRP och ERPNext:
beredning per artikel (operationsnummer, maskintyp, ställtid, stycktid), framåtriktad
schemaläggning med finit kapacitet och prioritet på tidigaste leveransdatum (EDD).
