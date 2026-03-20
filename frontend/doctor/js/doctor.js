// --- 1. การจัดการสถานะของแอปพลิเคชัน (REACTIVE STATE) ---
// ตัวแปร state ใช้เก็บข้อมูลสำคัญที่ใช้ร่วมกันในหลายๆ ฟังก์ชัน เพื่อให้แอปพลิเคชันทำงานได้อย่างต่อเนื่อง
const state = {
    user: JSON.parse(localStorage.getItem('user')), // เก็บข้อมูลผู้ใช้ที่ล็อกอินอยู่ (ดึงมาจาก LocalStorage)
    token: localStorage.getItem('token'), // เก็บ Token สำหรับใช้ยืนยันตัวตนเวลาเรียก API (Security Header)
    view: 'overview', // ระบุว่าปัจจุบันหน้าจอต้องแสดงผลหน้าไหน (ภาพรวม, ตารางนัด, ฯลฯ)
    refreshInterval: null // ตัวแปรสำหรับหยุด/เริ่ม การรีเฟรชข้อมูลอัตโนมัติ
};

// --- 2. ระบบนำทางหน้าจอ (SPA ROUTER) ---
// ส่วนนี้ทำหน้าที่ควบคุมการสลับหน้าจอ (Switch Views) โดยไม่ต้องโหลดหน้าเว็บใหม่ (Single Page Application)
const router = {
    switch(view) {
        state.view = view; // อัปเดตสถานะว่าเราอยู่ที่หน้าไหน
        render(); // สั่งให้วาดเนื้อหาหน้าจอนั้นๆ ใหม่
        startAutoRefresh(); // สั่งเริ่มการนับเวลาสำหรับการรีเฟรชอัตโนมัติของหน้านั้นๆ
        
        // ส่วนนี้คือการวนลูปเพื่อเปลี่ยนสี "ปุ่มเมนู" (Sidebar) ให้คนใช้รู้ว่าอยู่เมนูไหน (Active State)
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkText = link.querySelector('span').textContent;
            const viewMap = {
                'overview': 'ภาพรวมระบบ',
                'appointments': 'ตารางนัดหมายวันนี้',
                'next_appointments': 'นัดหมายถัดไป',
                'patients': 'ประวัติผู้ป่วย'
            };
            if (linkText === viewMap[view]) {
                link.classList.add('active', 'bg-blue-50', 'text-blue-600', 'border-r-4', 'border-blue-600');
            } else {
                link.classList.remove('active', 'bg-blue-50', 'text-blue-600', 'border-r-4', 'border-blue-600');
                link.classList.add('text-slate-600');
            }
        });
    }
};

// --- 3. ระบบรีเฟรชข้อมูลอัตโนมัติ (AUTO SYNC) ---
// ฟังก์ชันนี้จะคอยเรียกข้อมูลใหม่จาก Server ทุกๆ 3 นาที เพื่อให้คุณหมอดูคิวงานได้แบบล่าสุดเสมอ
function startAutoRefresh() {
    if (state.refreshInterval) clearInterval(state.refreshInterval); // เคลียร์ตัวนับเวลาเก่าก่อนเริ่มใหม่
    // ตั้งเวลา 180,000 มิลลิวินาที (เท่ากับ 3 นาที)
    state.refreshInterval = setInterval(() => {
        // จะรีเฟรชเฉพาะตอนที่อยู่หน้าสำคัญๆ เพื่อสตรีมข้อมูลคิวผู้ป่วยล่าสุด
        if (state.view === 'overview' || state.view === 'appointments' || state.view === 'next_appointments') {
            console.log('Refreshing dashboard...');
            render(true); // render(true) คือการรีเฟรชแบบเงียบๆ โดยไม่แสดง Loading ให้คนใช้รำคาญ
        }
    }, 180000);
}

