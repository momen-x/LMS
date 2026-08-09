# Stripe checkout pages (frontend project)

The frontend is not present in this workspace. Adapt the import paths below to
its API client and query-key locations.

## API function

```ts
export type CheckoutSessionResult = {
  status: 'pending' | 'completed' | 'failed' | 'expired';
  courseId: string;
  isEnrollment: boolean;
};

export async function verifyCheckoutSession(sessionId: string) {
  const { data } = await apiClient.get<CheckoutSessionResult>(
    `/payments/checkout/session/${encodeURIComponent(sessionId)}`,
  );
  return data;
}
```

## `/payment/success`

This Next.js App Router example retries only `pending` results, then refreshes
all enrollment caches before navigation.

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { enrollmentQueryKeys } from '@/features/enrollment/query-keys';
import { verifyCheckoutSession } from '@/features/payments/api';

const MAX_ATTEMPTS = 8;
const RETRY_DELAY_MS = 1500;

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get('session_id');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const verify = useCallback(async () => {
    if (!sessionId) {
      setError('Missing checkout session.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await verifyCheckoutSession(sessionId);
      if (result.status === 'completed' && result.isEnrollment) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: enrollmentQueryKeys.all,
          }),
          queryClient.invalidateQueries({
            queryKey:
              enrollmentQueryKeys.isUserEnrolled(result.courseId),
          }),
          queryClient.invalidateQueries({
            queryKey: enrollmentQueryKeys.userStats(),
          }),
        ]);
        router.replace(`/student-dashboard/courses/${result.courseId}`);
        return;
      }

      if (result.status === 'pending' && attempt + 1 < MAX_ATTEMPTS) {
        window.setTimeout(() => setAttempt((value) => value + 1), RETRY_DELAY_MS);
        return;
      }

      setError(
        result.status === 'pending'
          ? 'Payment confirmation is taking longer than expected. Please retry.'
          : `Payment is ${result.status}.`,
      );
    } catch {
      setError('Could not verify the payment. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [attempt, queryClient, router, sessionId]);

  useEffect(() => {
    void verify();
  }, [verify]);

  return (
    <main>
      {loading && <p>Confirming your payment…</p>}
      {error && (
        <>
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => (value === 0 ? 1 : 0))}
          >
            Retry
          </button>
        </>
      )}
    </main>
  );
}
```

## `/payment/cancel`

```tsx
'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <main>
      <h1>Payment cancelled</h1>
      <p>You were not charged. You can return to the course and try again.</p>
      <Link href="/courses">Back to courses</Link>
    </main>
  );
}
```

## Enrollment hook contract

The backend response is always `{ isEnrollment: boolean }`. Unwrap it in the
repository so the hook data remains a boolean:

```ts
export async function isUserEnrolled(courseId: string): Promise<boolean> {
  const { data } = await apiClient.get<{ isEnrollment: boolean }>(
    `/enrollments/me/enrolled/${courseId}`,
  );
  return data.isEnrollment;
}

export function useIsUserEnrolledInCourse(courseId: string) {
  return useQuery({
    queryKey: enrollmentQueryKeys.isUserEnrolled(courseId),
    queryFn: () => isUserEnrolled(courseId),
    enabled: Boolean(courseId),
  });
}
```
