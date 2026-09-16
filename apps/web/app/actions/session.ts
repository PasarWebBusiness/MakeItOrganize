'use server';

import { touchCurrentSession } from '@/lib/auth';

export async function touchSessionAction() {
  return touchCurrentSession();
}
