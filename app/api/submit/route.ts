// app/api/submit/route.ts

import { kv } from '@vercel/kv';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'https://api.360.pythagoras-solutions.com';

const AUTH_URL =
  'https://sso.360.pythagoras-solutions.com/realms/Tenant1/protocol/openid-connect/token';

export async function POST(request: NextRequest) {
  try {
    const token = await getBearerToken();

    const formData = await request.formData();
    const client = {
      pid: uuidv4(),
      personTypeID: (formData.get('PersonTypeID') as string) || 'U',
      relationStateID: Number(formData.get('RelationStateID')) || 1,
      name: formData.get('LastName') as string,
      firstName: formData.get('FirstName') as string,
      dateOfBirth: formData.get('DateOfBirth') as string,
      dateOfDeath: (formData.get('DateOfDeath') as string) || null,
      nationalityCode: formData.get('NationalityCode') as string,
      nationality2Code: formData.get('Nationality2Code') as string,
      domicileCode: formData.get('DomicileCode') as string,
      openingDate:
        (formData.get('OpeningDate') as string) || new Date().toISOString(),
      lastSavedDate: (formData.get('LastSavedDate') as string) || null,
      closingDate: (formData.get('ClosingDate') as string) || null,
      genderID: (formData.get('GenderID') as string) || 'UE',
      duns: (formData.get('Duns') as string) || '',
      customProperties: [
        {
          customPropertyId: '1b82f0b5-cb68-4b53-beac-64d370d0dd08', // email if you don't see...
          value: formData.get('SigningEmail') as string,
        },
      ],
    };

    // create client
    // TODO: Store PID in KV store
    try {
      await axios.post(
        `${API_URL}/partner/Partner/InsertUpdateOrDeletePartner`,
        client,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error: any) {
      console.error('Error creating client', error);
    }

    // send the signing request
    const urlForSignedFileResponse = await axios.post(
      `${API_URL}/dataProvider/Certifaction/GetUrlForSignedFile`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // trigger KYC screening
    try {
      axios.post(`${API_URL}/dataProvider/Screening/TriggerScreening`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      console.error('Error triggering KYC screening', error);
    }

    // Store the initial status in the KV store
    await kv.set(`status:${formData.get('SigningEmail')}`, 'submitted');

    return NextResponse.json({
      message: 'Form submitted successfully',
      redirectUrl: urlForSignedFileResponse.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 },
    );
  }
}

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

    console.log('🚀 ~ getBearerToken ~ response:', response.data.access_token);

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting bearer token', error);
  }
};
