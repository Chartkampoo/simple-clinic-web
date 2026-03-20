// --- 1. การจัดการสถานะ (STATE MANAGEMENT) ---
const state = {
    user: JSON.parse(localStorage.getItem('user')), // ข้อมูลคนไข้ที่ล็อกอินอยู่
    token: localStorage.getItem('token'), // รหัสยืนยันตัวตนสำหรับเรียก API
    view: 'overview' // หน้าจอที่แสดงผลอยู่ปัจจุบัน (overview, appointments, history, team)
};

const router = {
    switch(view) {
        state.view = view;
        render();
    }
};

// --- 2. ฟังก์ชันหลักสำหรับการสร้างหน้าจอ (MAIN RENDERER) ---
async function render() {
    const main = document.getElementById('content-area'); // พื้นที่หลักสำหรับใส่ข้อมูล
    main.innerHTML = '<div class="flex justify-center p-20 animate-pulse text-indigo-500 font-bold italic tracking-widest">กำลังซิงโครไนซ์สุขภาพของคุณ...</div>';
    
    try {
        // ตัดสินใจว่าจะแสดงหน้าไหนตามค่าใน state.view
        if (state.view === 'overview') await renderOverview(main);
        if (state.view === 'appointments') await renderAppointments(main);
        if (state.view === 'history') await renderHistory(main);
        if (state.view === 'team') await renderTeam(main);
    } catch (e) {
        // แสดงข้อความแจ้งเตือน Error เมื่อเกิดข้อผิดพลาดในการโหลดข้อมูล
        main.innerHTML = `
            <div class="animate-slide-up bg-rose-50 p-8 rounded-3xl text-rose-600 border border-rose-100 shadow-xl shadow-rose-50 flex items-center gap-4">
                <i data-lucide="alert-triangle" class="w-10 h-10"></i>
                <div class="flex-1">
                    <p class="font-bold text-xl mb-1">เกิดข้อผิดพลาด</p>
                    <p class="text-sm opacity-80">${e.message}</p>
                </div>
            </div>`;
    }
    lucide.createIcons(); // สั่งให้วาดไอคอนต่างๆ
}

