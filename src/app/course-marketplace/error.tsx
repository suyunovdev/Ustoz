'use client';

import SegmentError from '@/components/common/SegmentError';

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError {...props} scope="course-marketplace" />;
}
