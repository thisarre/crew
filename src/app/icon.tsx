import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#DAF4AA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 320,
          fontWeight: 800,
          color: '#16161B',
          letterSpacing: '-12px',
          fontFamily: 'system-ui',
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
