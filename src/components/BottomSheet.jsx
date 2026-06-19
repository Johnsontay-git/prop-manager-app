import { useEffect } from 'react';

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-enter relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto pb-8">
        <div className="sticky top-0 bg-white pt-3 pb-2 px-5 rounded-t-3xl z-10 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg leading-none">×</button>
          </div>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}
