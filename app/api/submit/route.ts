// app/api/submit/route.ts

import { kv } from '@vercel/kv';
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
    // const response = await fetch('https://my-identification-service/identify', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     data: { username, product },
    //     pdf, // Send the PDF buffer directly
    //   }),
    // });

    // if (!response.ok) {
    //   throw new Error('Failed to send data to identification service');
    // }

    // Store the initial status in the KV store
    await kv.set(`status:${username}`, 'submitted');

    return NextResponse.json({
      message: 'Form submitted successfully',
      username,
      product,
      pdf,
    });
  } catch (error: any) {
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
