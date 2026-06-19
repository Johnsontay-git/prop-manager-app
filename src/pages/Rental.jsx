import { useEffect, useState } from 'react';
import { getAll, addRecord, putRecord, delRecord } from '../db';
import { DollarSign, Plus, CheckCircle2, Pencil, Trash2, AlertCircle, Clock } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
import { Field, Input, Select, Textarea, Row } from '../components/Field';
import { toast } from '../components/Toast';

const fmt = n => 'RM ' + Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_TABS = ['all','unpaid','overdue','paid'];

function statusStyle(s) {
  if (s === 'paid')    return { bg:'bg-emerald-50 border-emerald-200', badge:'bg-emerald-100 text-emerald-700', icon:<CheckCircle2 size={14} className="text-emerald-500"/> };
  if (s === 'overdue') return { bg:'bg-red-50 border-red-200',         badge:'bg-red-100 text-red-700',         icon:<AlertCircle  size={14} className="text-red-500"/>    };
  return                      { bg:'bg-amber-50 border-amber-200',      badge:'bg-amber-100 text-amber-700',     icon:<Clock        size={14} className="text-amber-500"/>  };
}

export default function Rental() {
  const [rentals, setRentals]       = useState([]);
  const [tenants, setTenants]       = useState([]);
  const [properties, setProperties] = useState([]);
  const [tab, setTab]   = useState('all');
  const [showSheet, setShowSheet] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm] = useState({ tenant_id:'', property_id:'', amount:'', month: new Date().getMonth()+1, year: new Date().getFullYear(), due_date:'', status:'unpaid', paid_date:'', notes:'' });

  async function load() {
    const today = new Date();
    let r = await getAll('rentals');
    for (const rec of r) {
      if (rec.status === 'unpaid' && rec.due_date && new Date(rec.due_date) < today) {
        await putRecord('rentals', { ...rec, status: 'overdue' });
      }
    }
    const [rr, t, p] = await Promise.all([getAll('rentals'), getAll('tenants'), getAll('properties')]);
    setRentals(rr); setTenants(t); setProperties(p);
  }
  useEffect(() => { load(); }, []);

  const filtered = tab === 'all' ? rentals : rentals.filter(r => r.status === tab);
  const total    = filtered.reduce((s,r) => s + Number(r.amount||0), 0);

  function openAdd() {
    setEditing(null);
    const now = new Date();
    setForm({ tenant_id:'', property_id:'', amount:'', month: now.getMonth()+1, year: now.getFullYear(), due_date:'', status:'unpaid', paid_date:'', notes:'' });
    setShowSheet(true);
  }

  function openEdit(r) {
    setEditing(r);
    setForm({ tenant_id:r.tenant_id||'', property_id:r.property_id||'', amount:r.amount||'', month:r.month, year:r.year, due_date:r.due_date||'', status:r.status, paid_date:r.paid_date||'', notes:r.notes||'' });
    setShowSheet(true);
  }

  async function save() {
    if (!form.tenant_id || !form.amount) { toast('Tenant and amount required', 'error'); return; }
    const tenant = tenants.find(t => t.id === Number(form.tenant_id));
    const prop   = properties.find(p => p.id === Number(form.property_id));
    const units  = await getAll('units');
    const unit   = units.find(u => u.id === tenant?.unit_id);
    const data = {
      ...form,
      tenant_id: Number(form.tenant_id),
      property_id: Number(form.property_id)||null,
      amount: Number(form.amount),
      month: Number(form.month),
      year: Number(form.year),
      tenant_name:   tenant?.name||'',
      property_name: prop?.name||'',
      unit_id:       tenant?.unit_id||null,
      unit_no:       unit?.unit_no||'',
      paid_date:     form.status==='paid' && !form.paid_date ? new Date().toISOString().split('T')[0] : form.paid_date,
      created_at: editing?.created_at || new Date().toISOString(),
    };
    if (editing) { await putRecord('rentals', { ...data, id: editing.id }); toast('Record updated'); }
    else          { await addRecord('rentals', data); toast('Rental record added'); }
    setShowSheet(false); load();
  }

  async function markPaid(r) {
    await putRecord('rentals', { ...r, status:'paid', paid_date: new Date().toISOString().split('T')[0] });
    toast('Marked as paid ✓'); load();
  }

  async function del(id) {
    if (!confirm('Delete record?')) return;
    await delRecord('rentals', id); toast('Deleted'); load();
  }

  function onTenantChange(tid) {
    const t = tenants.find(x => x.id === Number(tid));
    setForm(f => ({ ...f, tenant_id: tid, property_id: t?.property_id||'' }));
  }

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Rental Fees</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:opacity-80">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 mb-4 text-white">
        <div className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">
          {tab === 'all' ? 'Total' : tab.charAt(0).toUpperCase()+tab.slice(1)} Amount
        </div>
        <div className="text-2xl font-bold">{fmt(total)}</div>
        <div className="text-blue-200 text-xs mt-1">{filtered.length} record{filtered.length!==1?'s':''}</div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab===t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <DollarSign size={32} className="text-gray-300 mb-3" />
          <div className="text-gray-500 text-sm">No {tab === 'all' ? '' : tab} records</div>
        </div>
      ) : filtered.map(r => {
        const s = statusStyle(r.status);
        return (
          <div key={r.id} className={`bg-white border rounded-2xl mb-3 overflow-hidden ${s.bg}`}>
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-900 truncate">{r.tenant_name||'—'}</span>
                    <span className="text-base font-bold text-gray-900 flex-shrink-0">{fmt(r.amount)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.property_name||'—'} · Unit {r.unit_no||'—'}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>{r.status}</span>
                    <span className="text-xs text-gray-400">{MONTHS[(r.month||1)-1]} {r.year}</span>
                    <span className="text-xs text-gray-400">Due: {fmtDate(r.due_date)}</span>
                  </div>
                  {r.paid_date && <div className="text-xs text-emerald-600 mt-1">Paid on {fmtDate(r.paid_date)}</div>}
                </div>
              </div>
            </div>
            <div className="flex border-t border-black/5">
              {r.status !== 'paid' && (
                <>
                  <button onClick={() => markPaid(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-emerald-600 active:bg-emerald-50">
                    <CheckCircle2 size={13} /> Mark Paid
                  </button>
                  <div className="w-px bg-black/5" />
                </>
              )}
              <button onClick={() => openEdit(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-500 active:bg-gray-50">
                <Pencil size={13} /> Edit
              </button>
              <div className="w-px bg-black/5" />
              <button onClick={() => del(r.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-400 active:bg-red-50">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        );
      })}

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)} title={editing ? 'Edit Rental Record' : 'Add Rental Record'}>
        <Field label="Tenant *">
          <Select value={form.tenant_id} onChange={e=>onTenantChange(e.target.value)}>
            <option value="">Select tenant</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
        <Field label="Property">
          <Select value={form.property_id} onChange={e=>setForm({...form,property_id:e.target.value})}>
            <option value="">Select property</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Amount (RM) *">
          <Input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="1500.00" step="0.01" />
        </Field>
        <Row>
          <Field label="Month">
            <Select value={form.month} onChange={e=>setForm({...form,month:e.target.value})}>
              {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Year">
            <Input type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} placeholder="2026" />
          </Field>
        </Row>
        <Row>
          <Field label="Due Date"><Input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </Select>
          </Field>
        </Row>
        {form.status === 'paid' && (
          <Field label="Paid Date"><Input type="date" value={form.paid_date} onChange={e=>setForm({...form,paid_date:e.target.value})} /></Field>
        )}
        <Field label="Notes">
          <Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="e.g. Cheque no, late fee..." />
        </Field>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setShowSheet(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
          <button onClick={save} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:opacity-80">Save</button>
        </div>
      </BottomSheet>
    </div>
  );
}
