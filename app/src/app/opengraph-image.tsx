import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const alt = 'Sol-Flow - Solidity Contract Visualizer';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const logoPath = join(process.cwd(), 'public', 'logo.png');
  const logoData = await readFile(logoPath);
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(0,212,170,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo and Text Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Logo */}
          <img
            src={logoBase64}
            width={120}
            height={120}
            style={{
              borderRadius: '24px',
            }}
          />

          {/* Sol-Flow Text with Gradient */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              background: 'linear-gradient(90deg, #00D4AA 0%, #ffffff 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            Sol-Flow
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: '32px',
            fontSize: '28px',
            color: '#94a3b8',
            letterSpacing: '0.02em',
          }}
        >
          Solidity Contract Visualizer
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
