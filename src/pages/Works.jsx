import { useEffect, useState } from 'react';
import { getAll, addRecord, putRecord, delRecord } from '../db';
import { Wrench, Plus, CheckCircle2, Pencil, Trash2, Clock, Zap } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
import { Field, Input, Select, Textarea, Row } from '../components/Field';
import { toast } from '../components/Toast';

const fmt = n => 'RM ' + Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'}) : '—';

const STATUS_TABS = ['all','pending','in_progress','completed'];
const STATUS_LABELS = { all:'All', pending:'Pending', in_progress:'Active', completed:'Done' };

function statusStyle(s) {
  if (s === 'completed')  return { bg:'bg-emerald-50 border-emerald-200', badge:'bg-emerald-100 text-emerald-700', icon:<CheckCircle2 size={14} className="text-emerald-500"/> };
  if (s === 'in_progress')return { bg:'bg-blue-50 border-blue-200',       badge:'bg-blue-100 text-blue-700',       icon:<Zap         size={14} className="text-blue-500"/>     };
  return                         { bg:'bg-amber-50 border-amber-200',      badge:'bg-amber-100 text-amber-700',     icon:<Clock       size={14} className="text-amber-500"/>    };
}

const JOB_SUGGESTIONS = ['Renovation','Plumbing Repair','Electrical Work','Painting','Air-con Service','Roofing','Flooring','General Maintenance','Pest Control','Waterproofing'];

