import { NextResponse } from 'next/server';
import { currentUser, hasGate } from '@/platform/auth';
import { supplierFor } from '@/platform/data';
import { onboardingLink } from '@/platform/payments';
import { origin } from '@/platform/origin';

export const dynamic = 'force-dynamic';

/** Sends a supplier to Stripe to set up (or finish setting up) card payments. Also used by Stripe when a link expires. */
export async function GET() {
  const o = await origin();
  const u = await currentUser();
  if (!u || u.role !== 'supplier' || !(await hasGate())) return NextResponse.redirect(o + '/platform/login');
  const sup = await supplierFor(u.id);
  if (!sup) return NextResponse.redirect(o + '/platform/login');
  try {
    return NextResponse.redirect(await onboardingLink(sup, u.email, o));
  } catch (e) {
    return NextResponse.redirect(o + '/platform/supplier/account?e=' + encodeURIComponent('Stripe: ' + (e as Error).message));
  }
}
