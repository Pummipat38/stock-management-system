import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 42,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(14,165,233,0.22))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.18)',
          }}
        >
          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              letterSpacing: 3,
              color: 'rgba(255,255,255,0.95)',
              fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
            }}
          >
            SMS
          </div>
        </div>
      </div>
    ),
    {
      width: 180,
      height: 180,
    }
  );
}