// --- 4. ฟังก์ชันหลักสำหรับการวาดหน้าจอ (PRIMARY RENDERER) ---
// ฟังก์ชันนี้คือ "สมองส่วนหน้า" ของแอป ทำหน้าที่ตัดสินใจว่าจะดึงข้อมูลตัวไหนมาสร้างเป็น HTML
async function render(isSilent = false) {
    const main = document.getElementById('content-area'); // พื้นที่ที่เนื้อหาจะไปลง
    const title = document.getElementById('view-title'); // ส่วนหัวของหน้าจอ
    if (!isSilent) {
        main.innerHTML = '<div class="flex justify-center p-20 animate-pulse text-blue-500 font-bold italic tracking-widest">กำลังซิงโครไนซ์ข้อมูล...</div>';
    }

    try {
        // ตรวจสอบค่าจาก state.view แล้วเรียกใช้ฟังก์ชันย่อยตามหน้านั้นๆ
        if (state.view === 'overview') { title.textContent = 'ภาพรวมระบบ'; await renderOverview(main); }
        if (state.view === 'appointments') { title.textContent = 'ตารางนัดหมายวันนี้'; await renderTodayVisits(main); }
        if (state.view === 'next_appointments') { title.textContent = 'นัดหมายถัดไป'; await renderNextAppointments(main); }
        if (state.view === 'patients') { title.textContent = 'ทะเบียนประวัติผู้ป่วย'; await renderPatientHistory(main); }
    } catch (e) {
        // กรณีเรียก API ล้มเหลว (เช่น Server ล่ม หรือ Internet หลุด) จะมาตกลงที่บล็อก catch นี้
        main.innerHTML = `<div class="bg-rose-50 p-6 rounded-2xl text-rose-600 border border-rose-100 italic">เกิดข้อผิดพลาด: ${e.message}</div>`;
    }
    lucide.createIcons(); // สั่งให้ Lucide ไล่ตามหาไอคอนต่างๆ ใน HTML แล้ววาดรูปออกมา
}

