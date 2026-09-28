# Dia Konsult & Rekrytering – webbplats

Webbplats för Dia Konsult & Rekrytering AB, byggd från designen ”A · Skärpt original”.
Ren HTML, CSS och JavaScript utan byggsteg. Den hostas på Vercel.

Förhandsvisning (tillfällig tills sidan flyttas till kunden): https://dia.karimkhalil.se

## Innehåll

```
public/                   Allt som publiceras
  index.html              Startsidan
  integritetspolicy.html  Integritetspolicy (utkast)
  404.html
  assets/styles.css       All styling – färger och mått som CSS-variabler överst
  assets/main.js          Meny, stödkalkylator och kontaktformulär
  assets/fonts/           Anton och Archivo, självhostade (SIL Open Font License)
  og.png                  Bild som visas när länken delas (SMS, mejl, LinkedIn)
  favicon.svg, apple-touch-icon.png
api/kontakt.js            Tar emot kontaktformuläret (valfri, se nedan)
vercel.json               Vercel-inställningar och HTTP-headers
```

## Köra lokalt

```sh
npx serve public
```

Öppna http://localhost:3000. Kontaktformuläret faller då tillbaka på e-post eftersom
`/api` inte körs. Med `npx vercel dev` körs även funktionen.

## Publicera på Vercel

1. Gå till https://vercel.com/new och välj **Import Git Repository** → `D3v0ps/dia`.
2. Låt **Framework Preset** stå på **Other**. Inga andra inställningar behövs –
   `vercel.json` pekar ut mappen `public`.
3. Klicka **Deploy**. Därefter deployas varje push automatiskt. Produktion byggs från
   repots standardgren; övriga grenar får egna förhandsvisningslänkar.

## Koppla dia.karimkhalil.se

1. I Vercel: projektet → **Settings → Domains** → lägg till `dia.karimkhalil.se`.
2. Hos one.com (där DNS för karimkhalil.se ligger): **DNS-inställningar → DNS-poster →
   ny CNAME-post**
   - Värdnamn: `dia`
   - Pekar på: värdet Vercel visar för domänen (t.ex. `cname.vercel-dns.com`)
   - TTL: standard går bra
3. Vänta tills Vercel visar **Valid Configuration** (oftast några minuter).
   SSL-certifikatet skapas automatiskt.

## Kontaktformuläret

Utan inställningar öppnar formuläret besökarens e-postprogram med förfrågan ifylld till
info@diakonsult.se. För att skicka direkt från sidan: skapa ett konto på
https://resend.com, verifiera avsändardomänen och lägg in följande i Vercel under
**Settings → Environment Variables**. Deploya om efteråt.

| Variabel         | Exempel                               |
| ---------------- | ------------------------------------- |
| `RESEND_API_KEY` | `re_…`                                |
| `KONTAKT_TILL`   | `info@diakonsult.se`                  |
| `KONTAKT_FRAN`   | `Dia webbplats <webb@diakonsult.se>`  |

Formuläret har en dold honungsfälla mot spambottar.

## Exempelinnehåll som ska bytas ut

Sidan innehåller påhittat innehåll för att visa helheten i demon:

- **Kundlogotyperna** (Nordlager, Byggkraft, Södra Livs, Mälarfrakt, Kafé Linden) – påhittade företag.
- **Kundcitatet** (Maria Lindqvist, Nordlager AB) och **siffrorna** 60+ / 90 % / 30 dagar.
- **”Exempel”-etiketterna** (`data-demo` i `index.html`) tas bort när riktigt innehåll finns.
- **FAQ**: prismodellen (”fast pris per tillsatt tjänst”) och garantin under
  ”Vad händer om anställningen inte fungerar?” – bekräfta med Dia.
- **Formuläret**: ”Vi återkommer inom en arbetsdag”.
- **LinkedIn** i sidfoten pekar på en sökning – byt till företagssidans adress.
- **Integritetspolicyn** är ett utkast (t.ex. lagringstiden 12 månader) – ska granskas av Dia.

## Flytta till kundens domän

1. Lägg till kundens domän under **Settings → Domains** och ta bort `dia.karimkhalil.se`.
2. Byt `https://dia.karimkhalil.se/` i `og:url` och `og:image` i `public/index.html`.
3. `X-Robots-Tag: noindex` skickas bara på karimkhalil.se och `*.vercel.app`
   (se `vercel.json`), så kundens domän kan indexeras av Google utan ändringar.
4. Om kunden ska äga allt: överför Vercel-projektet (**Settings → General → Transfer**)
   och GitHub-repot.

## Stödberäkningen

Kalkylatorn räknar som designreferensen: stöd = min(lön, 20 000 kr) × arbetsgivaravgift
31,42 % × stödnivå (1, 2 eller 2,5). Konstanterna `AVGIFT` och `LONETAK` finns i
`public/assets/main.js`. Villkoren i FAQ:n är kontrollerade mot Arbetsförmedlingen i
september 2026 – kontrollera igen inför lansering eftersom reglerna ändras ibland.
