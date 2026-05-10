/**
 * Serves the /.well-known/farcaster.json manifest (via next.config.js rewrite).
 *
 * The `accountAssociation` block must be signed by the *owning* Base Account at
 * https://www.base.dev/preview?tab=account and pasted into env vars:
 *
 *   MANIFEST_AA_HEADER, MANIFEST_AA_PAYLOAD, MANIFEST_AA_SIGNATURE
 *
 * Until those are set, the manifest still responds with `null` for accountAssociation
 * — sufficient for the in-app browser to discover the app once the URL is posted.
 */
import { NextResponse } from 'next/server';
import { miniapp } from '@/lib/miniapp-config';

export const runtime  = 'edge';
export const revalidate = 3600;

export async function GET() {
  const header    = process.env.MANIFEST_AA_HEADER;
  const payload   = process.env.MANIFEST_AA_PAYLOAD;
  const signature = process.env.MANIFEST_AA_SIGNATURE;

  const accountAssociation =
    header && payload && signature ? { header, payload, signature } : null;

  return NextResponse.json(
    {
      accountAssociation,
      // duplicate under `frame` for legacy clients that still read the old key
      frame:    miniapp,
      miniapp,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=3600',
        'Content-Type':  'application/json',
      },
    },
  );
}
