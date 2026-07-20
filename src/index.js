import people from "../data/people.json";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cardMatch = path.match(/^\/card\/([^/]+)\/?$/);
    if (cardMatch) {
      return handleCard(decodeURIComponent(cardMatch[1]), url);
    }

    const vcardMatch = path.match(/^\/vcard\/([^/]+)\/?$/);
    if (vcardMatch) {
      return handleVCard(decodeURIComponent(vcardMatch[1]));
    }

    // Everything else (/, /style.css, etc.) is served from the public/ folder
    return env.ASSETS.fetch(request);
  },
};

function handleCard(rawKey, url) {
  const key = rawKey.toLowerCase().trim();
  const person = people[key];

  if (!person) {
    return new Response(renderNotFound(key), {
      status: 404,
      headers: { "content-type": "text/html; charset=UTF-8" },
    });
  }

  const origin = `${url.protocol}//${url.host}`;
  return new Response(renderCard(person, key, origin), {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

function handleVCard(rawKey) {
  const key = rawKey.toLowerCase().trim();
  const person = people[key];

  if (!person) {
    return new Response("Card not found", { status: 404 });
  }

  return new Response(buildVCard(person), {
    headers: {
      "content-type": "text/vcard; charset=UTF-8",
      "content-disposition": `attachment; filename="${slug(person.name)}.vcf"`,
    },
  });
}

function renderCard(p, key, origin) {
  const accent = p.accent || "#2563eb";
  const vcardUrl = `${origin}/vcard/${key}`;
  const initials = p.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(p.name)} — Digital Business Card</title>
<meta name="theme-color" content="${accent}" />
<style>
  :root { --accent: ${accent}; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: linear-gradient(160deg, ${accent}15, #f4f5f7 60%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    background: #fff;
    border-radius: 20px;
    max-width: 380px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0,0,0,0.12);
    overflow: hidden;
  }
  .banner { height: 90px; background: var(--accent); }
  .avatar-wrap { display: flex; justify-content: center; margin-top: -55px; }
  .avatar {
    width: 110px; height: 110px; border-radius: 50%;
    border: 5px solid #fff; object-fit: cover;
    background: var(--accent); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; font-weight: 600;
  }
  .info { text-align: center; padding: 12px 24px 8px; }
  .info h1 { margin: 0; font-size: 22px; color: #111; }
  .info p { margin: 4px 0 0; color: #666; font-size: 15px; }
  .actions { padding: 20px 24px 28px; display: flex; flex-direction: column; gap: 10px; }
  .btn {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 16px; border-radius: 12px;
    text-decoration: none; font-size: 15px; font-weight: 500;
    border: 1px solid #e5e7eb; color: #111; background: #fafafa;
    transition: transform 0.05s ease;
  }
  .btn:active { transform: scale(0.98); }
  .btn.primary { background: var(--accent); color: #fff; border: none; }
  .btn .icon { width: 20px; text-align: center; }
</style>
</head>
<body>
<div class="card">
    <div class="banner" style="${
      p.logo
        ? `background-image:url('${escapeAttr(p.logo)}');background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#fff;`
        : ""
    }"></div>
    <div class="avatar-wrap">
      <div class="avatar">${escapeHtml(initials)}</div>
    </div>
    <div class="info">
      <h1>${escapeHtml(p.name)}</h1>
      <p>${escapeHtml(p.title || "")}${p.company ? " · " + escapeHtml(p.company) : ""}</p>
    </div>
    <div class="actions">
      <a class="btn primary" href="${vcardUrl}">
        <span class="icon">📇</span> Save to Contacts
      </a>
      ${p.phone ? `<a class="btn" href="tel:${escapeAttr(p.phone)}"><span class="icon">📞</span> ${escapeHtml(p.phone)}</a>` : ""}
      ${p.email ? `<a class="btn" href="mailto:${escapeAttr(p.email)}"><span class="icon">✉️</span> ${escapeHtml(p.email)}</a>` : ""}
      ${p.website ? `<a class="btn" href="${escapeAttr(p.website)}" target="_blank" rel="noopener"><span class="icon">🌐</span> Website</a>` : ""}
      ${p.linkedin ? `<a class="btn" href="${escapeAttr(p.linkedin)}" target="_blank" rel="noopener"><span class="icon">💼</span> LinkedIn</a>` : ""}
    </div>
  </div>
</body>
</html>`;
}

function renderNotFound(key) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Card not found</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f4f5f7;color:#333;text-align:center;padding:24px}</style>
</head><body><div><h1>No card found</h1><p>There's no business card set up for "<strong>${escapeHtml(
    key
  )}</strong>" yet. Check the URL or add this person to <code>data/people.json</code>.</p></div></body></html>`;
}

function buildVCard(p) {
  const [first, ...rest] = p.name.split(" ");
  const last = rest.join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${last};${first};;;`,
    `FN:${p.name}`,
    p.title ? `TITLE:${p.title}` : "",
    p.company ? `ORG:${p.company}` : "",
    p.phone ? `TEL;TYPE=CELL:${p.phone}` : "",
    p.email ? `EMAIL:${p.email}` : "",
    p.website ? `URL:${p.website}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(str = "") {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
