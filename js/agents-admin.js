/* ====== Agents Management Logic for Support Dashboard ====== */
'use strict';

async function loadAgents() {
  const supabase = await window.SupabaseAPI.initSupabase();
  const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
  
  if (error) throw error;
  
  const grid = document.getElementById('agents-grid');
  if (!grid) return;
  
  grid.innerHTML = data.map(agent => `
    <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-500/20 transition group">
      <div class="flex items-start justify-between mb-4">
        <div class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-500 text-xl">
          <i class="fa-solid fa-${getCategoryIcon(agent.category)}"></i>
        </div>
        <div class="flex gap-1">
          <button onclick="editAgent(${agent.id})" class="w-8 h-8 rounded-lg bg-white shadow-sm text-slate-400 hover:text-brand-500 flex items-center justify-center transition"><i class="fa-solid fa-pen text-[10px]"></i></button>
          <button onclick="deleteAgent(${agent.id})" class="w-8 h-8 rounded-lg bg-white shadow-sm text-slate-400 hover:text-red-500 flex items-center justify-center transition"><i class="fa-solid fa-trash text-[10px]"></i></button>
        </div>
      </div>
      <h4 class="font-bold text-sm mb-1">${agent.name}</h4>
      <p class="text-[10px] text-slate-500 line-clamp-2 mb-3">${agent.description || 'لا يوجد وصف'}</p>
      <div class="flex items-center justify-between">
        <span class="text-xs font-black text-brand-600">${agent.price} ر.س</span>
        <span class="badge ${agent.is_published ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}">
          ${agent.is_published ? 'منشور' : 'مسودة'}
        </span>
      </div>
    </div>
  `).join('');
  
  renderAgentsChart(data);
}

function getCategoryIcon(cat) {
  const icons = { whatsapp: 'whatsapp', booking: 'calendar-check', sales: 'comments-dollar', voice: 'microphone' };
  return icons[cat] || 'robot';
}

function renderAgentsChart(agents) {
  const ctx = document.getElementById('agents-chart');
  if (!ctx) return;
  
  // Group by category
  const categories = agents.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});
  
  if (window.agentsChartInstance) window.agentsChartInstance.destroy();
  
  window.agentsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
        borderWidth: 0
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom', labels: { font: { family: 'Tajawal', size: 10 } } } },
      cutout: '70%'
    }
  });
}

window.editAgent = async (id) => {
  toast('جاري تحميل بيانات الوكيل...', 'info');
  // Implementation for modal edit
};

window.deleteAgent = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا الوكيل؟')) return;
  try {
    const supabase = await window.SupabaseAPI.initSupabase();
    const { error } = await supabase.from('agents').delete().eq('id', id);
    if (error) throw error;
    toast('✅ تم حذف الوكيل بنجاح');
    loadAgents();
  } catch (err) {
    toast('⚠️ فشل الحذف', 'error');
  }
};
