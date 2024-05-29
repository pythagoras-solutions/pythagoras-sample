// app/api/submit/route.ts

import { kv } from '@vercel/kv';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { z } from 'zod';

// Define the schema for validation using zod
const formDataSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  product: z.enum(['standard', 'premium'], { message: 'Invalid product' }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = formDataSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { username, product } = validationResult.data;

    // Mock storing form data in a DB
    // TODO: Store form data in a real database
    console.log('Mock storing form data in DB:', { username, product });

    // Store the initial status in the KV store
    await kv.set(`status:${username}`, 'submitting');

    // Generate a PDF with the form data
    const pdf = await generatePDF(username, product);

    // TODO: store this pdf in a DB and trigger this again if not completed

    // TODO: Send the form data and PDF to the external service
    const bodyFormData = new FormData();
    bodyFormData.append('FirstName', username);
    bodyFormData.append('LastName', 'dude');
    bodyFormData.append('SigningEmail', `${username}@thedude.com`);

    const pdfFile: File = new File([pdf], 'file.pdf', {
      type: 'application/pdf',
    });

    bodyFormData.append('File', pdfFile);

    console.log('🚀 ~ POST ~ bodyFormData:', bodyFormData);

    const URL =
      'https://api.360.pythagoras-solutions.com/dataProvider/Certifaction/GetUrlForSignedFile';

    const params = bodyFormData;

    const customConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization:
          'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJWY1c3OEQzUUVUelNGSGJKVHFuNmN6cnhUelZ5aTJXNVBBcWlqTzA0UVpFIn0.eyJleHAiOjE3MTY5NzU0ODUsImlhdCI6MTcxNjk3NTE4NSwiYXV0aF90aW1lIjoxNzE2OTYzNjIyLCJqdGkiOiIwM2NkZGNkYS1hNmRhLTRjNDctYjhmZi00NjJiODU0ZWYxNDEiLCJpc3MiOiJodHRwczovL3Nzby4zNjAucHl0aGFnb3Jhcy1zb2x1dGlvbnMuY29tL3JlYWxtcy9UZW5hbnQxIiwic3ViIjoiZWY5OWQ3MWItMjBlNS00MWYwLTgzNTYtMjE0NjFkNDFhNWJjIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiVnVlVUkiLCJub25jZSI6IjVlODgwYzY2LTQ0MzQtNGNiMy1hZTY4LTczODZiOTQ4OTk4MyIsInNlc3Npb25fc3RhdGUiOiI3NTQyNWUzMC1jMzExLTRkOWUtYTA4MS0xNTNmMjQ3NDdkZjEiLCJzY29wZSI6Im9wZW5pZCBhcGktcm9sZSBwcm9maWxlIiwic2lkIjoiNzU0MjVlMzAtYzMxMS00ZDllLWEwODEtMTUzZjI0NzQ3ZGYxIiwidGltZXpvbmUiOiJFdXJvcGUvTGp1YmxqYW5hIiwicm9sZXMiOlsiQWRtaW5pc3RyYXRvciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLXRlbmFudDEiXSwicHJlZmVycmVkX3VzZXJuYW1lIjoibWFuYWdlciJ9.bVTn-hArAsvQusVl1cCbJUkSrzlPmAJjwBbop1LAWjwkcJ-0w96hQ82vMtOfJvPATQk0W5sZZsu6f00z2peoZCiU7i7tJPTZsJR-rcpVu-M2JCJpo2lzzPdMhaitXhNhrCpnrChgws1AT5KJVAYwHiMG0AwYJ4kXYPGMcUd9rAlGfBrXI0GQMErzNb3mk7zqTNkX9cQADj7MKaPm_yoNBdtenA12t6qHZvZbhgc65gukqhQlQ4Dq09CVkapdPOBYC3eu6Ys7GpPq-cYioj1AQE7mdgLNbOcGiShLcCmY72OLIlZ7o34WSVMkbv8ymyLVnFxEV8RlDoTdMb-aAqRrmQ',
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
    await kv.set(`status:${username}`, 'submitted');

    return NextResponse.json({
      message: 'Form submitted successfully',
      username,
      product,
      redirectUrl: response.data,
      pdf,
    });
  } catch (error: any) {
    console.error('Internal server error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 },
    );
  }
}

async function generatePDF(username: string, product: string): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Generate HTML content for the PDF
  const htmlContent = `
    <html>
    <head>
      <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 16px;
        color: #333;
      }
      h1 {
        font-size: 24px;
        color: #555;
        margin-bottom: 20px;
      }
      p {
        margin-bottom: 10px;
      }
      </style>
    </head>
    <body>
      <h1>Hi ${username},</h1>
      <p>You have chosen ${product}. Thank you for submitting the form.</p>
    </body>
    </html>
  `;

  // Set the content of the page
  await page.setContent(htmlContent);

  // Generate PDF
  const pdfBuffer = await page.pdf();

  // Close the browser
  await browser.close();

  return pdfBuffer;
}
