const DROP_MARKERS = [
  'CLAUDE_DROP_ZONE',
  'Issue #1 body is staged',
  'DROP THE BRIEF HTML HERE',
];

export function bodyLooksLikePlaceholder(html = '') {
  return DROP_MARKERS.some((marker) => html.includes(marker));
}

export function wrapIssue({ title, issueId, html, unsubUrl, publicBase, preheader = '' }) {
  const year = new Date().getUTCFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:Georgia,'Times New Roman',serif;color:#1A1A1A;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="background:#0B1D33;padding:28px 32px;border-radius:12px 12px 0 0;">
          <div style="font-family:Georgia,serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4A843;">Foley Strategic Advisory</div>
          <div style="margin-top:8px;font-family:Georgia,serif;font-size:26px;line-height:1.2;color:#FFFFFF;">Weekly Supply Chain Brief</div>
          <div style="margin-top:6px;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,.45);">Issue #${escapeHtml(String(Number(issueId) || issueId))}</div>
        </td></tr>
        <tr><td style="background:#FFFFFF;padding:32px;border:1px solid #E5E7EB;border-top:0;">
          ${html}
        </td></tr>
        <tr><td style="padding:20px 8px 8px;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6B7280;text-align:center;">
          You are receiving this because you confirmed a subscription to the Weekly Supply Chain Brief.<br>
          <a href="${escapeAttr(unsubUrl)}" style="color:#D4A843;">Unsubscribe</a>
          · <a href="${escapeAttr(publicBase)}" style="color:#D4A843;">foleystrategicadvisory.com</a><br>
          © ${year} Foley Strategic Advisory · Chicago, IL
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
