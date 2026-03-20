function showModal(contentHtml) {
    let container = document.getElementById('modal-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'modal-container';
        // Remove heavy blur and use simple dark background
        container.className = 'fixed inset-0 bg-slate-900/60 z-50 hidden flex items-center justify-center p-4 transition-opacity duration-200';
        container.innerHTML = `<div class="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all duration-200 ease-out scale-95 opacity-0" id="modal-content"></div>`;
        document.body.appendChild(container);
    }
    
    const content = document.getElementById('modal-content');
    content.innerHTML = contentHtml;
    container.classList.remove('hidden');
    
    // Quick, lightweight entrance
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
    lucide.createIcons();
}

function closeModal() {
    const container = document.getElementById('modal-container');
    const content = document.getElementById('modal-content');
    if (content) {
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            container.classList.add('hidden');
        }, 200);
    }
}

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-2xl shadow-2xl z-50 animate-bounce flex items-center gap-3 border ${
        type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
    }`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i> 
        <span class="font-bold">${msg}</span>
    `;
    document.body.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function getStatusBadge(status) {
    const s = (status || '').toUpperCase();
    let config = { text: 'ไม่ระบุ', classes: 'bg-slate-100 text-slate-500' };
    
    if (s === 'PENDING') config = { text: 'รอดำเนินการ', classes: 'bg-amber-100 text-amber-700' };
    else if (s === 'COMPLETED') config = { text: 'เสร็จสิ้น', classes: 'bg-emerald-100 text-emerald-700' };
    else if (s === 'CANCELLED') config = { text: 'ยกเลิก', classes: 'bg-rose-100 text-rose-700' };
    
    return `<span class="px-3 py-1 text-xs font-bold rounded-full ${config.classes}">${config.text}</span>`;
}
