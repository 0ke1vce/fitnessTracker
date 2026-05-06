// ── Trainer Portal JS ──
const API = `http://${window.location.hostname}:5000/api`;
let socket = null;
let activeRoom = null;
let trainerData = null;
let videoCallInstance = null;

// ── Auth ──
document.getElementById('loginTab').addEventListener('click', () => {
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
});
document.getElementById('registerTab').addEventListener('click', () => {
    document.getElementById('registerTab').classList.add('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API}/trainer-auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value,
            })
        });
        const data = await res.json();
        if (!res.ok) return showToast(data.error || 'Login failed', 'error');
        localStorage.setItem('trainer_token', data.token);
        localStorage.setItem('trainer_user', JSON.stringify(data.user));
        showDashboard();
    } catch (err) { showToast('Connection error', 'error'); }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API}/trainer-auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                specialty: document.getElementById('regSpecialty').value,
                monthly_price: document.getElementById('regPrice').value,
                bio: document.getElementById('regBio').value,
            })
        });
        const data = await res.json();
        if (!res.ok) return showToast(data.error || 'Registration failed', 'error');
        localStorage.setItem('trainer_token', data.token);
        localStorage.setItem('trainer_user', JSON.stringify(data.user));
        showDashboard();
    } catch (err) { showToast('Connection error', 'error'); }
});

// ── Dashboard Init ──
function showDashboard() {
    document.getElementById('authView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    trainerData = JSON.parse(localStorage.getItem('trainer_user'));
    document.getElementById('trainerNameDisplay').textContent = trainerData.name;
    const d = new Date().toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    document.getElementById('currentDate').innerHTML = `<i class="fa-regular fa-calendar"></i> ${d}`;
    loadClients();
    loadProfile();
    
    // Mobile sidebar toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (mobileBtn && sidebar && overlay) {
        mobileBtn.onclick = () => { sidebar.classList.toggle('open'); overlay.classList.toggle('hidden'); };
        overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.add('hidden'); };
    }
}

