import { useEffect, useState } from 'react';
import { getAll, addRecord, putRecord, delRecord } from '../db';
import { Users, Plus, Pencil, Trash2, Phone, CreditCard } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
import { Field, Input, Select, Textarea, Row } from '../components/Field';
import { toast } from '../components/Toast';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
        <Users size={32} className="text-purple-400" />
      </div>
      <div className="text-gray-700 font-semibold mb-1">No tenants yet</div>
      <div className="text-gray-400 text-sm">Tap + to add your first tenant</div>
    </div>
  );
}

export default function Tenants() {
  const [tenants, setTenants]     = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits]           = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [showSheet, setShowSheet]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm] = useState({ name:'', contact:'', ic_no:'', property_id:'', unit_id:'', move_in:'', move_out:'', deposit:'', notes:'' });

  async function load() {
    const [t, p, u] = await Promise.all([getAll('tenants'), getAll('properties'), getAll('units')]);
    setTenants(t); setProperties(p); setUnits(u);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (form.property_id) setFilteredUnits(units.filter(u => u.property_id === Number(form.property_id)));
    else setFilteredUnits(units);
  }, [form.property_id, units]);

  function openAdd() {
    setEditing(null);
    setForm({ name:'', contact:'', ic_no:'', property_id:'', unit_id:'', move_in:'', move_out:'', deposit:'', notes:'' });
    setShowSheet(true);
  }

  function openEdit(t) {
    setEditing(t);
    setForm({ name:t.name, contact:t.contact||'', ic_no:t.ic_no||'', property_id:t.property_id||'', unit_id:t.unit_id||'', move_in:t.move_in||'', move_out:t.move_out||'', deposit:t.deposit||'', notes:t.notes||'' });
    setShowSheet(true);
  }

  async function save() {
    if (!form.name.trim()) { toast('Name required', 'error'); return; }
    const prop  = properties.find(p => p.id === Number(form.property_id));
    const unit  = units.find(u => u.id === Number(form.unit_id));
    const data = {
      ...form,
      property_id:   Number(form.property_id) || null,
      unit_id:       Number(form.unit_id) || null,
      property_name: prop?.name || '',
      unit_no:       unit?.unit_no || '',
      created_at:    editing?.created_at || new Date().toISOString(),
    };
    if (editing) {
      await putRecord('tenants', { ...data, id: editing.id });
      toast('Tenant updated');
    } else {
      await addRecord('tenants', data);
      if (unit) { await putRecord('units', { ...unit, status: 'occupied' }); }
      toast('Tenant added');
    }
    setShowSheet(false); load();
  }

  async function del(id) {
    if (!confirm('Delete tenant?')) return;
    await delRecord('tenants', id);
    toast('Deleted'); load();
  }

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Tenants</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:opacity-80">
          <Plus size={16} /> Add
        </button>
      </div>

      {tenants.length === 0 ? <EmptyState /> : tenants.map(t => {
        const isActive = !t.move_out || new Date(t.move_out) >= new Date();
        return (
          <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold text-purple-500">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{t.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? 'Active' : 'Past'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.property_name||'—'} · Unit {t.unit_no||'—'}</div>
                  {t.contact && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                      <Phone size={11} /> {t.contact}
                    </div>
                  )}
                  {t.ic_no && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                      <CreditCard size={11} /> {t.ic_no}
                    </div>
                  )}
                  {t.move_in && <div className="text-xs text-gray-400 mt-1">Since {new Date(t.move_in).toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'})}</div>}
                  {t.deposit && <div className="text-xs text-amber-600 font-medium mt-0.5">Deposit: RM {Number(t.deposit).toLocaleString()}</div>}
                </div>
              </div>
            </div>
            <div className="flex border-t border-gray-50">
              <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-500 active:bg-gray-50">
                <Pencil size={13} /> Edit
              </button>
              <div className="w-px bg-gray-50" />
              <button onClick={() => del(t.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-400 active:bg-red-50">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        );
      })}

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)} title={editing ? 'Edit Tenant' : 'Add Tenant'}>
        <Field label="Full Name *">
          <Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Tenant full name" />
        </Field>
        <Row>
          <Field label="Contact No.">
            <Input type="tel" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} placeholder="01X-XXXXXXX" />
          </Field>
          <Field label="IC / Reg No.">
            <Input value={form.ic_no} onChange={e=>setForm({...form,ic_no:e.target.value})} placeholder="XXXXXX-XX-XXXX" />
          </Field>
        </Row>
        <Field label="Property">
          <Select value={form.property_id} onChange={e=>setForm({...form,property_id:e.target.value,unit_id:''})}>
            <option value="">Select property</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Unit">
          <Select value={form.unit_id} onChange={e=>setForm({...form,unit_id:e.target.value})}>
            <option value="">Select unit</option>
            {filteredUnits.map(u => <option key={u.id} value={u.id}>Unit {u.unit_no} ({u.status})</option>)}
          </Select>
        </Field>
        <Row>
          <Field label="Move-In"><Input type="date" value={form.move_in} onChange={e=>setForm({...form,move_in:e.target.value})} /></Field>
          <Field label="Move-Out"><Input type="date" value={form.move_out} onChange={e=>setForm({...form,move_out:e.target.value})} /></Field>
        </Row>
        <Field label="Security Deposit (RM)">
          <Input type="number" value={form.deposit} onChange={e=>setForm({...form,deposit:e.target.value})} placeholder="3000" />
        </Field>
        <Field label="Notes">
          <Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional..." />
        </Field>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setShowSheet(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
          <button onClick={save} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:opacity-80">Save</button>
        </div>
      </BottomSheet>
    </div>
  );
}
