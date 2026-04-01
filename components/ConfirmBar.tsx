// ── ConfirmBar — shown in auto-detect mode to confirm the detected method ──

import type { ImpersonateMethod } from '@/types';

const METHOD_DISPLAY: Record<string, string> = {
  email: 'Email',
  zuid: 'ZUID',
  screenname: 'Screen Name',
};

interface Props {
  method: ImpersonateMethod;
  value: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmBar({ method, value, onConfirm, onCancel }: Props) {
  return (
    <div className="zat-confirm-bar">
      <span className="zat-confirm-text">
        Detected: <strong>{METHOD_DISPLAY[method] ?? method}</strong> &mdash; &ldquo;{value}&rdquo;
      </span>
      <button className="zat-confirm-yes" onClick={onConfirm}>
        Go
      </button>
      <button className="zat-confirm-no" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
