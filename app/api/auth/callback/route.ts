import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const clientId = process.env.ANILIST_CLIENT_ID;
  const clientSecret = process.env.ANILIST_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || '';
  const baseUrl = appUrl.replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/callback`;

  try {
    const response = await fetch('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
    }

    const token = data.access_token;
    const safeToken = JSON.stringify(token);
    const targetOrigin = baseUrl || '*';

    // Return a script that sends the token back to the opener and closes the popup
    const html = `
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'ANILIST_AUTH_SUCCESS', token: ${safeToken} }, '${targetOrigin}');
              window.close();
            } else {
              window.location.href = '/profile';
            }
          </script>
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #09090b; color: white;">
            <p>Authentication successful! Closing window...</p>
          </div>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('OAuth exchange error:', error);
    return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 500 });
  }
}
