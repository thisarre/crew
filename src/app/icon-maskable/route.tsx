import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
        }}
      >
        {/* Pour les icônes maskable, on prévoit une safe area de 10% sur les bords.
            On met le "C" dans un cercle ink centré qui occupe environ 60% pour rester safe */}
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 999,
            background: '#16161B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 200,
            fontWeight: 800,
            color: '#DAF4AA',
            letterSpacing: '-8px',
            fontFamily: 'system-ui',
          }}
        >
          C
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
