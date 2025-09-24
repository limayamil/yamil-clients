import { NextResponse } from 'next/server';

// Only allow in development environment
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    );
  }

  try {
    // Toggle the MOCK_AUTH environment variable
    const currentValue = process.env.MOCK_AUTH === 'true';
    const newValue = !currentValue;

    // Note: In production, environment variables are read-only
    // This is a development-only helper
    process.env.MOCK_AUTH = newValue.toString();

    return NextResponse.json({
      success: true,
      message: `Mock auth ${newValue ? 'enabled' : 'disabled'}`,
      mockAuth: newValue
    });
  } catch (error) {
    console.error('Error toggling mock auth:', error);
    return NextResponse.json(
      { error: 'Failed to toggle mock auth' },
      { status: 500 }
    );
  }
}

// Also allow GET to check current status
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    mockAuth: process.env.MOCK_AUTH === 'true'
  });
}