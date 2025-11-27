import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const SIPUNI_API_BASE = process.env.NEXT_PUBLIC_SIPUNI_API_BASE || 'https://apilk.sipuni.com/api/ver2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { endpoint, method = 'POST', data, token } = body;

    console.log('Proxy POST Request:', {
      endpoint,
      method,
      hasToken: !!token,
      tokenType: token?.startsWith('session_') ? 'session' : token?.includes('.') ? 'jwt' : 'unknown'
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    if (!token) {
      console.error('❌ Missing token in request body');
      return NextResponse.json(
        { error: 'Missing JWT token' },
        { status: 401 }
      );
    }

    // Skip API calls if using session token (not JWT)
    if (token.startsWith('session_')) {
      console.warn('⚠️ Using session token instead of JWT - this may not work with Sipuni API');
      return NextResponse.json(
        { error: 'Invalid token type. Please use a real JWT token from lk.sipuni.com' },
        { status: 401 }
      );
    }

    const url = `${SIPUNI_API_BASE}${endpoint}`;
    console.log('Calling Sipuni API:', { url, method });

    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const config: any = {
      method: method.toUpperCase(),
      url,
      headers,
      timeout: 30000,
      validateStatus: () => true,
    };

    if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') {
      config.data = data || {};
    }

    console.log('Axios Request:', {
      method: config.method,
      url: config.url,
      hasAuth: !!headers.Authorization,
      authPrefix: headers.Authorization?.substring(0, 20) + '...',
    });

    const response = await axios(config);

    console.log('✅ Sipuni Response:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error('❌ Proxy Error Details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      isAxiosError: error.isAxiosError,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
    });

    return NextResponse.json(
      {
        error: error.message || 'Request failed',
        details: error.code || error.syscall || 'Unknown error'
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const token = searchParams.get('token');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Missing JWT token' },
        { status: 401 }
      );
    }

    const url = `${SIPUNI_API_BASE}${endpoint}`;
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    console.log('GET Request:', {
      url,
      hasBearer: !!headers.Authorization,
    });

    const response = await axios({
      method: 'GET',
      url,
      headers,
      timeout: 30000,
      validateStatus: () => true,
    });

    console.log('✅ GET Response:', response.status, response.statusText);

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error('❌ Proxy Error:', error.message);

    if (error.response) {
      return NextResponse.json(
        {
          error: error.response.data?.error || error.message,
          status: error.response.status,
        },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Request failed' },
      { status: 500 }
    );
  }
}
