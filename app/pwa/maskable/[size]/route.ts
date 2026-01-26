import React from 'react';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: { size: string } }
) {
  const raw = Number(params.size);
  const size = Number.isFinite(raw) ? Math.max(64, Math.min(1024, raw)) : 512;

  const element = React.createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
      },
    },
    React.createElement(
      'div',
      {
        style: {
          width: '88%',
          height: '88%',
          borderRadius: size * 0.25,
          background:
            'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.38) 0%, rgba(14,165,233,0.22) 55%, rgba(15,23,42,0.0) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.16)',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            fontSize: size * 0.22,
            letterSpacing: size * 0.02,
            fontWeight: 900,
            color: 'rgba(255,255,255,0.95)',
            fontFamily:
              'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
          },
        },
        'SMS'
      )
    )
  );

  return new ImageResponse(
    element,
    {
      width: size,
      height: size,
    }
  );
}
