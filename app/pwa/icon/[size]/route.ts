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
        background:
          'linear-gradient(135deg, #0f172a 0%, #0b3b2d 50%, #0ea5e9 120%)',
        position: 'relative',
      },
    },
    React.createElement(
      'div',
      {
        style: {
          width: '82%',
          height: '82%',
          borderRadius: size * 0.18,
          background: 'rgba(16, 185, 129, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.18)',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            fontSize: size * 0.22,
            letterSpacing: size * 0.02,
            fontWeight: 900,
            color: 'rgba(255,255,255,0.92)',
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
