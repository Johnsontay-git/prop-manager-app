import { useEffect, useState } from 'react';

let showToastFn;
export function toast(msg, type = 'success') { showToastFn?.(msg, type); }

export default function Toast() {
  const [state, setState] = useState({ msg: '', type: 'success', visible: false });

  useEffect(() => {
    showToastFn = (msg, type) => {
      setState({ msg, type, visible: true });
      setTimeout(() => setState(s => ({ ...s, visible: false })), 2800);
    };
  }, []);

  if (!state.visible) return null;

  const colors = {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    info:    'bg-blue-500',
  };

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 ${colors[state.type]} text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg sheet-enter whitespace-nowrap`}>
      {state.msg}
    </div>
  );
}
