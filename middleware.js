import { next } from '@vercel/functions';

export const config = {
  matcher: '/(.*)',
  runtime: 'nodejs',
};

const REALM = 'aiden-site';

function challenge() {
  return new Response('This site is password protected.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default function middleware(request) {
  const expectedPassword = process.env.SITE_PASSWORD;
  // Fail closed: an unset password must not leave the site wide open.
  if (!expectedPassword) return challenge();

  const expectedUser = process.env.SITE_USER || 'aiden';

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return challenge();

  let credentials;
  try {
    credentials = atob(encoded);
  } catch {
    return challenge();
  }

  const separator = credentials.indexOf(':');
  if (separator === -1) return challenge();

  const user = credentials.slice(0, separator);
  const password = credentials.slice(separator + 1);

  if (user !== expectedUser || password !== expectedPassword) return challenge();

  return next();
}
