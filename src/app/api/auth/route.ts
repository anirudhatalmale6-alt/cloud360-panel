import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const PANEL_USER = process.env.PANEL_USER || 'admin';
const PANEL_PASS = process.env.PANEL_PASS || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username !== PANEL_USER || password !== PANEL_PASS) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate a random session token
    const sessionToken = randomBytes(32).toString('hex');

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    // Set httpOnly cookie
    response.cookies.set('cloud360_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
