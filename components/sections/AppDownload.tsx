'use client';

function AppleLogo() {
  return (
    <svg width="19" height="23" viewBox="0 0 24 28" fill="white" aria-hidden="true">
      <path d="M20.29 14.47c-.04-3.54 2.9-5.25 3.03-5.33-1.65-2.42-4.22-2.75-5.13-2.79-2.19-.22-4.27 1.3-5.38 1.3-1.1 0-2.8-1.26-4.6-1.23C5.6 6.46 3.3 7.8 2.06 9.92c-2.52 4.36-.65 10.82 1.8 14.36 1.2 1.72 2.62 3.65 4.49 3.58 1.8-.07 2.49-1.16 4.68-1.16 2.18 0 2.8 1.16 4.72 1.12 1.95-.03 3.18-1.76 4.36-3.5 1.38-2 1.95-3.93 1.98-4.03-.04-.02-3.8-1.46-3.84-5.82zM16.71 5.1c.99-1.2 1.66-2.86 1.48-4.53-1.43.06-3.17.96-4.2 2.14-.92 1.06-1.73 2.77-1.51 4.4 1.6.13 3.23-.82 4.23-2.01z"/>
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg width="19" height="22" viewBox="0 0 20 24" fill="none" aria-hidden="true">
      <path d="M1 1L1 12L11 12Z" fill="#34A853"/>
      <path d="M1 12L1 23L11 12Z" fill="#4285F4"/>
      <path d="M1 1L11 12L18.5 12Z" fill="#EA4335"/>
      <path d="M1 23L11 12L18.5 12Z" fill="#FBBC05"/>
    </svg>
  );
}

function AppStoreBadge() {
  return (
    <a
      href="#"
      aria-label="Download on the App Store"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '11px',
        background: '#000',
        borderRadius: '10px',
        padding: '9px 18px',
        textDecoration: 'none',
        userSelect: 'none',
        minWidth: '152px',
        cursor: 'pointer',
      }}
      onClick={(e) => e.preventDefault()}
    >
      <AppleLogo />
      <div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '9px', fontFamily: 'system-ui,-apple-system,sans-serif', letterSpacing: '0.4px', lineHeight: 1 }}>
          Download on the
        </div>
        <div style={{ color: '#fff', fontSize: '17px', fontFamily: 'system-ui,-apple-system,sans-serif', fontWeight: 600, letterSpacing: '-0.2px', lineHeight: 1.25, marginTop: '2px' }}>
          App Store
        </div>
      </div>
    </a>
  );
}

function GooglePlayBadge() {
  return (
    <a
      href="#"
      aria-label="Get it on Google Play"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '11px',
        background: '#000',
        borderRadius: '10px',
        padding: '9px 18px',
        textDecoration: 'none',
        userSelect: 'none',
        minWidth: '152px',
        cursor: 'pointer',
      }}
      onClick={(e) => e.preventDefault()}
    >
      <PlayLogo />
      <div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '9px', fontFamily: 'system-ui,-apple-system,sans-serif', letterSpacing: '0.4px', lineHeight: 1 }}>
          Get it on
        </div>
        <div style={{ color: '#fff', fontSize: '17px', fontFamily: 'system-ui,-apple-system,sans-serif', fontWeight: 600, letterSpacing: '-0.2px', lineHeight: 1.25, marginTop: '2px' }}>
          Google Play
        </div>
      </div>
    </a>
  );
}

interface AppDownloadProps {
  title?: string;
  body?: string;
}

export default function AppDownload({ title, body }: AppDownloadProps) {
  return (
    <section
      style={{
        padding: '4rem 1.5rem',
        textAlign: 'center',
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            margin: '0 0 0.75rem',
            fontFamily: 'system-ui,-apple-system,sans-serif',
          }}
        >
          {title || 'Take it with you'}
        </h2>
        {body && (
          <p
            style={{
              fontSize: '1.05rem',
              opacity: 0.7,
              margin: '0 0 2.25rem',
              lineHeight: 1.6,
              fontFamily: 'system-ui,-apple-system,sans-serif',
            }}
          >
            {body}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <AppStoreBadge />
          <GooglePlayBadge />
        </div>
      </div>
    </section>
  );
}
