import { useEffect, useState } from 'react';
import { getAll } from '../db';
import { Building2, Users, DoorOpen, TrendingUp, AlertCircle, Wrench, CheckCircle2, Clock } from 'lucide-react';

const fmt = n => 'RM ' + Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-MY',{day:'2-digit',month:'short'}) : '—';

function StatCard({ icon: Icon, label, value, color, sub }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   val: 'text-blue-700'   },
    green:  { bg: 'bg-emerald-50',icon: 'text-emerald-500',val: 'text-emerald-700'},
    orange: { bg: 'bg-amber-50',  icon: 'text-amber-500',  val: 'text-amber-700'  },
    red:    { bg: 'bg-red-50',    icon: 'text-red-500',    val: 'text-red-700'    },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', val: 'text-purple-700' },
    gray:   { bg: 'bg-gray-50',   icon: 'text-gray-500',   val: 'text-gray-700'   },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={18} className={c.icon} />
      </div>
      <div className={`text-xl font-bold ${c.val}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const [props, units, tenants, rentals, jobs] = await Promise.all([
        getAll('properties'), getAll('units'), getAll('tenants'),
        getAll('rentals'), getAll('jobs')
      ]);

      const today = new Date();
      const updatedRentals = await Promise.all(rentals.map(async r => {
        if (r.status === 'unpaid' && r.due_date && new Date(r.due_date) < today) {
          const { putRecord } = await import('../db');
          const u = { ...r, status: 'overdue' };
          await putRecord('rentals', u);
          return u;
        }
        return r;
      }));

      const totalRent    = updatedRentals.reduce((s,r)=>s+Number(r.amount||0),0);
      const paidRent     = updatedRentals.filter(r=>r.status==='paid').reduce((s,r)=>s+Number(r.amount||0),0);
      const overdueRent  = updatedRentals.filter(r=>r.status==='overdue').reduce((s,r)=>s+Number(r.amount||0),0);
      const totalJobs    = jobs.reduce((s,j)=>s+Number(j.cost||0),0);
      const occupied     = units.filter(u=>u.status==='occupied').length;
      const occupancy    = units.length ? Math.round(occupied/units.length*100) : 0;

      // Activity feed
      const activity = [
        ...updatedRentals.slice(-4).map(r => ({
          type: r.status,
          text: `${r.tenant_name||'Tenant'} — ${r.month}/${r.year}`,
          sub:  fmt(r.amount),
          date: r.paid_date || r.due_date,
          icon: r.status==='paid' ? 'paid' : r.status==='overdue' ? 'overdue' : 'unpaid',
        })),
        ...jobs.slice(-3).map(j => ({
          type: 'job',
          text: `${j.job_type} — ${j.property_name||'Property'}`,
          sub:  fmt(j.cost),
          date: j.date,
          icon: 'job',
        })),
      ].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,6);

      setData({ props, units, tenants, rentals: updatedRentals, jobs, totalRent, paidRent, overdueRent, totalJobs, occupied, occupancy, activity });
    }
    load();
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>;

  const activityIcon = {
    paid:    <CheckCircle2 size={16} className="text-emerald-500" />,
    overdue: <AlertCircle  size={16} className="text-red-500"     />,
    unpaid:  <Clock        size={16} className="text-amber-500"   />,
    job:     <Wrench       size={16} className="text-blue-500"    />,
  };

  return (
    <div className="page-enter pb-4">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-6 pb-10 -mx-4 -mt-4 mb-4">
        <div className="text-blue-100 text-sm font-medium mb-1">Good day 👋</div>
        <div className="text-white text-2xl font-bold mb-1">Property Manager</div>
        <div className="text-blue-200 text-sm">{new Date().toLocaleDateString('en-MY',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
        <div className="mt-5 bg-white/10 rounded-2xl p-4">
          <div className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">Total Rent Collected</div>
          <div className="text-white text-3xl font-bold">{fmt(data.paidRent)}</div>
          <div className="text-blue-200 text-sm mt-1">Outstanding: {fmt(data.totalRent - data.paidRent)}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard icon={Building2}   label="Properties"       value={data.props.length}   color="blue"   />
        <StatCard icon={DoorOpen}    label="Total Units"      value={data.units.length}   color="purple" />
        <StatCard icon={Users}       label="Active Tenants"   value={data.tenants.length} color="green"  />
        <StatCard icon={TrendingUp}  label="Occupancy"        value={data.occupancy+'%'}  color={data.occupancy>=80?'green':'orange'} />
      </div>

      {/* Occupancy bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Occupancy Rate</span>
          <span className="text-sm font-bold text-blue-600">{data.occupied}/{data.units.length} units</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700" style={{width: data.occupancy+'%'}} />
        </div>
      </div>

      {/* Finance cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard icon={AlertCircle} label="Overdue Rent"     value={fmt(data.overdueRent)} color="red"    />
        <StatCard icon={Wrench}      label="Construction Cost" value={fmt(data.totalJobs)}  color="gray"   />
      </div>

      {/* Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
        </div>
        {data.activity.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">No activity yet</div>
        ) : data.activity.map((a,i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < data.activity.length-1 ? 'border-b border-gray-50' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
              {activityIcon[a.icon]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{a.text}</div>
              <div className="text-xs text-gray-400">{a.sub}</div>
            </div>
            <div className="text-xs text-gray-400 flex-shrink-0">{fmtDate(a.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
