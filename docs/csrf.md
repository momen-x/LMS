# CSRF protection

The API now uses a double-submit CSRF cookie pattern with the csrf-csrf package.

## Browser flow

1. Request GET /auth/csrf-token with credentials included.
2. Read the returned csrfToken from the JSON body.
3. Send that token in the X-CSRF-Token header for POST, PUT, PATCH, and DELETE requests.
4. Continue sending cookies with credentials enabled.

## Example frontend helper

```ts
let cachedCsrfToken: string | null = null;

async function getCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken;

  const response = await fetch(`${API_URL}/auth/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unable to obtain CSRF token');
  }

  const data = await response.json();
  cachedCsrfToken = data.csrfToken;
  return cachedCsrfToken;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  const headers = new Headers(options.headers);

  if (unsafeMethods.has(method)) {
    headers.set('X-CSRF-Token', await getCsrfToken());
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (
    response.status === 403 &&
    response.headers.get('content-type')?.includes('application/json')
  ) {
    const clonedResponse = response.clone();
    const error = await clonedResponse.json().catch(() => null);

    if (error?.code === 'INVALID_CSRF_TOKEN') {
      cachedCsrfToken = null;
      headers.set('X-CSRF-Token', await getCsrfToken());

      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  return response;
}
```

## Notes

- credentials: 'include' is required for cookie-based auth.
- X-CSRF-Token is required only for unsafe methods.
- The token is not an authentication credential.
- Do not place the token in a URL.
- The token may be cached in memory.
- If CSRF validation fails, fetch a new token and retry once.
- Do not store access or refresh tokens in localStorage.

## Postman and Insomnia

1. Send `GET /api/auth/csrf-token` and keep the response cookies in the client's cookie jar.
2. Copy `csrfToken` from the JSON response.
3. Add it as the `X-CSRF-Token` header on each POST, PUT, PATCH, or DELETE request.
4. When a response has code `INVALID_CSRF_TOKEN`, obtain a fresh token and retry only once.

Bearer-only API calls do not need a CSRF token when no access-token or refresh-token cookie is present. Cookie-authenticated calls always require CSRF protection, even if they also include a Bearer header.

Generate a secret for local or deployed environments with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
