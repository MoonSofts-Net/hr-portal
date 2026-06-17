#!/usr/bin/env node
/**
 * Integration test for new features (SMTP, default password, notifications, profile, branches).
 * Run while dev stack is up: node scripts/test-features.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:3001/api/v1';
const TEST_EMAIL = `test.user.${Date.now()}@armazemcoral.com.br`;
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD ?? 'Coral@2024';

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function request(path, options = {}) {
  const url = `${API}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, ok: res.ok };
}

async function main() {
  console.log(`\nTesting Portal RH features at ${API}\n`);

  // 1. Health
  const health = await request('/health');
  if (health.ok) pass('API health');
  else return fail('API health', `status ${health.status}`);

  // 2. Admin login
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@portalrh.com', password: 'admin123' }),
  });
  if (!adminLogin.ok || !adminLogin.body?.accessToken) {
    return fail('Admin login', JSON.stringify(adminLogin.body));
  }
  pass('Admin login');
  const adminToken = adminLogin.body.accessToken;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  const adminMe = await request('/auth/me', { headers: adminHeaders });
  const tenantId = adminMe.body?.activeTenant?.id ?? adminMe.body?.homeTenant?.id;
  if (!tenantId) return fail('Resolve tenant ID');
  pass('Auth /me', `tenant=${tenantId}`);

  // 3. Branches (filiais)
  const branches = await request('/branches?limit=100&activeOnly=true', {
    headers: { ...adminHeaders, 'x-tenant-id': tenantId },
  });
  const branchList = branches.body?.data ?? branches.body;
  const branchCount = Array.isArray(branchList) ? branchList.length : 0;
  if (branchCount >= 1) pass('Branches list', `${branchCount} filiais`);
  else fail('Branches list', 'no branches returned');

  const branchId = branchList?.[0]?.id;
  if (!branchId) return fail('Branch ID for user create');

  // 4. Roles for user create
  const roles = await request('/roles?limit=50', {
    headers: { ...adminHeaders, 'x-tenant-id': tenantId },
  });
  const roleList = roles.body?.data ?? roles.body;
  const employeeRole = (Array.isArray(roleList) ? roleList : []).find(
    (r) => r.name?.toLowerCase().includes('employee') || r.name?.toLowerCase().includes('colaborador'),
  ) ?? roleList?.[roleList.length - 1];
  if (!employeeRole?.id) return fail('Find employee role');
  pass('Roles list', employeeRole.name);

  // 5. Create user without password (default password flow)
  const createUser = await request('/users', {
    method: 'POST',
    headers: { ...adminHeaders, 'x-tenant-id': tenantId },
    body: JSON.stringify({
      email: TEST_EMAIL,
      name: 'Teste Integração',
      cpf: '52998224725',
      roleId: employeeRole.id,
      branchId,
      department: 'TI',
    }),
  });
  if (!createUser.ok) {
    fail('Create user (default password)', JSON.stringify(createUser.body));
  } else {
    pass('Create user (default password)', TEST_EMAIL);
  }

  // 6. New user login + mustChangePassword
  const newUserLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: TEST_EMAIL, password: DEFAULT_PASSWORD }),
  });
  if (!newUserLogin.ok) {
    fail('New user login with default password', JSON.stringify(newUserLogin.body));
  } else if (newUserLogin.body?.requiresPasswordChange) {
    pass('Login requires password change', 'requiresPasswordChange=true');
  } else {
    fail('Login requires password change', 'flag not set');
  }

  const newToken = newUserLogin.body?.accessToken;
  const newHeaders = newToken ? { Authorization: `Bearer ${newToken}`, 'x-tenant-id': tenantId } : null;

  if (newHeaders) {
    const newMe = await request('/auth/me', { headers: newHeaders });
    if (newMe.body?.mustChangePassword) pass('Auth /me mustChangePassword', 'true');
    else fail('Auth /me mustChangePassword', JSON.stringify(newMe.body?.mustChangePassword));

    // 7. Change password
    const changePw = await request('/auth/change-password', {
      method: 'POST',
      headers: newHeaders,
      body: JSON.stringify({
        currentPassword: DEFAULT_PASSWORD,
        newPassword: 'NovaSenha@2024',
      }),
    });
    if (changePw.ok) pass('Change password on first login');
    else fail('Change password', JSON.stringify(changePw.body));

    const afterChange = await request('/auth/me', { headers: newHeaders });
    if (afterChange.body?.mustChangePassword === false) pass('mustChangePassword cleared');
    else fail('mustChangePassword cleared', String(afterChange.body?.mustChangePassword));
  }

  // Re-login as new user with new password
  const relogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: TEST_EMAIL, password: 'NovaSenha@2024' }),
  });
  const userToken = relogin.body?.accessToken;
  const userHeaders = userToken
    ? { Authorization: `Bearer ${userToken}`, 'x-tenant-id': tenantId }
    : null;

  if (relogin.ok && !relogin.body?.requiresPasswordChange) {
    pass('Re-login after password change');
  } else {
    fail('Re-login after password change', JSON.stringify(relogin.body));
  }

  // 8. Profile
  if (userHeaders) {
    const profile = await request('/profile/me', { headers: userHeaders });
    if (profile.ok && profile.body?.email === TEST_EMAIL) {
      pass('Profile GET /me', profile.body?.branch?.name ?? 'no branch');
    } else {
      fail('Profile GET', JSON.stringify(profile.body));
    }

    const updateProfile = await request('/profile/me', {
      method: 'PATCH',
      headers: userHeaders,
      body: JSON.stringify({ phone: '81999998888', name: 'Teste Integração Atualizado' }),
    });
    if (updateProfile.ok && updateProfile.body?.phone === '81999998888') {
      pass('Profile PATCH /me');
    } else {
      fail('Profile PATCH', JSON.stringify(updateProfile.body));
    }

    // Avatar upload (minimal PNG)
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'avatar.png');

    const avatarRes = await fetch(`${API}/profile/avatar`, {
      method: 'POST',
      headers: { Authorization: userHeaders.Authorization, 'x-tenant-id': tenantId },
      body: form,
    });
    const avatarBody = await avatarRes.json().catch(() => ({}));
    if (avatarRes.ok && avatarBody?.avatarUrl) pass('Profile avatar upload');
    else fail('Profile avatar upload', JSON.stringify(avatarBody));
  }

  // 9. HR request + notifications
  if (userHeaders) {
    const hrReq = await request('/hr-requests', {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        subject: 'Teste notificação integração',
        category: 'general',
        priority: 'normal',
        initialMessage: 'Mensagem de teste automatizado',
      }),
    });
    const requestId = hrReq.body?.id ?? hrReq.body?.data?.id;
    if (hrReq.ok && requestId) pass('HR request created', requestId);
    else fail('HR request created', JSON.stringify(hrReq.body));

    const notifs = await request('/notifications', { headers: userHeaders });
    const notifList = notifs.body?.data ?? notifs.body;
    const notifArr = Array.isArray(notifList) ? notifList : [];
    if (notifArr.length > 0) {
      pass('Notifications created', `${notifArr.length} notification(s)`);
      const first = notifArr[0];
      const markRead = await request(`/notifications/${first.id}/read`, {
        method: 'PATCH',
        headers: userHeaders,
      });
      if (markRead.ok) pass('Mark notification read');
      else fail('Mark notification read', JSON.stringify(markRead.body));
    } else {
      fail('Notifications created', 'empty list');
    }

    await request('/notifications/read-all', { method: 'POST', headers: userHeaders });
    const afterAll = await request('/notifications', { headers: userHeaders });
    const afterList = afterAll.body?.data ?? afterAll.body;
    const unread = (Array.isArray(afterList) ? afterList : []).filter((n) => !n.read).length;
    if (unread === 0) pass('Mark all notifications read');
    else fail('Mark all notifications read', `${unread} still unread`);
  }

  // 10. HR status change notification (as admin)
  if (userHeaders && adminHeaders) {
    const reqs = await request('/hr-requests?limit=5', { headers: userHeaders });
    const reqList = reqs.body?.data ?? reqs.body;
    const latestId = Array.isArray(reqList) ? reqList[0]?.id : null;
    if (latestId) {
      const statusUpdate = await request(`/hr-requests/${latestId}/status`, {
        method: 'PATCH',
        headers: { ...adminHeaders, 'x-tenant-id': tenantId },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      if (statusUpdate.ok) pass('HR request status update');
      else fail('HR request status update', JSON.stringify(statusUpdate.body));

      const userNotifs = await request('/notifications', { headers: userHeaders });
      const list = userNotifs.body?.data ?? userNotifs.body;
      const hasStatusNotif = (Array.isArray(list) ? list : []).some((n) =>
        n.title?.includes('Atualização'),
      );
      if (hasStatusNotif) pass('Status change notification');
      else fail('Status change notification', 'not found in user notifications');
    }
  }

  // 11. Forgot password (SMTP trigger — may succeed silently)
  const forgot = await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL }),
  });
  if (forgot.ok || forgot.status === 201) {
    pass('Forgot password endpoint', 'check API logs for SMTP send');
  } else {
    fail('Forgot password', JSON.stringify(forgot.body));
  }

  // 12. Frontend routes smoke (via Next.js)
  const routes = ['/login', '/reset-password', '/profile', '/change-password', '/users/new'];
  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:3000${route}`, { redirect: 'manual' });
      if (res.status === 200 || res.status === 307 || res.status === 308) {
        pass(`Frontend route ${route}`, `HTTP ${res.status}`);
      } else {
        fail(`Frontend route ${route}`, `HTTP ${res.status}`);
      }
    } catch (e) {
      fail(`Frontend route ${route}`, e.message);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
