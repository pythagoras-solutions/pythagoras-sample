// app/api/submit/route.ts

import { kv } from '@vercel/kv';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
const API_URL =
  'https://api.360.pythagoras-solutions.com/dataProvider/Certifaction/GetUrlForSignedFile';

const AUTH_URL =
  'https://sso.360.pythagoras-solutions.com/realms/Tenant1/protocol/openid-connect/token';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    kv.set(`status:${formData.get('SigningEmail')}`, 'pending');

    // TODO: store this pdf in a DB and trigger this again if not completed

    const params = formData;

    // Add logic to get Authroization bearer token from backend - username and password
    const token = await getBearerToken();

    const customConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization:
          token && token.length > 0 ? `Bearer ${token}` : undefined,
      },
    };

    const response = await axios.post(API_URL, params, customConfig);

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

const getBearerToken = async () => {
  if (!process.env.USERNAME || !process.env.PASSWORD) {
    throw new Error('Username and password not set');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', 'VueUI');
  params.append('username', process.env.USERNAME);
  params.append('password', process.env.PASSWORD);
  try {
    const response = await axios.post(AUTH_URL, params);
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting bearer token', error);
  }
};
