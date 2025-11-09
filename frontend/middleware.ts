import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log favicon requests to help debug
  if (pathname === '/favicon.ico' || pathname === '/favicon.svg') {
    // eslint-disable-next-line no-console
    console.log('[middleware] favicon request:', pathname);
  }

  // If .ico is requested but appears missing/broken, rewrite to SVG
  if (pathname === '/favicon.ico') {
    const url = request.nextUrl.clone();
    url.pathname = '/favicon.svg';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/favicon.ico', '/favicon.svg'],
};