async function renderOverview(container) {
    // 1. ดึงข้อมูลการนัดหมายทั้งหมดจาก Database ผ่าน API
    const apps = await api.appointments.getAll(state.token);
    const now = new Date();

    // 2. กรองข้อมูลเฉพาะการนัดหมายของวันนี้ (Today's filter)
    const appsToday = apps.filter(a => {
        const d = new Date(a.appointmentDate);
        return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
    });

    // คำนวณสถานะต่างๆ เพื่อแสดงผลบน Dashboards (KPI Metrics)
    const pendingToday = appsToday.filter(a => a.status.toUpperCase() === 'PENDING').length; // ผู้ป่วยที่รอการตรวจ
    const completedToday = appsToday.filter(a => a.status.toUpperCase() === 'COMPLETED').length; // ผู้ป่วยที่ตรวจเสร็จแล้ว
    const totalToday = appsToday.length;
    const completionRateToday = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0; // อัตราความสำเร็จ (%)

    // 2. FILTER MONTHLY DATA
    const appsMonth = apps.filter(a => {
        const d = new Date(a.appointmentDate);
        return d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
    });
    const completedMonth = appsMonth.filter(a => a.status.toUpperCase() === 'COMPLETED').length;
    const totalMonth = appsMonth.length;

    container.innerHTML = `
        <div class="animate-slide-up">
            <div class="mb-6 flex items-center justify-between">
                <h2 class="text-xl font-bold text-slate-800">สรุปข้อมูล วันนี้</h2>
                <div class="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    <div class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    REAL-TIME
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-8 rounded-3xl card-shadow border border-slate-100 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10">
                        <i data-lucide="clock" class="w-16 h-16"></i>
                    </div>
                    <p class="text-slate-500 font-medium">รอการตรวจ (วันนี้)</p>
                    <h2 class="text-5xl font-bold text-blue-600 mt-2">${pendingToday} <span class="text-lg font-normal">ราย</span></h2>
                </div>
                <div class="bg-white p-8 rounded-3xl card-shadow border border-slate-100 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10">
                        <i data-lucide="check-circle" class="w-16 h-16"></i>
                    </div>
                    <p class="text-slate-500 font-medium">ตรวจเสร็จสิ้น (วันนี้)</p>
                    <h2 class="text-5xl font-bold text-emerald-600 mt-2">${completedToday} <span class="text-lg font-normal">ราย</span></h2>
                </div>
                <div class="bg-white p-8 rounded-3xl card-shadow border border-slate-100">
                    <p class="text-slate-500 font-medium">ความสำเร็จวันนี้</p>
                    <div class="w-full bg-slate-100 h-3 rounded-full mt-6 overflow-hidden">
                        <div class="bg-blue-500 h-full transition-all duration-1000" style="width: ${completionRateToday}%"></div>
                    </div>
                    <p class="text-xs text-slate-400 mt-2 font-bold uppercase">ดำเนินการไปแล้ว ${completionRateToday}%</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <!-- Main Queue -->
                <div class="lg:col-span-2 bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
                    <div class="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 class="font-bold text-slate-800">คิวผู้ป่วยถัดไป (วันนี้)</h3>
                        <span class="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full uppercase">ล่าสุด</span>
                    </div>
                    <div class="divide-y divide-slate-100">
                        ${appsToday.filter(a => a.status.toUpperCase() === 'PENDING').slice(0, 5).map(app => `
                            <div class="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg border border-blue-100 overflow-hidden">
                                        ${app.patient?.user?.profileImage
            ? `<img src="${app.patient.user.profileImage}" class="w-full h-full object-cover">`
            : (app.patient?.user?.fullName || 'ผ')[0]}
                                    </div>
                                    <div>
                                        <p class="font-bold text-slate-900">${app.patient?.user?.fullName || 'ไม่ระบุชื่อ'}</p>
                                        <p class="text-sm text-slate-500">${app.reason || 'ตรวจโรคทั่วไป'}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    ${getStatusBadge(app.status)}
                                    <div class="flex items-center gap-2">
                                        <button onclick="openPatientHistory(${app.patient?.id || 0}, '${app.patient?.user?.fullName || ''}')" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="ดูประวัติการรักษา">
                                            <i data-lucide="history" class="w-5 h-5"></i>
                                        </button>
                                        <button onclick="startVisit(${app.id}, ${app.patientId})" class="btn-primary text-white px-6 py-2 rounded-xl text-sm font-bold">เริ่มการตรวจ</button>
                                        <button onclick="deleteAppointment(${app.id})" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ลบรายการ">
                                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('') || '<p class="p-8 text-center text-slate-400">ไม่มีรายการนัดหมายที่รออยู่ขณะนี้</p>'}
                    </div>
                </div>

                <!-- Monthly Summary -->
                <div class="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
                    <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 class="font-bold text-slate-800">สรุปข้อมูลรายเดือน</h3>
                        <p class="text-xs text-slate-400">${now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div class="p-6 space-y-6">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-blue-50 rounded-lg"><i data-lucide="layers" class="w-5 h-5 text-blue-600"></i></div>
                                <span class="text-slate-600 text-sm font-medium">นัดหมายทั้งหมด</span>
                            </div>
                            <span class="font-bold text-slate-800">${totalMonth}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-emerald-50 rounded-lg"><i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-600"></i></div>
                                <span class="text-slate-600 text-sm font-medium">ตรวจเสร็จสิ้น</span>
                            </div>
                            <span class="font-bold text-emerald-600">${completedMonth}</span>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p class="text-xs text-slate-400 uppercase font-bold mb-2">อัตราความสำเร็จเดือนนี้</p>
                            <div class="flex items-end gap-2 text-3xl font-bold text-slate-800">
                                ${totalMonth > 0 ? Math.round((completedMonth / totalMonth) * 100) : 0}%
                                <span class="text-xs text-slate-400 mb-1 font-normal">ของนัดหมายทั้งหมด</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderTodayVisits(container) {
    const apps = await api.appointments.getAll(state.token);
    const now = new Date();

    // Show Today's appointments by default
    const appsToday = apps.filter(a => {
        const d = new Date(a.appointmentDate);
        return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
    });

    container.innerHTML = `
        <div class="animate-slide-up">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold text-slate-800 tracking-tighter italic uppercase">ตารางนัดหมายวันนี้</h3>
                <span class="text-sm font-bold text-blue-600">${now.toLocaleDateString('th-TH')}</span>
            </div>
            <div class="grid gap-4">
                ${appsToday.map(app => `
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-blue-200 transition-all card-shadow">
                        <div class="flex gap-4 items-center">
                            <div class="text-center bg-slate-50 p-2 rounded-xl min-w-[80px] border border-slate-100">
                                <p class="text-xs font-bold text-blue-600 uppercase">${new Date(app.appointmentDate).getHours().toString().padStart(2, '0')}:${new Date(app.appointmentDate).getMinutes().toString().padStart(2, '0')} น.</p>
                            </div>
                            <div>
                                <p class="font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer">${app.patient?.user?.fullName || 'ไม่ระบุ'}</p>
                                <p class="text-xs text-slate-500">${app.reason || '-'}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            ${getStatusBadge(app.status)}
                            <div class="flex items-center">
                                ${app.status === 'PENDING' ? `<button onclick="startVisit(${app.id}, ${app.patientId})" class="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">บันทึกตรวจ</button>` : ''}
                                <button onclick="deleteAppointment(${app.id})" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ลบรายการ">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('') || '<p class="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 italic font-medium">ยังไม่มีรายการนัดหมายสำหรับวันนี้</p>'}
            </div>
        </div>
    `;
}

window.deleteAppointment = async (id) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบนัดหมายนี้?')) return;

    try {
        await api.appointments.delete(id, state.token);
        showToast('ลบรายการนัดหมายสำเร็จ');
        render(true);
    } catch (err) {
        showToast(err.message, 'error');
    }
};

async function renderPatientHistory(container) {
    const patients = await api.patients.getAll(state.token);
    container.innerHTML = `
        <div class="animate-slide-up">
            <h3 class="text-2xl font-bold text-slate-800 mb-6 tracking-tighter italic uppercase">ทะเบียนประวัติผู้ป่วย</h3>
            <div class="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-slate-50 text-slate-500 text-sm font-bold uppercase">
                    <tr>
                        <th class="px-6 py-4 border-b border-slate-100">ชื่อผู้ป่วย</th>
                        <th class="px-6 py-4 border-b border-slate-100">อีเมล</th>
                        <th class="px-6 py-4 border-b border-slate-100">เบอร์โทรศัพท์</th>
                        <th class="px-6 py-4 border-b border-slate-100 text-right">การจัดการ</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${patients.map(p => `
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden border border-slate-100">
                                        ${p.profileImage ? `<img src="${p.profileImage}" class="w-full h-full object-cover">` : p.fullName[0]}
                                    </div>
                                    <span class="font-bold text-slate-800">${p.fullName}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-slate-500 text-sm font-medium">${p.email || '-'}</td>
                            <td class="px-6 py-4 text-slate-500 text-sm font-medium">${p.phone || '-'}</td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2">
                                    <button onclick="scheduleFollowUp(${p.patientProfile?.id}, '${p.fullName}')" class="bg-emerald-50 text-emerald-600 font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center gap-1">
                                        <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i> นัดถัดไป
                                    </button>
                                    <button onclick="viewPatientDetails(${p.patientProfile?.id})" class="bg-blue-50 text-blue-600 font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-100 transition-all border border-blue-100">เรียกดูประวัติ</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.viewPatientDetails = async (profileId) => {
    if (!profileId) return showToast('ไม่พบข้อมูลโปรไฟล์ผู้ป่วย', 'error');

    try {
        const patient = await api.patients.getById(profileId, state.token);

        showModal(`
            <div class="p-8 max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-8 bg-blue-50/50 p-6 -mx-8 -mt-8 border-b border-blue-100/50">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-center text-2xl font-black text-blue-600 overflow-hidden">
                            ${patient.user.profileImage ? `<img src="${patient.user.profileImage}" class="w-full h-full object-cover">` : patient.user.fullName[0]}
                        </div>
                        <div>
                            <h3 class="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">ประวัติการรักษา</h3>
                            <p class="text-blue-600 font-bold">${patient.user.fullName}</p>
                        </div>
                    </div>
                    <button onclick="closeModal()" class="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm"><i data-lucide="x" class="w-6 h-6"></i></button>
                </div>
                
                <div class="space-y-6">
                    ${patient.medicalRecords.map(rec => `
                        <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
                            <div class="flex justify-between mb-4">
                                <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">${new Date(rec.recordedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                                <span class="text-[10px] text-slate-400 font-medium">ตรวจโดย: นพ. ${rec.doctor?.fullName}</span>
                            </div>
                            <div class="grid grid-cols-1 gap-3">
                                <div class="p-3 bg-white rounded-xl border border-slate-100">
                                    <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">การวินิจฉัย</p>
                                    <p class="text-sm text-slate-800 font-medium">${rec.diagnosis}</p>
                                </div>
                                <div class="p-3 bg-white rounded-xl border border-slate-100">
                                    <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">การรักษา</p>
                                    <p class="text-sm text-slate-800 font-medium">${rec.treatment}</p>
                                </div>
                                <div class="p-3 bg-white rounded-xl border border-slate-100">
                                    <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">รายการยา</p>
                                    <p class="text-sm font-bold text-blue-600">${rec.medication}</p>
                                </div>
                            </div>
                        </div>
                    `).join('') || '<div class="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200"><i data-lucide="folder-open" class="w-12 h-12 text-slate-200 mx-auto mb-3"></i><p class="text-slate-400 italic font-medium">ไม่พบประวัติการตรวจรักษา</p></div>'}
                </div>
            </div>
        `);
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.startVisit = (appointmentId, patientId) => {
    showModal(`
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-2xl font-bold text-slate-900 tracking-tight">บันทึกผลการตรวจ</h3>
                    <p class="text-slate-500 text-sm">รหัสผู้ป่วย: #${patientId}</p>
                </div>
                <button onclick="closeModal()" class="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            <form id="record-form" class="space-y-4">
                <div class="space-y-1">
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">ผลการวินิจฉัย</label>
                    <textarea id="rec-diag" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300" rows="2" placeholder="ระบุการวินิจฉัยโรค..."></textarea>
                </div>
                <div class="space-y-1">
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">แผนการรักษา</label>
                    <textarea id="rec-treat" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300" rows="2" placeholder="ระบุวิธีรักษา..."></textarea>
                </div>
                <div class="space-y-1">
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">รายการยาที่สั่ง</label>
                    <textarea id="rec-med" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300" rows="2" placeholder="ระบุชื่อยาและขนาดยา..."></textarea>
                </div>
                <div class="flex gap-4 mt-8">
                    <button type="submit" class="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
                        <i data-lucide="save" class="w-5 h-5"></i>
                        เสร็จสิ้นการตรวจ
                    </button>
                    <button type="button" onclick="scheduleFollowUp(${patientId}, 'คนไข้ประจำนัดหมาย')" class="bg-emerald-50 text-emerald-600 p-4 rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center gap-2" title="นัดหมายครั้งถัดไป">
                        <i data-lucide="calendar-plus" class="w-6 h-6"></i>
                    </button>
                </div>
            </form>
        </div>
    `);

    document.getElementById('record-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        try {
            btn.disabled = true;
            btn.innerHTML = '<div class="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>';

            await api.medicalRecords.create({
                patientId,
                appointmentId,
                diagnosis: document.getElementById('rec-diag').value,
                treatment: document.getElementById('rec-treat').value,
                medication: document.getElementById('rec-med').value
            }, state.token);

            showToast('บันทึกประวัติการรักษาสำเร็จ!');
            closeModal();
            router.switch('overview');
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> บันทึกและเสร็จสิ้นการตรวจ';
            lucide.createIcons();
        }
    };
};

window.scheduleFollowUp = (patientId, patientName) => {
    showModal(`
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">นัดหมายครั้งถัดไป</h3>
                    <p class="text-slate-500 text-sm">ผู้ป่วย: ${patientName}</p>
                </div>
                <button onclick="closeModal()" class="p-2 hover:bg-slate-100 rounded-xl transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            
            <form id="follow-up-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="block text-xs font-bold text-slate-400 uppercase">วันที่นัดหมาย</label>
                        <input type="date" id="follow-date" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div class="space-y-1">
                        <label class="block text-xs font-bold text-slate-400 uppercase">เวลา</label>
                        <input type="time" id="follow-time" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                </div>
                <div class="space-y-1">
                    <label class="block text-xs font-bold text-slate-400 uppercase">เหตุผล / หมายเหตุเพิ่มเติม</label>
                    <textarea id="follow-reason" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" rows="2">ติดตามอาการ (Follow-up)</textarea>
                </div>
                <button type="submit" class="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold mt-4 shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                    <i data-lucide="calendar-check" class="w-5 h-5"></i>
                    ยืนยันการนัดหมาย
                </button>
            </form>
        </div>
    `);

    document.getElementById('follow-up-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        try {
            btn.disabled = true;
            btn.innerHTML = 'กำลังบันทึก...';
            
            const date = document.getElementById('follow-date').value;
            const time = document.getElementById('follow-time').value;
            
            await api.appointments.create({
                patientId,
                doctorId: state.user.id,
                appointmentDate: `${date}T${time}:00.000Z`,
                reason: document.getElementById('follow-reason').value
            }, state.token);

            showToast('สร้างนัดหมายสำเร็จ!');
            closeModal();
            render(true);
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'ยืนยันการนัดหมาย';
        }
    };
    lucide.createIcons();
};

async function openPatientHistory(patientId, patientName) {
    if (!patientId) return;
    showModal(`
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">ประวัติการรักษา: ${patientName}</h3>
                    <p class="text-slate-500 text-sm">ข้อมูลการรักษาย้อนหลังทั้งหมด</p>
                </div>
                <button onclick="closeModal()" class="p-2 hover:bg-slate-100 rounded-xl transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            
            <div id="history-content" class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div class="flex justify-center p-12 text-indigo-500"><span class="animate-spin text-3xl">🌀</span></div>
            </div>
        </div>
    `);

    try {
        const token = localStorage.getItem('token');
        const patient = await api.patients.getById(patientId, token);
        const records = patient.medicalRecords || [];

        const content = document.getElementById('history-content');
        if (records.length === 0) {
            content.innerHTML = '<div class="text-center p-12 text-slate-400">ไม่พบประวัติการรักษาในฐานข้อมูล</div>';
        } else {
            content.innerHTML = records.map(record => `
                <div class="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">
                            <i data-lucide="calendar" class="w-3 h-3"></i>
                            ${new Date(record.visitDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                        </div>
                        <span class="text-xs font-black text-indigo-500 uppercase tracking-widest">โดย: ${record.doctor?.fullName || 'ไม่ทราบชื่อหมอ'}</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">อาการสำคัญ / การวินิจฉัย</p>
                            <p class="text-slate-900 font-bold leading-relaxed">${record.diagnosis}</p>
                        </div>
                        <div class="space-y-2">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">การรักษา / ยาที่ได้รับ</p>
                            <p class="text-slate-700 leading-relaxed">${record.treatment}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        lucide.createIcons();
    } catch (err) {
        document.getElementById('history-content').innerHTML = `
            <div class="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}
            </div>
        `;
    }
}

async function renderNextAppointments(container) {
    const apps = await api.appointments.getAll(state.token);
    const now = new Date();
    // Start of tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const appsNext = apps.filter(a => {
        const d = new Date(a.appointmentDate);
        return d >= tomorrow;
    }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

    container.innerHTML = `
        <div class="animate-slide-up">
            <h3 class="text-2xl font-bold text-slate-800 mb-6 tracking-tighter italic uppercase underline decoration-blue-500 decoration-4 underline-offset-8">ตารางนัดหมายที่กำลังมาถึง</h3>
            <div class="grid gap-4">
                ${appsNext.map(app => `
                    <div class="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between hover:border-blue-200 transition-all card-shadow">
                        <div class="flex gap-4 items-center">
                            <div class="text-center bg-blue-50 p-3 rounded-2xl min-w-[100px] border border-blue-100">
                                <p class="text-xs font-black text-blue-600 uppercase tracking-widest">${new Date(app.appointmentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</p>
                                <p class="text-[10px] font-bold text-blue-400 mt-1">${new Date(app.appointmentDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                            </div>
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="font-bold text-slate-800 text-lg">${app.patient?.user?.fullName || 'ไม่ระบุ'}</span>
                                    <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">#${app.patientId}</span>
                                </div>
                                <p class="text-sm text-slate-500 italic">📌 หมายเหตุ: ${app.reason || '-'}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="openPatientHistory(${app.patientId}, '${app.patient?.user?.fullName || 'คนไข้'}')" class="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm" title="ดูประวัติ">
                                <i data-lucide="history" class="w-5 h-5"></i>
                            </button>
                            <button onclick="deleteAppointment(${app.id})" class="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all shadow-sm" title="ยกเลิกนัด">
                                <i data-lucide="trash-2" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                `).join('') || '<div class="p-20 text-center text-slate-400 bg-white rounded-[40px] border-2 border-dashed border-slate-100 italic font-medium mt-4">ยังไม่มีรายการนัดหมายล่วงหน้าในระบบ</div>'}
            </div>
        </div>
    `;
    lucide.createIcons();
}

// --- 5. ฟังก์ชันแก้ไขโปรไฟล์แพทย์ (PROFILE EDITOR) ---
// ส่วนนี้ใช้สำหรับแสดง Modal และจัดการการอัปเดตข้อมูลส่วนตัวของคุณหมอ
window.openEditProfile = () => {
    const user = JSON.parse(localStorage.getItem('user')); // ดึงข้อมูลปัจจุบันมาแสดงใน Input
    showModal(`
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">แก้ไขข้อมูลส่วนตัวบุคคลากร</h3>
                    <p class="text-slate-500 text-sm">รหัสบุคคลากร: #${user.id}</p>
                </div>
                <button onclick="closeModal()" class="p-2 hover:bg-slate-100 rounded-xl transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            
            <form id="edit-profile-form" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="block text-xs font-bold text-slate-400 uppercase">ชื่อ-นามสกุล</label>
                        <input type="text" id="edit-fullname" required value="${user.fullName}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div class="space-y-1">
                        <label class="block text-xs font-bold text-slate-400 uppercase">อีเมล</label>
                        <input type="email" id="edit-email" required value="${user.email || ''}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                </div>
                <div class="space-y-1">
                    <label class="block text-xs font-bold text-slate-400 uppercase">เบอร์โทรศัพท์</label>
                    <input type="text" id="edit-phone" required value="${user.phone || ''}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div class="space-y-1 pt-2 border-t border-slate-100">
                    <label class="block text-xs font-bold text-indigo-500 uppercase">ตำแหน่งงาน / ความเชี่ยวชาญ</label>
                    <input type="text" id="edit-special" required value="${user.specialization || 'อายุรแพทย์ (General Doctor)'}" class="w-full px-4 py-3 bg-slate-50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="block text-xs font-bold text-slate-400 uppercase">หัวข้อเพิ่มเติม</label>
                        <input type="text" id="edit-exp-title" required value="${user.experience?.split('|')[0] || 'ผู้เชี่ยวชาญการรักษาโรคทั่วไป'}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div class="space-y-1">
                        <label class="block text-xs font-bold text-slate-400 uppercase">ประสบการณ์</label>
                        <input type="text" id="edit-exp-years" required value="${user.experience?.split('|')[1] || 'ประสบการณ์ 10+ ปี'}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                </div>

                <button type="submit" class="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-4 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <i data-lucide="save" class="w-5 h-5"></i>
                    บันทึกข้อมูล
                </button>
            </form>
        </div>
    `);

    // เมื่อกดSubmit: ส่งข้อมูลใหม่ไปอัปเดตที่ Backend Database
    document.getElementById('edit-profile-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        try {
            btn.disabled = true;
            btn.innerHTML = 'กำลังบันทึก...';
            
            const specialization = document.getElementById('edit-special').value;
            const expTitle = document.getElementById('edit-exp-title').value;
            const expYears = document.getElementById('edit-exp-years').value;
            
            // เรียกใช้ API เพื่อส่งค่าไปบันทึกถาวรใน Database
            const res = await api.auth.updateProfile({
                fullName: document.getElementById('edit-fullname').value,
                email: document.getElementById('edit-email').value,
                phone: document.getElementById('edit-phone').value,
                specialization: specialization,
                experience: `${expTitle}|${expYears}` // รวม Title และ Years เป็น String เดียวโดยใช้เครื่องหมาย | คั่น
            }, state.token);

            // เมื่อบันทึกสำเร็จ: อัปเดตข้อมูลใน LocalStorage เพื่อให้หน้าจอแสดงผลตามข้อมูลใหม่ทันที
            localStorage.setItem('user', JSON.stringify(res.user));
            showToast('อัปเดตข้อมูลสำเร็จ!');
            location.reload(); // รีโหลดหน้าจอเพื่อให้ Sidebar และส่วนต่างๆ อัปเดต UI
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'บันทึกข้อมูล';
        }
    };
    lucide.createIcons();
};

window.onload = () => {
    render();
    startAutoRefresh();
};
