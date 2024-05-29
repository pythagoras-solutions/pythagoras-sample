// app/api/update-identification-status/route.ts

import { kv } from '@vercel/kv';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define the schema for validation using zod
const statusUpdateSchema = z.object({
  clientID: z.string().min(1, { message: 'Client ID is required' }),
  status: z.string().min(1, { message: 'Status is required' }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = statusUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { clientID, status } = validationResult.data;

    // Store the status update in the KV store
    await kv.set(`status:${clientID}`, status);
    console.log('Received status update:', { clientID, status });

    return NextResponse.json({
      message: 'Status update received successfully',
      status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 },
    );
  }
}
