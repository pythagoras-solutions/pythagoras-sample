import { kv } from '@vercel/kv';

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const email = searchParams.get('email');

  if (!email) {
    return new Response('Email is required', { status: 400 });
  }

  const status = await kv.get(`status:${email}`);

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  return new Response(`data: ${status}\n\n`, { headers });
}
