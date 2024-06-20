import { NextResponse } from 'next/server';

const defaultCorsHeaders = {
  'Access-Control-Allow-Methods': process.env.ACCESS_CONTROL_ALLOW_METHODS || '',
  'Access-Control-Allow-Headers': process.env.ACCESS_CONTROL_ALLOW_HEADERS || '',
  'Access-Control-Allow-Credentials': process.env.ACCESS_CONTROL_ALLOW_CREDENTIALS || 'false',
};

export function middleware(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const requestOrigin = requestHeaders.get('origin');

  const envAllowedOrigins = process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '';
  const allowedOrigins = envAllowedOrigins.split(',');
  const isOriginAllowed = requestOrigin && allowedOrigins.includes(requestOrigin);

  const responseHeaders = {
    'Access-Control-Allow-Origin': requestOrigin || '',
    ...defaultCorsHeaders,
  };

  if (isOriginAllowed && request.method === 'OPTIONS') {
    return NextResponse.json({}, { headers: responseHeaders })
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isOriginAllowed) {
    Object.entries(responseHeaders).forEach(([headerName, headerValue]) => {
      response.headers.set(headerName, headerValue);
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/api/hydrate_user',
  ],
};
