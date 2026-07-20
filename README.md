# NFC Digital Business Cards

One repo, one template, unlimited people. Each NFC tag opens a URL like:

```
https://yourdomain.workers.dev/card/john-doe
```

...and the same code renders a card personalized for "john-doe" using the
data in `data/people.json`.

## How it works

This deploys as a single **Cloudflare Worker with static assets** (the
current Cloudflare setup for git-connected projects — it runs `wrangler
deploy`, not `wrangler pages deploy`, which is why it needs the files below).

- `wrangler.jsonc` — tells Cloudflare where the Worker code lives (`src/index.js`)
  and where the static files live (`public/`, bound as `env.ASSETS`).
- `data/people.json` — one entry per person (name, title, phone, email, etc.)
- `src/index.js` — the whole Worker. It:
  - matches `/card/:name` and renders a styled card for that person
  - matches `/vcard/:name` and serves a downloadable `.vcf` contact file
  - passes everything else through to `env.ASSETS.fetch()`, which serves
    whatever's in `public/` (e.g. the homepage)
- `public/index.html` — plain landing page at the root domain.
- `package.json` — pins `wrangler` as a dev dependency so the build doesn't
  have to auto-install it.

You never touch the Worker code to add a new card — you just add a new
entry to the JSON file and push.

## Adding a new person

Edit `data/people.json` and add a new key (this key becomes the URL slug):

```json
"alex-lee": {
  "name": "Alex Lee",
  "title": "Sales Director",
  "company": "Acme Inc.",
  "phone": "+1 555 010 0102",
  "email": "alex@acme.com",
  "website": "https://acme.com",
  "linkedin": "https://linkedin.com/in/alexlee",
  "photo": "https://example.com/alex.jpg",
  "accent": "#16a34a"
}
```

Commit and push — Cloudflare redeploys automatically, and `/card/alex-lee`
goes live within a minute or two.

## Deploying on Cloudflare

1. Push this folder to a new GitHub repository (make sure `wrangler.jsonc`,
   `package.json`, `src/`, `data/`, and `public/` are all at the **repo
   root** — not nested inside a subfolder).
2. Cloudflare dashboard → **Workers & Pages → Create → Import a repository**,
   then pick the repo.
3. Leave the build command as the default (`npx wrangler deploy`) — no
   changes needed, since `wrangler.jsonc` now tells it exactly what to do.
4. Deploy. You'll get a `*.workers.dev` URL immediately; add a custom domain
   later under the Worker's **Settings → Domains & Routes** tab if you want.

### Testing locally (optional)

```bash
npm install
npm run dev
```

This starts a local server so you can open `http://localhost:8787/card/john-doe`
before pushing.

## Programming the NFC tags

Use a free app like **NFC Tools** (iOS/Android):

1. Write a "URL / URI" record.
2. Enter `https://yourdomain.workers.dev/card/<their-slug>` (or your custom
   domain) for each tag.
3. Tap the tag with the app to write it, then tap with any phone to test —
   it should open straight to that person's card.

Each tag just stores a URL, so all future edits (new photo, new phone
number, new title) only require editing `people.json` — no need to
reprogram the tags.
