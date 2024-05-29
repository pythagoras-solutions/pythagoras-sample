// app/api/submit/route.ts

import { kv } from '@vercel/kv';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    kv.set(`status:${formData.get('SigningEmail')}`, 'pending');

    // TODO: store this pdf in a DB and trigger this again if not completed

    const URL =
      'https://api.360.pythagoras-solutions.com/dataProvider/Certifaction/GetUrlForSignedFile';

    const params = formData;

    const customConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization:
          'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJWY1c3OEQzUUVUelNGSGJKVHFuNmN6cnhUelZ5aTJXNVBBcWlqTzA0UVpFIn0.eyJleHAiOjE3MTY5NzU0ODUsImlhdCI6MTcxNjk3NTE4NSwiYXV0aF90aW1lIjoxNzE2OTYzNjIyLCJqdGkiOiIwM2NkZGNkYS1hNmRhLTRjNDctYjhmZi00NjJiODU0ZWYxNDEiLCJpc3MiOiJodHRwczovL3Nzby4zNjAucHl0aGFnb3Jhcy1zb2x1dGlvbnMuY29tL3JlYWxtcy9UZW5hbnQxIiwic3ViIjoiZWY5OWQ3MWItMjBlNS00MWYwLTgzNTYtMjE0NjFkNDFhNWJjIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiVnVlVUkiLCJub25jZSI6IjVlODgwYzY2LTQ0MzQtNGNiMy1hZTY4LTczODZiOTQ4OTk4MyIsInNlc3Npb25fc3RhdGUiOiI3NTQyNWUzMC1jMzExLTRkOWUtYTA4MS0xNTNmMjQ3NDdkZjEiLCJzY29wZSI6Im9wZW5pZCBhcGktcm9sZSBwcm9maWxlIiwic2lkIjoiNzU0MjVlMzAtYzMxMS00ZDllLWEwODEtMTUzZjI0NzQ3ZGYxIiwidGltZXpvbmUiOiJFdXJvcGUvTGp1YmxqYW5hIiwicm9sZXMiOlsiQWRtaW5pc3RyYXRvciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLXRlbmFudDEiXSwicHJlZmVycmVkX3VzZXJuYW1lIjoibWFuYWdlciJ9.bVTn-hArAsvQusVl1cCbJUkSrzlPmAJjwBbop1LAWjwkcJ-0w96hQ82vMtOfJvPATQk0W5sZZsu6f00z2peoZCiU7i7tJPTZsJR-rcpVu-M2JCJpo2lzzPdMhaitXhNhrCpnrChgws1AT5KJVAYwHiMG0AwYJ4kXYPGMcUd9rAlGfBrXI0GQMErzNb3mk7zqTNkX9cQADj7MKaPm_yoNBdtenA12t6qHZvZbhgc65gukqhQlQ4Dq09CVkapdPOBYC3eu6Ys7GpPq-cYioj1AQE7mdgLNbOcGiShLcCmY72OLIlZ7o34WSVMkbv8ymyLVnFxEV8RlDoTdMb-aAqRrmQ', // completely random token
      },
    };

    const response = await axios.post(URL, params, customConfig);

    if (response.status !== 200) {
      return NextResponse.json(
        { message: 'Error submitting form', response: response.data },
        { status: 500 },
      );
    }

    // Store the initial status in the KV store
    await kv.set(`status:${formData.get('SigningEmail')}`, 'submitted');

    return NextResponse.json({
      message: 'Form submitted successfully',
      redirectUrl: response.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 },
    );
  }
}

const generateAndSendEmail = async (signerEmail: string) => {
  // TODO: Trigger CRM to send out email to signer
};