async function renderOverview(container) {
    if (!state.user.patientProfileId) throw new Error('ไม่พบข้อมูลโปรไฟล์ผู้ป่วย กรุณาติดต่อเจ้าหน้าที่');
    
    const allApps = await api.appointments.getAll(state.token);
    const appsPending = allApps.filter(a => a.status === 'PENDING');
    const nextApp = appsPending[0]; // Next scheduled appointment
    const latestApp = allApps[allApps.length - 1]; // Most recently created appointment

    const patientData = await api.patients.getById(state.user.patientProfileId, state.token);

    container.innerHTML = `
        <div class="animate-slide-up">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Welcome Card -->
                <div class="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                    <i data-lucide="sparkles" class="absolute -top-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700"></i>
                    <h3 class="text-3xl font-bold mb-2">สวัสดีครับ, ${state.user.fullName} 👋</h3>
                    <p class="text-indigo-100 mb-8 opacity-80 tracking-wide font-medium uppercase text-xs">ขอเสนอภาพรวมสุขภาพของคุณในวันนี้</p>
                    
                    <div class="grid grid-cols-2 gap-4 mt-auto">
                        <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 border-indigo-100 hover:bg-white/20 transition-all">
                            <p class="text-[10px] font-bold uppercase opacity-80 mb-1">การนัดหมายถัดไป</p>
                            <p class="font-bold text-lg">${nextApp ? new Date(nextApp.appointmentDate).toLocaleDateString('th-TH') : 'ยังไม่มีนัด'}</p>
                        </div>
                        <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 border-indigo-100 hover:bg-white/20 transition-all">
                            <p class="text-[10px] font-bold uppercase opacity-80 mb-1">จำนวนประวัติ</p>
                            <p class="font-bold text-lg">${patientData.medicalRecords.length} รายการ</p>
                        </div>
                    </div>
                </div>

                <!-- Latest Appointment Info -->
                <div class="bg-white p-8 rounded-[32px] border border-slate-100 card-shadow">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="font-black text-slate-800 uppercase tracking-tighter text-xl italic">ข้อมูลนัดหมายล่าสุด</h3>
                        <div class="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                            <i data-lucide="bell" class="w-3 h-3"></i> อัปเดตล่าสุด
                        </div>
                    </div>
                    ${latestApp ? `
                        <div class="space-y-4">
                            <div class="flex gap-4">
                                <div class="w-1 h-auto bg-emerald-500 rounded-full"></div>
                                <div>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">นัดหมายพบแพทย์</p>
                                    <p class="font-bold text-slate-800 text-lg">นพ. ${latestApp.doctor?.fullName || 'ประจำคลินิก'}</p>
                                </div>
                            </div>
                            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div class="flex justify-between items-center mb-2">
                                    <p class="text-[10px] font-bold text-slate-400 uppercase">วันที่และเวลา</p>
                                    ${getStatusBadge(latestApp.status)}
                                </div>
                                <p class="text-slate-700 font-bold">${new Date(latestApp.appointmentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} | ${new Date(latestApp.appointmentDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                                <p class="text-xs text-slate-400 mt-2 italic">📌 เหตุผล: ${latestApp.reason || 'ตรวจสุขภาพทั่วไป'}</p>
                            </div>
                        </div>
                    ` : '<p class="text-center py-10 text-slate-400 italic">ยังไม่พบรายการนัดหมายในระบบ</p>'}
                </div>
            </div>

            <!-- Upcoming List -->
            <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <i data-lucide="calendar-check" class="w-5 h-5 text-indigo-500"></i>
                รายการคิวของคุณที่กำลังมาถึง
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                ${appsPending.slice(0, 3).map(app => `
                    <div class="bg-white p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all card-shadow">
                        <div class="flex justify-between items-start mb-4">
                            <div class="p-3 bg-indigo-50 rounded-2xl">
                                <i data-lucide="clock" class="w-6 h-6 text-indigo-600"></i>
                            </div>
                            ${getStatusBadge(app.status)}
                        </div>
                        <p class="text-xl font-bold text-slate-900 mb-1">${new Date(app.appointmentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}</p>
                        <p class="text-sm font-medium text-slate-500">${new Date(app.appointmentDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                        <div class="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <span class="text-xs text-slate-400">คุณหมอ: นพ. ${app.doctor?.fullName || 'ประจำคลินิก'}</span>
                            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                        </div>
                    </div>
                `).join('') || '<div class="col-span-full bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-medium">ไม่มีรายการนัดหมายใหม่</div>'}
            </div>
        </div>
    `;
}

async function renderAppointments(container) {
    const apps = await api.appointments.getAll(state.token);
    container.innerHTML = `
        <div class="animate-slide-up">
            <div class="flex justify-between items-center mb-8">
            <h3 class="text-3xl font-black text-slate-800 tracking-tighter italic">การนัดหมายของฉัน</h3>
            <button onclick="createAppointment()" class="btn-indigo text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100">
                <i data-lucide="plus-circle" class="w-5 h-5"></i>
                นัดหมายใหม่
            </button>
        </div>
        <div class="grid gap-4">
            ${apps.map(app => `
                <div class="bg-white p-6 rounded-[28px] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-all gap-4">
                    <div class="flex gap-6 items-center">
                        <div class="text-center bg-indigo-50 p-4 rounded-2xl min-w-[100px] border border-indigo-100">
                             <p class="text-sm font-black text-indigo-600">${new Date(app.appointmentDate).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</p>
                             <p class="text-[10px] font-bold text-indigo-400 uppercase">${new Date(app.appointmentDate).getHours().toString().padStart(2, '0')}:${new Date(app.appointmentDate).getMinutes().toString().padStart(2, '0')} น.</p>
                        </div>
                        <div>
                            <p class="font-black text-slate-800 text-lg">${app.reason || 'ตรวจทั่วไป'}</p>
                            <p class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
                                <i data-lucide="user" class="w-3 h-3"></i> คุณหมอ: ${app.doctor?.fullName || 'ประจำคลินิก'}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                        ${getStatusBadge(app.status)}
                        <div class="relative dropdown-container">
                            <button onclick="toggleDropdown(event, 'drop-${app.id}')" class="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                                <i data-lucide="more-horizontal" class="w-5 h-5"></i>
                            </button>
                            <div id="drop-${app.id}" class="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 hidden animate-slide-up origin-top-right dropdown-menu">
                                <div class="p-2">
                                    <button onclick="cancelAppointment(${app.id})" class="w-full text-left px-4 py-3 text-rose-600 font-bold hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        ยกเลิกการนัดหมาย
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('') || '<p class="p-20 text-center text-slate-400 italic bg-white rounded-3xl">ยังไม่พบประวัติการนัดหมาย</p>'}
        </div>
    `;
    lucide.createIcons();
}

window.toggleDropdown = (e, id) => {
    e.stopPropagation();
    const all = document.querySelectorAll('.dropdown-menu');
    all.forEach(d => {
        if (d.id !== id) d.classList.add('hidden');
    });
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
};

// Global click to close dropdowns
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-container')) {
        document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.add('hidden'));
    }
});

window.cancelAppointment = async (id) => {
    if(!confirm('คุณแน่ใจว่าต้องการยกเลิกการนัดหมายนี้หรือไม่?')) return;
    
    try {
        await api.appointments.delete(id, state.token);
        showToast('ยกเลิกการนัดหมายเรียบร้อยแล้ว');
        render();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.createAppointment = async () => {
    try {
        const doctors = await api.auth.getDoctors(state.token);
        
        showModal(`
            <div class="p-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-2xl font-black text-slate-900 tracking-tighter italic">นัดหมายแพทย์ล่วงหน้า</h3>
                        <p class="text-slate-500 text-sm">เลือกวันและเวลาที่คุณสะดวกเพื่อเข้ารับการตรวจ</p>
                    </div>
                    <button onclick="closeModal()" class="p-2 hover:bg-slate-100 rounded-xl transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
                </div>
                
                <form id="appointment-form" class="space-y-5">
                    <div class="space-y-2">
                        <label class="block text-sm font-black text-slate-700 uppercase tracking-widest">เลือกแพทย์</label>
                        <select id="app-doctor" required class="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                            <option value="">-- เลือกแพทย์ของคุณ --</option>
                            ${doctors.map(d => `<option value="${d.id}">นพ. ${d.fullName}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="block text-sm font-black text-slate-700 uppercase tracking-widest">วันและเวลานัดหมาย</label>
                        <input type="datetime-local" id="app-date" required class="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                    </div>
                    
                    <div class="space-y-2">
                        <label class="block text-sm font-black text-slate-700 uppercase tracking-widest">อาการเบื้องต้น / เหตุผลที่นัดหมาย</label>
                        <textarea id="app-reason" placeholder="เช่น ปวดศีรษะ, เจ็บคอ, ขอนัดพบแพทย์ประจำตัว..." class="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" rows="3"></textarea>
                    </div>
                    
                    <button type="submit" class="w-full btn-indigo text-white py-4 rounded-2xl font-black text-lg mt-4 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2">
                        <i data-lucide="check-circle" class="w-5 h-5"></i>
                        ยืนยันการนัดหมาย
                    </button>
                </form>
            </div>
        `);
        
        document.getElementById('appointment-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            try {
                btn.disabled = true;
                btn.innerHTML = '<span class="animate-spin">🌀</span> กำลังดำเนินการ...';
                
                const appDate = new Date(document.getElementById('app-date').value);
                if (appDate < new Date()) {
                    showToast('ไมสามารถนัดหมายเวลาในอดีตได้ กรุณาเลือกเวลาที่ถูกต้อง', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> ยืนยันการนัดหมาย';
                    lucide.createIcons();
                    return;
                }

                const data = {
                    patientId: state.user.patientProfileId,
                    doctorId: parseInt(document.getElementById('app-doctor').value),
                    appointmentDate: appDate.toISOString(),
                    reason: document.getElementById('app-reason').value
                };
                
                await api.appointments.create(data, state.token);
                showToast('ส่งคำขอนัดหมายเรียบร้อยแล้วครับ!');
                closeModal();
                router.switch('appointments');
            } catch (err) {
                showToast(err.message, 'error');
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> ยืนยันการนัดหมาย';
                lucide.createIcons();
            }
        };
        
        lucide.createIcons();
    } catch (err) {
        showToast('ไม่สามารถดึงข้อมูลแพทย์ได้: ' + err.message, 'error');
    }
};

async function renderHistory(container) {
    if (!state.user.patientProfileId) throw new Error('ไม่พบข้อมูลโปรไฟล์ผู้ป่วย');
    const patientData = await api.patients.getById(state.user.patientProfileId, state.token);
    
    container.innerHTML = `
        <div class="animate-slide-up">
            <h3 class="text-3xl font-black text-slate-800 mb-8 tracking-tighter italic">บันทึกสุขภาพย้อนหลัง</h3>
            <div class="space-y-6">
            ${patientData.medicalRecords.map(rec => `
                <div class="bg-white p-8 rounded-[36px] border border-slate-100 card-shadow group relative overflow-hidden transition-all hover:translate-x-2">
                    <div class="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500 group-hover:w-3 transition-all"></div>
                    <div class="flex flex-col md:flex-row justify-between mb-8 gap-4">
                        <div>
                            <span class="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">${new Date(rec.recordedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <h4 class="text-2xl font-black text-slate-900 mt-4 leading-tight">${rec.diagnosis}</h4>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                            <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                <i data-lucide="user-round" class="w-5 h-5 text-indigo-600"></i>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold text-slate-400 uppercase">ตรวจรักษาโดย</p>
                                <p class="font-bold text-slate-800 text-sm">นพ. ${rec.doctor?.fullName || 'ประจำคลินิก'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-indigo-50/30 p-6 rounded-[24px] border border-indigo-50/50">
                            <div class="flex items-center gap-2 mb-3">
                                <i data-lucide="activity" class="w-4 h-4 text-indigo-600"></i>
                                <span class="text-[10px] font-black text-indigo-500 uppercase tracking-widest">แผนการรักษา</span>
                            </div>
                            <p class="text-slate-700 leading-relaxed font-medium">${rec.treatment}</p>
                        </div>
                        <div class="bg-emerald-50/30 p-6 rounded-[24px] border border-emerald-50/50">
                            <div class="flex items-center gap-2 mb-3">
                                <i data-lucide="pill" class="w-4 h-4 text-emerald-600"></i>
                                <span class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ยาที่ได้รับ</span>
                            </div>
                            <p class="text-slate-700 leading-relaxed font-medium">${rec.medication}</p>
                        </div>
                    </div>
                </div>
            `).join('') || '<div class="text-center p-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100 text-slate-400 italic">ยังไม่มีข้อมูลในประวัติการรักษาของคุณ</div>'}
        </div>
    `;
}

// --- 4. การแสดงรายชื่อทีมแพทย์ (DYNAMIC DOCTOR TEAM) ---
// ส่วนนี้สำคัญมาก เพราะเป็นการพิสูจน์ว่าข้อมูลจากฝั่งหมอ (ตอนแก้ไขโปรไฟล์) ซิงค์มาถึงหน้าคนไข้จริง
async function renderTeam(container) {
    // ดึงข้อมูลรายชื่อคุณหมอทั้งหมดจาก Database
    const doctors = await api.auth.getDoctors(state.token);
    
    container.innerHTML = `
        <div class="animate-slide-up">
            <h3 class="text-3xl font-black text-slate-800 mb-2 tracking-tighter italic">ทีมแพทย์ผู้เชี่ยวชาญ</h3>
            <p class="text-slate-500 mb-8">เราพร้อมดูแลสุขภาพของคุณด้วยทีมแพทย์ผู้มีประสบการณ์</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${doctors.map(d => `
                    <div class="bg-white rounded-[40px] p-8 border border-slate-100 card-shadow group hover:-translate-y-2 transition-all duration-500 text-center relative overflow-hidden">
                        <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                        
                        <div class="relative mb-6">
                            <div class="w-24 h-24 mx-auto rounded-3xl bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 overflow-hidden shadow-lg border-4 border-white">
                                <!-- ส่วนนี้จะพยายามดึงรูปตาม ID หมอ ถ้าไม่มีให้แสดงรูป Default -->
                                <img src="${d.profileImage || `../doctor/img/doctor-${d.id}.png`}" alt="Doctor" class="w-full h-full object-cover" onerror="this.src='../doctor/img/default-doctor.png'">
                            </div>
                            <div class="absolute bottom-0 right-1/2 translate-x-12 translate-y-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                        </div>
                        
                        <!-- แสดงชื่อหมอ พร้อมตรวจสอบคำนำหน้าชื่ออัตโนมัติ -->
                        <h4 class="text-xl font-black text-slate-800 mb-1">${d.fullName.startsWith('นพ.') || d.fullName.startsWith('พญ.') ? d.fullName : 'นพ. ' + d.fullName}</h4>
                        
                        <!-- ดึงค่า Specialization ที่คุณหมอแก้ไขเองมาแสดงผล -->
                        <p class="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-6">${d.specialization || 'อายุรแพทย์ (General Doctor)'}</p>
                        
                        <div class="space-y-3 mb-8">
                            <div class="flex items-center justify-center gap-2 text-slate-400 text-sm">
                                <i data-lucide="award" class="w-4 h-4"></i>
                                <!-- แยกข้อมูลประสบการณ์ส่วนแรก (Title) -->
                                <span>${d.experience?.split('|')[0] || 'ผู้เชี่ยวชาญการรักษาโรคทั่วไป'}</span>
                            </div>
                            <div class="flex items-center justify-center gap-2 text-slate-400 text-sm">
                                <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                                <!-- แยกข้อมูลประสบการณ์ส่วนที่สอง (Years) โดยตัดคำจากเครื่องหมาย | -->
                                <span>${d.experience?.split('|')[1] || 'ประสบการณ์ 10+ ปี'}</span>
                            </div>
                        </div>

                        <!-- ปุ่มจองคิว: เมื่อกดจะสลับไปหน้า Appointment และเปิด Modal จองทันที -->
                        <button onclick="router.switch('appointments'); setTimeout(() => createAppointment(), 100)" class="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                            <i data-lucide="calendar" class="w-5 h-5"></i>
                            จองคิวตรวจกับคุณหมอ
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    lucide.createIcons();
}

window.onload = render;
