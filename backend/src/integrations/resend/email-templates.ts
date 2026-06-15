export function notificationEmailHtml(params: {
  name: string;
  title: string;
  body: string;
  link?: string;
}): string {
  const cta = params.link
    ? `<p style="margin:24px 0 0"><a href="${params.link}" style="background:#c8102e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Abrir no portal</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <p>Olá, ${escapeHtml(params.name)},</p>
  <h2 style="margin:16px 0 8px;font-size:18px">${escapeHtml(params.title)}</h2>
  <p style="margin:0;color:#444">${escapeHtml(params.body)}</p>
  ${cta}
  <hr style="margin:32px 0;border:none;border-top:1px solid #eee" />
  <p style="font-size:12px;color:#888">Portal RH — Armazém Coral</p>
</body>
</html>`;
}

export function passwordResetEmailHtml(params: {
  name: string;
  resetUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <p>Olá, ${escapeHtml(params.name)},</p>
  <p>Recebemos uma solicitação para redefinir sua senha no Portal RH.</p>
  <p style="margin:24px 0"><a href="${params.resetUrl}" style="background:#c8102e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Redefinir senha</a></p>
  <p style="font-size:13px;color:#666">Se você não solicitou, ignore este e-mail. O link expira em breve.</p>
  <hr style="margin:32px 0;border:none;border-top:1px solid #eee" />
  <p style="font-size:12px;color:#888">Portal RH — Armazém Coral</p>
</body>
</html>`;
}

export function welcomeEmailHtml(params: {
  name: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <p>Olá, ${escapeHtml(params.name)},</p>
  <p>Sua conta no Portal RH foi criada. Use as credenciais abaixo no primeiro acesso e altere sua senha em seguida.</p>
  <table style="margin:16px 0;border-collapse:collapse;width:100%">
    <tr><td style="padding:8px 0;color:#666">E-mail</td><td style="padding:8px 0;font-weight:600">${escapeHtml(params.email)}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Senha inicial</td><td style="padding:8px 0;font-family:monospace">${escapeHtml(params.temporaryPassword)}</td></tr>
  </table>
  <p style="margin:24px 0"><a href="${params.loginUrl}" style="background:#c8102e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Acessar o portal</a></p>
  <hr style="margin:32px 0;border:none;border-top:1px solid #eee" />
  <p style="font-size:12px;color:#888">Portal RH — Armazém Coral</p>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
