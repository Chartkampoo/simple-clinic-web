document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    
    try {
        btn.disabled = true;
        btn.textContent = 'กำลังตรวจสอบสิทธิ์...';
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        const response = await api.auth.login({ username, password });
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        showToast('เข้าสู่ระบบสำเร็จ! กำลังนำคุณไปที่หน้าหลัก...', 'success');
        
        setTimeout(() => {
            const rolePath = response.user.role.toLowerCase();
            window.location.href = `${rolePath}/dashboard.html`;
        }, 1500);
        
    } catch (error) {
        showToast(error.message === 'Invalid credentials' ? 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' : error.message, 'error');
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    
    try {
        btn.disabled = true;
        
        const fullName = document.getElementById('reg-name').value;
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        
        await api.auth.register({ fullName, username, email, password, role });
        
        showToast('ลงทะเบียนสำเร็จ! คุณสามารถเข้าสู่ระบบได้แล้ว', 'success');
        toggleAuth(); // สลับไปหน้าเข้าสู่ระบบ
        
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
    }
});

// ตรวจสอบว่าเข้าสู่ระบบแล้ว
window.addEventListener('load', () => {
    if (localStorage.getItem('token') && (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('frontend/'))) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            window.location.href = `${user.role.toLowerCase()}/dashboard.html`;
        }
    }
});
