import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.ANILIST_CLIENT_ID;
  const appUrl = process.env.APP_URL || '';
  
  // Remove trailing slash if present
  const baseUrl = appUrl.replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'ANILIST_CLIENT_ID is not configured' }, { status: 500 });
  }

  const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
