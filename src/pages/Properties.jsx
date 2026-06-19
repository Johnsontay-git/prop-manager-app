import { useEffect, useState } from 'react';
import { getAll, getByIdx, addRecord, putRecord, delRecord } from '../db';
import { Building2, Plus, ChevronRight, Pencil, Trash2, DoorOpen } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
import { Field, Input, Select, Textarea, Row } from '../components/Field';
import { toast } from '../components/Toast';

const TYPES = ['Residential','Commercial','Industrial','Mixed'];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
        <Building2 size={32} className="text-blue-400" />
      </div>
      <div className="text-gray-700 font-semibold mb-1">No properties yet</div>
      <div className="text-gray-400 text-sm">Tap + to add your first property</div>
    </div>
  );
}

function UnitItem({ unit, onEdit, onDelete }) {
  const statusColor = unit.status === 'occupied' ? 'bg-emerald-100 text-emerald-700'
    : unit.status === 'maintenance' ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-100 text-gray-500';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <DoorOpen size={14} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">Unit {unit.unit_no}</div>
        <div className="text-xs text-gray-400">Floor {unit.floor||'—'} · {unit.floor_area||'—'} sqft · RM {Number(unit.rental_rate||0).toLocaleString()}/mo</div>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{unit.status}</span>
      <button onClick={() => onEdit(unit)} className="p-1.5 text-gray-400 hover:text-blue-500"><Pencil size={13} /></button>
      <button onClick={() => onDelete(unit.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
    </div>
  );
}

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [showPropSheet, setShowPropSheet] = useState(false);
  const [showUnitSheet, setShowUnitSheet] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [detailProp, setDetailProp] = useState(null);
  const [detailUnits, setDetailUnits] = useState([]);
  const [form, setForm] = useState({ name:'', address:'', type:'Residential', notes:'' });
  const [unitForm, setUnitForm] = useState({ unit_no:'', floor:'', floor_area:'', rental_rate:'', status:'vacant' });

  async function load() {
    const [p, u] = await Promise.all([getAll('properties'), getAll('units')]);
    setProperties(p); setUnits(u);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ name:'', address:'', type:'Residential', notes:'' }); setShowPropSheet(true); }
  function openEdit(p) { setEditing(p); setForm({ name:p.name, address:p.address||'', type:p.type||'Residential', notes:p.notes||'' }); setShowPropSheet(true); }

  async function saveProp() {
    if (!form.name.trim()) { toast('Property name required', 'error'); return; }
    const data = { ...form, created_at: editing?.created_at || new Date().toISOString() };
    if (editing) { await putRecord('properties', { ...data, id: editing.id }); toast('Property updated'); }
    else          { await addRecord('properties', data); toast('Property added'); }
    setShowPropSheet(false); load();
  }

  async function deleteProp(id) {
    if (!confirm('Delete this property?')) return;
    await delRecord('properties', id);
    toast('Deleted'); load();
  }

  async function openDetail(p) {
    setDetailProp(p);
    const u = await getByIdx('units', 'property_id', p.id);
    setDetailUnits(u);
    setShowDetail(true);
  }

  function openAddUnit() { setEditingUnit(null); setUnitForm({ unit_no:'', floor:'', floor_area:'', rental_rate:'', status:'vacant' }); setShowUnitSheet(true); }
  function openEditUnit(u) { setEditingUnit(u); setUnitForm({ unit_no:u.unit_no, floor:u.floor||'', floor_area:u.floor_area||'', rental_rate:u.rental_rate||'', status:u.status||'vacant' }); setShowUnitSheet(true); }

  async function saveUnit() {
    if (!unitForm.unit_no.trim()) { toast('Unit number required', 'error'); return; }
    const data = { ...unitForm, property_id: detailProp.id, property_name: detailProp.name, created_at: editingUnit?.created_at || new Date().toISOString() };
    if (editingUnit) { await putRecord('units', { ...data, id: editingUnit.id }); toast('Unit updated'); }
    else              { await addRecord('units', data); toast('Unit added'); }
    setShowUnitSheet(false);
    const u = await getByIdx('units', 'property_id', detailProp.id);
    setDetailUnits(u); load();
  }

  async function deleteUnit(id) {
    if (!confirm('Delete unit?')) return;
    await delRecord('units', id);
    const u = await getByIdx('units', 'property_id', detailProp.id);
    setDetailUnits(u); load(); toast('Unit deleted');
  }

  const propUnits = id => units.filter(u => u.property_id === id);

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Properties</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:opacity-80">
          <Plus size={16} /> Add
        </button>
      </div>

      {properties.length === 0 ? <EmptyState /> : properties.map(p => {
        const pu = propUnits(p.id);
        const occ = pu.filter(u => u.status === 'occupied').length;
        return (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
            <button className="w-full text-left px-4 pt-4 pb-3" onClick={() => openDetail(p)}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-base">{p.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.address||'No address'} · {p.type||'Residential'}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{width: pu.length ? occ/pu.length*100+'%' : '0%'}} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{occ}/{pu.length} occupied</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 mt-1 flex-shrink-0" />
              </div>
            </button>
            <div className="flex border-t border-gray-50">
              <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-500 active:bg-gray-50">
                <Pencil size={13} /> Edit
              </button>
              <div className="w-px bg-gray-50" />
              <button onClick={() => deleteProp(p.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-400 active:bg-red-50">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        );
      })}

      {/* Add/Edit Property Sheet */}
      <BottomSheet open={showPropSheet} onClose={() => setShowPropSheet(false)} title={editing ? 'Edit Property' : 'Add Property'}>
        <Field label="Property Name *">
          <Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Taman Jaya Block A" />
        </Field>
        <Field label="Address">
          <Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Full address" />
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Notes">
          <Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes..." />
        </Field>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setShowPropSheet(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 active:bg-gray-50">Cancel</button>
          <button onClick={saveProp} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:opacity-80 shadow-sm">Save</button>
        </div>
      </BottomSheet>

      {/* Property Detail Sheet */}
      <BottomSheet open={showDetail} onClose={() => setShowDetail(false)} title={detailProp?.name || ''}>
        <div className="text-xs text-gray-400 mb-4">{detailProp?.address||'No address'} · {detailProp?.type}</div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-900">Units</span>
          <button onClick={openAddUnit} className="flex items-center gap-1 text-blue-600 text-xs font-semibold">
            <Plus size={13} /> Add Unit
          </button>
        </div>
        <div className="bg-gray-50 rounded-xl px-3">
          {detailUnits.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-sm">No units yet</div>
          ) : detailUnits.map(u => (
            <UnitItem key={u.id} unit={u} onEdit={openEditUnit} onDelete={deleteUnit} />
          ))}
        </div>
        <button onClick={() => setShowDetail(false)} className="w-full mt-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Close</button>
      </BottomSheet>

      {/* Add/Edit Unit Sheet */}
      <BottomSheet open={showUnitSheet} onClose={() => setShowUnitSheet(false)} title={editingUnit ? 'Edit Unit' : 'Add Unit'}>
        <Row>
          <Field label="Unit No. *"><Input value={unitForm.unit_no} onChange={e=>setUnitForm({...unitForm,unit_no:e.target.value})} placeholder="A-01" /></Field>
          <Field label="Floor"><Input value={unitForm.floor} onChange={e=>setUnitForm({...unitForm,floor:e.target.value})} placeholder="3" /></Field>
        </Row>
        <Row>
          <Field label="Area (sqft)"><Input type="number" value={unitForm.floor_area} onChange={e=>setUnitForm({...unitForm,floor_area:e.target.value})} placeholder="800" /></Field>
          <Field label="Rate (RM/mo)"><Input type="number" value={unitForm.rental_rate} onChange={e=>setUnitForm({...unitForm,rental_rate:e.target.value})} placeholder="1500" /></Field>
        </Row>
        <Field label="Status">
          <Select value={unitForm.status} onChange={e=>setUnitForm({...unitForm,status:e.target.value})}>
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Under Maintenance</option>
          </Select>
        </Field>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setShowUnitSheet(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
          <button onClick={saveUnit} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:opacity-80">Save</button>
        </div>
      </BottomSheet>
    </div>
  );
}
