export function doiEmail({ confirmUrl, brand, product }) {
  const subject = `Confirm your ${product} subscription`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:Georgia,serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0B1D33;border-radius:12px;padding:36px 32px;">
        <tr><td style="font-family:Georgia,serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#D4A843;">${escapeHtml(brand)}</td></tr>
        <tr><td style="padding-top:16px;font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#FFFFFF;">Confirm your subscription</td></tr>
        <tr><td style="padding-top:16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,.7);">One click confirms you want ${escapeHtml(product)}. We will not add you to the list until you confirm.</td></tr>
        <tr><td style="padding-top:28px;">
          <a href="${escapeAttr(confirmUrl)}" style="display:inline-block;background:#D4A843;color:#0B1D33;font-family:Arial,sans-serif;font-weight:700;font-size:15px;text-decoration:none;padding:12px 22px;border-radius:8px;">Confirm subscription</a>
        </td></tr>
        <tr><td style="padding-top:24px;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:rgba(255,255,255,.4);">If you did not request this, ignore this email. Foley Strategic Advisory does not buy, rent, or blast third-party lists.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, html };
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
