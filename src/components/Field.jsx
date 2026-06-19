export function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const base = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition";

export function Input(props) {
  return <input className={base} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={base + " appearance-none"} {...props}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className={base + " min-h-[80px] resize-none"} {...props} />;
}

export function Row({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
