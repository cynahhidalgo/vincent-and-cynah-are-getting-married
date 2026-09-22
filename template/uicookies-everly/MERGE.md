# UICookies Everly — merge notes (Vincent & Cynah)

Your wedding content lives in **`js/config.js`**. The live site is **`index.html`** (welcome) and **`invitation.html`** (full invitation).

## Download the official template

1. Open your verification link in a browser (UICookies Everly download page).
2. Save the ZIP as **`everly.zip`** in the project root (replace the file if download failed before).
3. Extract to **`_everly_tpl/`** (sibling to `invitation.html`).

```text
Cynah/
  everly.zip
  _everly_tpl/          ← official HTML/CSS/JS after unzip
  invitation.html       ← your merged site
  css/everly.css
  css/everly-uicookies.css
  js/config.js
  js/main.js
```

## What we merged from Everly (without replacing your copy)

| Everly feature | Where it lives now |
|----------------|-------------------|
| Skip link | `invitation.html` + `css/everly-uicookies.css` |
| Header “days to go” chip | `#header-days` + `js/main.js` |
| Scroll-spy nav | `js/main.js` → `.header-nav a.is-active` |
| Ceremony / reception SVG icons | `js/main.js` → `detailIconSvg()` |
| Botanical palette tokens | `css/everly-uicookies.css` |
| Section dividers | `css/everly-uicookies.css` |

## Intentionally different (your customizations kept)

- **Welcome landing** on `index.html`; full site on `invitation.html`.
- **Our Story** as slideshow (with YouTube proposal), not Everly’s alternating timeline rail.
- **Sponsors**, **Little Glimpses**, **where to stay**, and all names/dates from `config.js`.
- **Elegant scroll reveals** (word + blur lift) instead of Everly-only reveals on every block.

## Optional: pull more from `_everly_tpl/`

After you extract the ZIP, compare:

- `_everly_tpl/index.html` — registry block, wedding party grid, Bootstrap markup
- `_everly_tpl/css/style.css` — any spacing or component you want copied into `everly.css`

Do **not** overwrite `config.js` or your `images/` folder.

## Preview locally

```bash
python -m http.server 8080
```

Open `http://localhost:8080/` → **Open invitation**.
