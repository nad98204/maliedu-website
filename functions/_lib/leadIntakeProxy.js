export async function proxyLeadIntake(context) {
  if (!context.env?.LEAD_INTAKE) return Response.json({
    error: 'Kho nhận đăng ký chưa sẵn sàng. Vui lòng giữ thông tin và thử lại.',
  }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const headers = new Headers(context.request.headers);
  headers.set('X-Lead-Client-IP', headers.get('CF-Connecting-IP') || '');
  headers.delete('X-Forwarded-For');
  try {
    return await context.env.LEAD_INTAKE.fetch(new Request(context.request, { headers }));
  } catch {
    return Response.json({ error: 'Chưa xác nhận được đăng ký. Vui lòng giữ thông tin và thử lại.' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