async function loadClients() {
    try {
        const res = await fetch(`${API}/trainer-auth/clients`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('trainer_token')}` }
        });
        const data = await res.json();
        const clients = data.clients || [];

        document.getElementById('statClients').textContent = clients.length;

        // Client cards
        const grid = document.getElementById('clientsList');
        if (clients.length === 0) {
            grid.innerHTML = '<div class="glass-panel" style="padding:40px;text-align:center;grid-column:1/-1;color:var(--text-muted)"><i class="fa-solid fa-users" style="font-size:3rem;opacity:0.3;display:block;margin-bottom:12px"></i>No clients yet. Share your profile link so users can subscribe!</div>';
        } else {
            grid.innerHTML = clients.map(c => `
                <div class="trainer-card">
                    <div class="trainer-card-banner" style="background:linear-gradient(135deg,rgba(16,185,129,0.5),rgba(6,182,212,0.5))"></div>
                    <div class="trainer-card-body">
                        <div class="trainer-avatar">${(c.name||'C').charAt(0).toUpperCase()}</div>
                        <div class="trainer-name">${c.name}</div>
                        <div class="trainer-spec">${c.email}</div>
                        <p class="trainer-bio">Weight: ${c.weight || '--'} kg · Joined: ${new Date(c.subscribed_at).toLocaleDateString()}</p>
                        <button class="btn-primary" style="width:100%;background:linear-gradient(135deg,var(--neon-green),#059669)" onclick="openChat(${c.id}, '${c.name.replace(/'/g,"\\'")}')"><i class="fa-solid fa-comments"></i> Chat</button>
                    </div>
                </div>
            `).join('');
        }

        // Chat sidebar
        const chatList = document.getElementById('chatClientList');
        chatList.innerHTML = clients.map(c => `
            <button onclick="openChat(${c.id}, '${c.name.replace(/'/g,"\\'")}') " class="btn-secondary" style="width:100%;text-align:left;font-size:0.85rem;padding:10px 12px;justify-content:flex-start">
                <i class="fa-solid fa-user" style="color:var(--neon-green)"></i> ${c.name}
            </button>
        `).join('') || '<div style="color:var(--text-muted);font-size:0.82rem;padding:8px">No clients</div>';

        // Revenue
        const profile = await fetch(`${API}/trainer-auth/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('trainer_token')}` }
        }).then(r => r.json());
        const price = profile.monthly_price || 0;
        document.getElementById('statRevenue').textContent = `$${(clients.length * price).toFixed(0)}`;
        document.getElementById('statRating').textContent = profile.rating || '5.0';

    } catch (err) { console.error(err); }
}

async function loadProfile() {
    try {
        const res = await fetch(`${API}/trainer-auth/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('trainer_token')}` }
        });
        const p = await res.json();
        document.getElementById('tpName').value = p.name || '';
        document.getElementById('tpSpecialty').value = p.specialty || '';
        document.getElementById('tpPrice').value = p.monthly_price || '';
        document.getElementById('tpBio').value = p.bio || '';
    } catch (err) {}
}

// ── Chat ──
function openChat(clientId, clientName) {
    try {
        console.log('[Trainer] openChat called for:', clientName, 'ID:', clientId);
        
        // Navigate to chat section
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById('t-chat').classList.add('active');
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        const chatNavLink = document.querySelector('[data-target="t-chat"]');
        if (chatNavLink) chatNavLink.classList.add('active');
        document.getElementById('pageTitle').textContent = 'Chat';

        const headerName = document.getElementById('activeChatClient');
        if (headerName) headerName.textContent = clientName;
        
        const msgContainer = document.getElementById('trainerChatMessages');
        if (msgContainer) msgContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Loading history...</div>';

        if (!trainerData) {
            trainerData = JSON.parse(localStorage.getItem('trainer_user'));
        }
        
        if (!trainerData) {
            alert('Trainer data missing. Please log out and log in again.');
            return;
        }

        const tId = trainerData.trainerId || trainerData.id;
        const room = `trainer_${tId}_client_${clientId}`;
        activeRoom = room;

        console.log('[Trainer] Joining room:', room);

        if (!socket) {
            const serverUrl = `http://${window.location.hostname}:5000`;
            socket = io(serverUrl, { transports: ['polling', 'websocket'] });
            
            socket.on('connect', () => console.log('[Trainer] Socket Connected'));
            socket.on('connect_error', (e) => console.error('[Trainer] Socket Error', e));
        }
        
        socket.emit('join_room', room);
        socket.emit('get_history', room);

        // Remove old listeners
        socket.off('receive_message');
        socket.off('message_history');

        socket.on('message_history', (msgs) => {
            console.log('[Trainer] History received:', msgs.length, 'messages');
            if (msgContainer) {
                if (msgs.length === 0) {
                    msgContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">No previous messages.</div>';
                } else {
                    msgContainer.innerHTML = msgs.map(m => {
                        const isMe = m.sender_id === trainerData.id;
                        return `<div class="msg-bubble ${isMe ? 'outgoing' : 'incoming'}">
                            <small style="opacity:0.6;display:block;margin-bottom:3px;font-size:0.72rem">${m.sender_name || (isMe ? 'You' : clientName)}</small>
                            ${m.message}
                        </div>`;
                    }).join('');
                }
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        });

        socket.on('receive_message', (data) => {
            if (msgContainer) {
                const isMe = data.sender_id === trainerData.id;
                msgContainer.insertAdjacentHTML('beforeend', `
                    <div class="msg-bubble ${isMe ? 'outgoing' : 'incoming'}">
                        <small style="opacity:0.6;display:block;margin-bottom:3px;font-size:0.72rem">${isMe ? 'You' : data.sender_name || clientName}</small>
                        ${data.message}
                    </div>
                `);
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        });

        // ── Video Call Link ──
        if (typeof VideoCall !== 'undefined') {
            if (!videoCallInstance) {
                videoCallInstance = new VideoCall(socket, {
                    localVideoId: 'localVideo',
                    remoteVideoId: 'remoteVideo',
                    onCallStart: () => {
                        // On the dedicated video page, we don't necessarily need to hide the chat
                        // but we'll keep the logic for consistency if needed.
                    },
                    onCallEnd: () => {
                        // Reset logic
                    }
                });
                document.getElementById('btnTrainerStartCall')?.addEventListener('click', () => {
                    if (!activeRoom) return showToast('Select a client first', 'error');
                    videoCallInstance.setRoom(activeRoom);
                    videoCallInstance.startCall();
                });
            }
            videoCallInstance.setRoom(room);
        }
    } catch (err) {
        console.error('[Trainer] openChat Error:', err);
        alert('Error opening chat: ' + err.message);
    }
}

document.getElementById('trainerChatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('trainerChatInput');
    if (!input.value.trim() || !activeRoom) return;
    socket.emit('send_message', {
        room: activeRoom,
        sender_id: trainerData.id,
        sender_name: trainerData.name,
        message: input.value.trim()
    });
    input.value = '';
});

// ── Nav ──
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.dataset.target;
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(target)?.classList.add('active');
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        document.getElementById('pageTitle').textContent = link.querySelector('span').textContent;
        
        // Mobile auto-close
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar')?.classList.remove('open');
            document.getElementById('sidebarOverlay')?.classList.add('hidden');
        }
    });
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('trainer_token');
    localStorage.removeItem('trainer_user');
    location.reload();
});

// ── Toast ──
function showToast(message, type = 'success') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'circle-exclamation'}"></i> ${message}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ── Init ──
(function() {
    const token = localStorage.getItem('trainer_token');
    if (token) { showDashboard(); }
})();