export default function Works() {
  const [jobs, setJobs]             = useState([]);
  const [properties, setProperties] = useState([]);
  const [propUnits, setPropUnits]   = useState([]);
  const [tab, setTab]     = useState('all');
  const [showSheet, setShowSheet] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm] = useState({ job_type:'', property_id:'', unit_id:'', contractor:'', cost:'', date:'', status:'pending', description:'' });

  async function load() {
    const [j, p] = await Promise.all([getAll('jobs'), getAll('properties')]);
    setJobs(j); setProperties(p);
  }
  useEffect(() => { load(); }, []);

  async function onPropertyChange(pid) {
    setForm(f => ({ ...f, property_id: pid, unit_id:'' }));
    if (pid) { const u = await getAll('units'); setPropUnits(u.filter(x => x.property_id === Number(pid))); }
    else setPropUnits([]);
  }

  function openAdd() {
    setEditing(null);
    setForm({ job_type:'', property_id:'', unit_id:'', contractor:'', cost:'', date: new Date().toISOString().split('T')[0], status:'pending', description:'' });
    setPropUnits([]);
    setShowSheet(true);
  }

  async function openEdit(j) {
    setEditing(j);
    setForm({ job_type:j.job_type, property_id:j.property_id||'', unit_id:j.unit_id||'', contractor:j.contractor||'', cost:j.cost||'', date:j.date||'', status:j.status, description:j.description||'' });
    if (j.property_id) { const u = await getAll('units'); setPropUnits(u.filter(x => x.property_id === j.property_id)); }
    setShowSheet(true);
  }

  async function save() {
    if (!form.job_type.trim() || !form.property_id) { toast('Job type and property required', 'error'); return; }
    const prop = properties.find(p => p.id === Number(form.property_id));
    const units = await getAll('units');
    const unit  = units.find(u => u.id === Number(form.unit_id));
    const data = {
      ...form,
      property_id:   Number(form.property_id),
      unit_id:       Number(form.unit_id)||null,
      cost:          Number(form.cost)||0,
      property_name: prop?.name||'',
      unit_no:       unit?.unit_no||'',
      created_at:    editing?.created_at || new Date().toISOString(),
    };
    if (editing) { await putRecord('jobs', { ...data, id: editing.id }); toast('Job updated'); }
    else          { await addRecord('jobs', data); toast('Job added'); }
    setShowSheet(false); load();
  }

  async function markDone(j) {
    await putRecord('jobs', { ...j, status:'completed' });
    toast('Marked as completed ✓'); load();
  }

  async function del(id) {
    if (!confirm('Delete job?')) return;
    await delRecord('jobs', id); toast('Deleted'); load();
  }

  const filtered = (tab === 'all' ? jobs : jobs.filter(j => j.status === tab))
    .slice()
    .sort((a, b) => (a.job_type || '').localeCompare(b.job_type || '', undefined, { sensitivity: 'base' }));
  const totalCost = filtered.reduce((s,j) => s+Number(j.cost||0), 0);

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Works & Maintenance</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:opacity-80">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 mb-4 text-white">
        <div className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1">
          {tab === 'all' ? 'Total' : STATUS_LABELS[tab]} Cost
        </div>
        <div className="text-2xl font-bold">{fmt(totalCost)}</div>
        <div className="text-slate-400 text-xs mt-1">{filtered.length} job{filtered.length!==1?'s':''}</div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab===t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
            {STATUS_LABELS[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wrench size={32} className="text-gray-300 mb-3" />
          <div className="text-gray-500 text-sm">No {tab === 'all' ? '' : STATUS_LABELS[tab].toLowerCase()} jobs</div>
        </div>
      ) : filtered.map(j => {
        const s = statusStyle(j.status);
        return (
          <div key={j.id} className={`bg-white border rounded-2xl mb-3 overflow-hidden ${s.bg}`}>
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-900 truncate">{j.job_type}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.badge}`}>{STATUS_LABELS[j.status]||j.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{j.property_name||'—'}{j.unit_no ? ' · Unit '+j.unit_no : ''}</div>

                  {/* Contractor & Amount columns */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-black/[0.03] rounded-lg px-3 py-2">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contractor / 师傅</div>
                      <div className="text-sm font-semibold text-gray-800 truncate mt-0.5">{j.contractor || '—'}</div>
                    </div>
                    <div className="bg-black/[0.03] rounded-lg px-3 py-2">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Amount / 金额</div>
                      <div className="text-sm font-bold text-gray-900 mt-0.5">{fmt(j.cost)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">{fmtDate(j.date)}</span>
                  </div>
                  {j.description && <div className="text-xs text-gray-500 mt-2 bg-black/[0.03] rounded-lg px-2 py-1.5">{j.description}</div>}
                </div>
              </div>
            </div>
            <div className="flex border-t border-black/5">
              {j.status !== 'completed' && (
                <>
                  <button onClick={() => markDone(j)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-emerald-600 active:bg-emerald-50">
                    <CheckCircle2 size={13} /> Done
                  </button>
                  <div className="w-px bg-black/5" />
                </>
              )}
              <button onClick={() => openEdit(j)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-500 active:bg-gray-50">
                <Pencil size={13} /> Edit
              </button>
              <div className="w-px bg-black/5" />
              <button onClick={() => del(j.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-400 active:bg-red-50">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        );
      })}

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)} title={editing ? 'Edit Job' : 'Add Job'}>
        <Field label="Job Type *">
          <Input list="job-suggestions" value={form.job_type} onChange={e=>setForm({...form,job_type:e.target.value})} placeholder="e.g. Plumbing Repair" />
          <datalist id="job-suggestions">{JOB_SUGGESTIONS.map(s=><option key={s} value={s}/>)}</datalist>
        </Field>
        <Field label="Property *">
          <Select value={form.property_id} onChange={e=>onPropertyChange(e.target.value)}>
            <option value="">Select property</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Unit (optional)">
          <Select value={form.unit_id} onChange={e=>setForm({...form,unit_id:e.target.value})}>
            <option value="">Select unit</option>
            {propUnits.map(u => <option key={u.id} value={u.id}>Unit {u.unit_no}</option>)}
          </Select>
        </Field>
        <Field label="Contractor / Vendor (承包商/师傅)">
          <Input value={form.contractor} onChange={e=>setForm({...form,contractor:e.target.value})} placeholder="Contractor / 师傅姓名" />
        </Field>
        <Row>
          <Field label="Cost (RM) / 金额"><Input type="number" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0.00" step="0.01" /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></Field>
        </Row>
        <Field label="Status">
          <Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Details about the work..." />
        </Field>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setShowSheet(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
          <button onClick={save} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:opacity-80">Save</button>
        </div>
      </BottomSheet>
    </div>
  );
}
