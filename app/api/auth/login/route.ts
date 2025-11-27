/**
 * POST /api/auth/login
 *
 * Authenticate user and return JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, getSafeUser } from '@/lib/models/user';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const result = await authenticateUser(email, password);

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const { user, token } = result;
    const safeUser = getSafeUser(user);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
