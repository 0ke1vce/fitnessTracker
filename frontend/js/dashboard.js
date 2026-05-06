let exercisesList = [];
let weightChartInstance = null;
let volumeChartInstance = null;
let onermChartInstance = null;
let activeTimer = null;
let secondsElapsed = 0;
let socket = null;
let activeTrainerRoom = null;

let _isDashboardInitializing = false;

async function initDashboard() {
    if (_isDashboardInitializing) return;
    _isDashboardInitializing = true;
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('userNameDisplay').textContent = user.name;
        }

        // Initialize Flatpickr for date inputs
        if (typeof flatpickr !== 'undefined') {
            flatpickr("#workoutDate", { defaultDate: "today", dateFormat: "Y-m-d" });
            flatpickr("#progressDate", { defaultDate: "today", dateFormat: "Y-m-d" });
        }

        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').innerHTML = `<i class="fa-regular fa-calendar"></i> ${new Date().toLocaleDateString(undefined, dateOptions)}`;

        // Mobile sidebar toggle
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (mobileBtn && sidebar && overlay) {
            mobileBtn.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('hidden'); });
            overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.add('hidden'); });
        }

        const [exercises, dashboardData, analyticsData, activePlan, profile, trainersSub, gamification] = await Promise.all([
            ApiService.getExercises(),
            loadDashboardData(),
            loadAdvancedAnalytics(),
            loadActivePlan(),
            loadProfileData(),
            loadTrainersAndSubscription(),
            loadGamificationStats()
        ]);
        
        // Populate exercises from the prefetched list
        exercisesList = exercises;
        populateExercisesUI();
        
        setupDashboardListeners();
        setupAILogic();
    } catch (error) {
        console.error('Failed to init dashboard', error);
    } finally {
        _isDashboardInitializing = false;
        hideLoader();
    }
}

function populateExercisesUI(filterBy = "") {
    const select = document.getElementById('exerciseSelect');
    const muscleFilter = document.getElementById('muscleFilter');
    const liveSelect = document.getElementById('liveWorkoutSelect');

    if (select) {
        let html = '<option value="">Select Exercise</option>';
        exercisesList
            .filter(ex => filterBy === "" || ex.muscle_group === filterBy)
            .forEach(ex => {
                html += `<option value="${ex.id}">${ex.name} (${ex.muscle_group})</option>`;
            });
        select.innerHTML = html;
    }
    
    if (muscleFilter && muscleFilter.innerHTML === '<option value="">All Muscles</option>') {
        const muscles = [...new Set(exercisesList.map(e => e.muscle_group))];
        let muscleHtml = '<option value="">All Muscles</option>';
        muscles.forEach(m => {
            muscleHtml += `<option value="${m}">${m}</option>`;
        });
        muscleFilter.innerHTML = muscleHtml;
        muscleFilter.onchange = (e) => populateExercisesUI(e.target.value);
    }

    if (liveSelect) {
        let liveHtml = '<option value="">Select exercise to start...</option>';
        exercisesList.forEach(ex => {
            liveHtml += `<option value="${ex.id}">${ex.name}</option>`;
        });
        liveSelect.innerHTML = liveHtml;
    }
}

async function loadGamificationStats() {
    try {
        const stats = await ApiService.getGamificationStats();
        if (stats) {
            document.getElementById('userLevel').textContent = stats.level;
            
            let xpNeeded = 100 * stats.level;
            let percentage = (stats.xp / xpNeeded) * 100;
            
            document.getElementById('xpText').textContent = `${stats.xp} / ${xpNeeded} XP`;
            document.getElementById('xpBar').style.width = `${Math.min(percentage, 100)}%`;

            const badgesContainer = document.getElementById('badgesContainer');
            if (badgesContainer && stats.badges) {
                if (stats.badges.length === 0) {
                    badgesContainer.innerHTML = '<p class="text-muted" style="grid-column: 1/-1;">No badges earned yet. Keep working out!</p>';
                } else {
                    badgesContainer.innerHTML = stats.badges.map(b => `
                        <div class="glass-panel" style="padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 5px; border-color: var(--neon-magenta);">
                            <i class="fa-solid ${b.icon_class} text-gradient" style="font-size: 2rem;"></i>
                            <strong style="font-size: 0.9rem;">${b.badge_name}</strong>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {}
}

async function loadProfileData() {
    try {
        const profile = await ApiService.getProfile();
        if (profile) {
            document.getElementById('profileName').value = profile.name || '';
            document.getElementById('profileAge').value = profile.age || '';
            document.getElementById('profileHeight').value = profile.height || '';
            document.getElementById('profileWeight').value = profile.weight || '';
            document.getElementById('profileGoalWeight').value = profile.goal_weight || '';
            
            if (profile.goal_weight) {
                document.getElementById('statGoal').textContent = profile.goal_weight + ' kg';
            }

            if (profile.profile_image) {
                document.getElementById('profileImagePreview').src = profile.profile_image;
                document.querySelector('.avatar').innerHTML = `<img src="${profile.profile_image}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            }
        }
    } catch (error) {}
}

// fetchExercises is now handled inside populateExercisesUI to avoid extra API calls

async function loadDashboardData() {
    try {
        const [workouts, progress] = await Promise.all([
            ApiService.getWorkouts(),
            ApiService.getProgress()
        ]);

        renderWorkouts(workouts);
        renderProgress(progress);
        updateStats(workouts, progress);
        if (typeof Chart !== 'undefined') {
            renderChart(progress);
        }
    } catch (error) {}
}

async function loadAdvancedAnalytics() {
    try {
        const [volData, onermData] = await Promise.all([
            ApiService.getVolumeAnalytics(),
            ApiService.getOneRMAnalytics()
        ]);
        if (typeof Chart !== 'undefined') {
            renderAdvancedCharts(volData.volume, onermData.onerm);
        }
    } catch(err) {}
}

async function loadActivePlan() {
    try {
        const res = await ApiService.getActivePlan();
        if (res.plan) {
            const list = document.getElementById('workoutsList');
            const planHtml = `
                <div style="background: rgba(0, 243, 255, 0.1); border-left: 4px solid var(--neon-cyan); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: var(--neon-cyan); margin-bottom: 5px;"><i class="fa-solid fa-bolt"></i> Active Plan: ${res.plan.plan_name}</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">Goal: ${res.plan.goal.toUpperCase()}</p>
                </div>
            `;
            if (list) list.insertAdjacentHTML('afterbegin', planHtml);
        }
    } catch(err) {}
}

async function loadTrainersAndSubscription() {
    try {
        const [trainersRes, subRes] = await Promise.all([
            ApiService.getTrainers(),
            ApiService.getActiveSubscription()
        ]);

        const list = document.getElementById('trainersList');
        if (trainersRes.trainers && list) {
            list.innerHTML = trainersRes.trainers.map(t => {
                const isSubscribed = subRes.subscription && subRes.subscription.trainer_id === t.id;
                const bannerColors = ['from-purple-600 to-cyan-500','from-pink-500 to-orange-500','from-green-500 to-cyan-500','from-blue-600 to-purple-500'];
                const gradients = [
                    'linear-gradient(135deg,rgba(99,102,241,0.6),rgba(6,182,212,0.6))',
                    'linear-gradient(135deg,rgba(236,72,153,0.6),rgba(249,115,22,0.6))',
                    'linear-gradient(135deg,rgba(16,185,129,0.6),rgba(6,182,212,0.6))',
                    'linear-gradient(135deg,rgba(37,99,235,0.6),rgba(99,102,241,0.6))'
                ];
                const grad = gradients[t.id % gradients.length];
                const avatarLetter = (t.name || 'T').charAt(0).toUpperCase();
                return `
                <div class="trainer-card">
                    <div class="trainer-card-banner" style="background:${grad}"></div>
                    <div class="trainer-card-body">
                        <div class="trainer-avatar" style="display:flex;align-items:center;justify-content:center">
                            ${t.profile_image ? `<img src="${t.profile_image}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : avatarLetter}
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
                            <div>
                                <div class="trainer-name">${t.name} <i class="fa-solid fa-circle-check" style="color:var(--neon-cyan);font-size:0.85rem"></i></div>
                                <div class="trainer-spec">${t.specialty}</div>
                            </div>
                            <div class="trainer-rating"><i class="fa-solid fa-star"></i> ${t.rating || '5.0'}</div>
                        </div>
                        <p class="trainer-bio">${t.bio || 'Certified professional coach ready to help you reach your fitness goals.'}</p>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                            <div class="trainer-price">$${t.monthly_price}<span>/month</span></div>
                            ${isSubscribed ? '<span class="badge badge-green"><i class="fa-solid fa-check"></i> Subscribed</span>' : ''}
                        </div>
                        ${isSubscribed 
                            ? `<button class="btn-secondary" style="width:100%" disabled><i class="fa-solid fa-comments"></i> Message Trainer</button>` 
                            : `<button class="btn-primary" style="width:100%" onclick="subscribeTrainer(${t.id})"><i class="fa-solid fa-bolt"></i> Hire Trainer</button>`}
                    </div>
                </div>`;
            }).join('');
        }

        if (subRes.subscription) {
            document.getElementById('navChat').classList.remove('hidden');
            document.getElementById('chatTrainerName').textContent = subRes.subscription.trainer_name;
            setupSocketIO(subRes.subscription);
        }
    } catch(err) {}
}

function renderWorkouts(workouts) {
    const list = document.getElementById('workoutsList');
    if (!list) return;

    if (workouts.length === 0) {
        list.innerHTML = '<p class="text-muted">No workouts logged yet.</p>';
        return;
    }

    list.innerHTML = workouts.map(w => `
        <div class="list-item">
            <div class="item-main">
                <div class="item-title"><i class="fa-solid fa-dumbbell" style="color:var(--neon-purple);margin-right:8px;font-size:0.85rem"></i>${w.exercise_name}</div>
                <div class="item-sub"><i class="fa-regular fa-calendar" style="margin-right:4px"></i>${new Date(w.date).toLocaleDateString()} &nbsp;·&nbsp; ${w.sets} Sets × ${w.reps} Reps</div>
            </div>
            <button class="item-action" onclick="deleteWorkout(${w.id})" title="Remove"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function renderProgress(progress) {
    const list = document.getElementById('progressList');
    if (!list) return;

    if (progress.length === 0) {
        list.innerHTML = '<p class="text-muted">No progress logged yet.</p>';
        return;
    }

    list.innerHTML = progress.map(p => `
        <div class="list-item">
            <div class="item-main">
                <div class="item-title">${p.weight ? `<span style="color:var(--neon-cyan)">${p.weight} kg</span>` : 'Stats logged'} ${p.calories ? `<span style="color:var(--text-muted);font-size:0.82rem;margin-left:8px">· ${p.calories} kcal</span>` : ''}</div>
                <div class="item-sub"><i class="fa-regular fa-calendar" style="margin-right:4px"></i>${new Date(p.date).toLocaleDateString()} ${p.notes ? `&nbsp;·&nbsp; ${p.notes}` : ''}</div>
            </div>
            <button class="item-action" onclick="deleteProgress(${p.id})" title="Remove"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function updateStats(workouts, progress) {
    document.getElementById('statWorkouts').textContent = workouts.length;
    if (progress.length > 0) {
        document.getElementById('statWeight').textContent = progress[0].weight ? `${progress[0].weight} kg` : '-- kg';
    } else {
        document.getElementById('statWeight').textContent = '-- kg';
    }
}

function renderChart(progress) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;
    const weightData = [...progress].reverse().filter(p => p.weight);
    if (weightData.length === 0) return;

    const labels = weightData.map(p => new Date(p.date).toLocaleDateString());
    const dataPoints = weightData.map(p => p.weight);

    if (weightChartInstance) weightChartInstance.destroy();
    weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Body Weight (kg)',
                data: dataPoints,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.08)',
                borderWidth: 2.5, tension: 0.4, fill: true,
                pointBackgroundColor: '#6366f1',
                pointRadius: 4, pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(20,20,28,0.9)', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1 } },
            scales: { x: { display: true, ticks: { color: '#4b5563', maxRotation: 0 }, grid: { display: false } }, y: { ticks: { color: '#4b5563' }, grid: { color: 'rgba(255,255,255,0.04)' } } }
        }
    });
}

function renderAdvancedCharts(volumeData, onermData) {
    const volCtx = document.getElementById('volumeChart');
    if (volCtx && volumeData.length > 0) {
        if (volumeChartInstance) volumeChartInstance.destroy();
        const labels = [...new Set(volumeData.map(v => new Date(v.date).toLocaleDateString()))];
        const dailyVols = labels.map(date => {
            return volumeData.filter(v => new Date(v.date).toLocaleDateString() === date).reduce((sum, v) => sum + parseFloat(v.volume), 0);
        });

        volumeChartInstance = new Chart(volCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Total Tonnage (kg)',
                    data: dailyVols,
                    backgroundColor: '#ff00ea',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const onermCtx = document.getElementById('onermChart');
    if (onermCtx && onermData.length > 0) {
        if (onermChartInstance) onermChartInstance.destroy();
        const labels = [...new Set(onermData.map(v => new Date(v.date).toLocaleDateString()))];
        const exercises = [...new Set(onermData.map(v => v.exercise))].slice(0, 3);
        const datasets = exercises.map((ex, i) => {
            const colors = ['#39ff14', '#00f3ff', '#ffb700'];
            return {
                label: ex,
                data: labels.map(date => {
                    const record = onermData.find(v => new Date(v.date).toLocaleDateString() === date && v.exercise === ex);
                    return record ? record.estimated_1rm : null;
                }),
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length],
                tension: 0.3,
                spanGaps: true,
                pointRadius: 6,
                showLine: true
            };
        });

        onermChartInstance = new Chart(onermCtx, {
            type: 'line',
            data: { labels, datasets },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function setupSocketIO(subscription) {
    if (typeof io === 'undefined') return;
    
    // Connect to server
    // Connect to server - always point to port 5000 if we're on the dev port 3000
    const serverUrl = window.location.port === '3000' 
        ? `http://${window.location.hostname}:5000` 
        : `http://${window.location.hostname}:${window.location.port}`;
    
    socket = io(serverUrl);
    
    activeTrainerRoom = `trainer_${subscription.trainer_id}_client_${subscription.client_id}`;
    
    socket.on('connect', () => {
        socket.emit('join_room', activeTrainerRoom);
    });

    socket.on('receive_message', (data) => {
        const msgContainer = document.getElementById('chatMessages');
        const user = JSON.parse(localStorage.getItem('user'));
        const isMe = data.sender_id === user.id;
        
        const msgHtml = `
            <div class="msg-bubble ${isMe ? 'outgoing' : 'incoming'}">
                <small style="opacity:0.6;display:block;margin-bottom:4px;font-size:0.75rem">${isMe ? 'You' : subscription.trainer_name}</small>
                ${data.message}
            </div>
        `;
        msgContainer.insertAdjacentHTML('beforeend', msgHtml);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    });

    document.getElementById('chatForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        if (input.value.trim() !== '') {
            const user = JSON.parse(localStorage.getItem('user'));
            socket.emit('send_message', {
                room: activeTrainerRoom,
                sender_id: user.id,
                sender_name: user.name || 'User',
                message: input.value
            });
            input.value = '';
        }
    });

    // Load chat history
    socket.emit('get_history', activeTrainerRoom);
    socket.on('message_history', (msgs) => {
        const container = document.getElementById('chatMessages');
        const user = JSON.parse(localStorage.getItem('user'));
        container.innerHTML = msgs.map(m => {
            const isMe = m.sender_id === user.id;
            return `<div class="msg-bubble ${isMe ? 'outgoing' : 'incoming'}">
                <small style="opacity:0.6;display:block;margin-bottom:3px;font-size:0.72rem">${m.sender_name || (isMe ? 'You' : subscription.trainer_name)}</small>
                ${m.message}
            </div>`;
        }).join('');
        container.scrollTop = container.scrollHeight;
    });

    // ── Video Call ──
    if (typeof VideoCall !== 'undefined') {
        const vc = new VideoCall(socket, {
            onCallStart: () => {
                document.getElementById('chatInterface')?.classList.add('hidden');
            },
            onCallEnd: () => {
                document.getElementById('chatInterface')?.classList.remove('hidden');
            }
        });
        document.getElementById('btnStartVideoCall')?.addEventListener('click', () => {
            vc.startCall();
        });
        vc.setRoom(activeTrainerRoom);
    }
}

function setupAILogic() {
    const toggleBtn = document.getElementById('aiToggleBtn');
    const panel = document.getElementById('aiChatPanel');
    const form = document.getElementById('aiForm');
    const input = document.getElementById('aiInput');
    const msgs = document.getElementById('aiMessages');
    const btnVoice = document.getElementById('btnVoiceCommand');

    let isRecording = false;
    let recognition = null;
    let synth = window.speechSynthesis;

    // Setup Web Speech API
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isRecording = true;
            btnVoice.style.color = 'var(--error)';
            btnVoice.style.borderColor = 'var(--error)';
            input.placeholder = "Listening...";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            form.dispatchEvent(new Event('submit'));
        };

        recognition.onerror = (event) => {
            console.error(event.error);
            btnVoice.style.color = '';
            btnVoice.style.borderColor = '';
            input.placeholder = "Ask AI...";
            showToast('Voice recognition failed', 'error');
        };

        recognition.onend = () => {
            isRecording = false;
            btnVoice.style.color = '';
            btnVoice.style.borderColor = '';
            input.placeholder = "Ask AI...";
        };

        btnVoice.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        btnVoice.style.display = 'none'; // Hide if not supported
    }

    const speak = (text) => {
        if (synth && synth.speaking) {
            synth.cancel();
        }
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.rate = 1.0;
        synth.speak(utterThis);
    };

    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('hidden');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        sendAI();
    });

    document.getElementById('btnSendAI')?.addEventListener('click', sendAI);

    function sendAI() {
        const text = input.value.trim();
        if (!text) return;

        // User message
        msgs.insertAdjacentHTML('beforeend', `<div class="ai-msg user">${text}</div>`);
        input.value = '';
        msgs.scrollTop = msgs.scrollHeight;

        // Mock AI response with voice commands check
        setTimeout(() => {
            let reply = "I'm your AI assistant! Keep pushing hard! Let me know if you need a new routine.";
            if (text.toLowerCase().includes('workout') || text.toLowerCase().includes('routine')) {
                reply = "I can generate a routine for you! Just head to the Workouts tab and click 'AI Generate Plan'.";
            } else if (text.toLowerCase().includes('tired') || text.toLowerCase().includes('sore')) {
                reply = "Listen to your body! Consider an active recovery day. Your muscles grow while you rest!";
            } else if (text.toLowerCase().includes('eat') || text.toLowerCase().includes('food')) {
                reply = "Nutrition is key! Aim for 1.6 to 2.2 grams of protein per kg of bodyweight to maximize muscle growth.";
            }

            msgs.insertAdjacentHTML('beforeend', `<div class="ai-msg bot">${reply}</div>`);
            msgs.scrollTop = msgs.scrollHeight;
            speak(reply); // Make the AI speak!
        }, 1000);
    } // end sendAI
} // end setupAILogic

function setupDashboardListeners() {
    // Profile image preview handling (Base64)
    document.getElementById('profileImageInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profileImagePreview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Profile form
    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('profileName').value,
            age: document.getElementById('profileAge').value,
            height: document.getElementById('profileHeight').value,
            weight: document.getElementById('profileWeight').value,
            goal_weight: document.getElementById('profileGoalWeight').value,
            profile_image: document.getElementById('profileImagePreview').src // Send base64
        };
        try {
            await ApiService.updateProfile(data);
            showToast('Profile Updated Successfully', 'success');
            loadProfileData(); // reload stats
        } catch (error) {}
    });

    const workoutForm = document.getElementById('workoutForm');
    if (workoutForm) {
        workoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                exercise_id: document.getElementById('exerciseSelect').value,
                date: document.getElementById('workoutDate').value,
                sets: document.getElementById('workoutSets').value,
                reps: document.getElementById('workoutReps').value,
            };
            try {
                await ApiService.addWorkout(data);
                showToast('Workout added successfully', 'success');
                workoutForm.reset();
                loadDashboardData();
            } catch (error) {}
        });
    }

    const progressForm = document.getElementById('progressForm');
    if (progressForm) {
        progressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                date: document.getElementById('progressDate').value,
                weight: document.getElementById('progressWeight').value,
                calories: document.getElementById('progressCalories').value,
                notes: document.getElementById('progressNotes').value,
            };
            try {
                await ApiService.addProgress(data);
                showToast('Progress logged successfully', 'success');
                progressForm.reset();
                loadDashboardData();
            } catch (error) {}
        });
    }

    // Navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.content-section');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById('pageTitle').textContent = link.textContent.trim();
            sections.forEach(sec => sec.classList.toggle('active', sec.id === targetId));
        });
    });

    // AI Generator
    const btnGen = document.getElementById('btnGenerateAI');
    if (btnGen) {
        btnGen.addEventListener('click', async () => {
            try {
                const goals = ['hypertrophy', 'strength', 'endurance', 'weight_loss'];
                const goal = prompt("Enter your goal (hypertrophy, strength, endurance, weight_loss):", "hypertrophy");
                if (goals.includes(goal)) {
                    await ApiService.generateWorkoutPlan(goal);
                    showToast('AI Plan Generated! Switching context...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else if(goal) {
                    showToast('Invalid goal entered', 'error');
                }
            } catch (error) {}
        });
    }
    // Close sidebar on nav link click (mobile)
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            if (window.innerWidth <= 768) {
                sidebar?.classList.remove('open');
                overlay?.classList.add('hidden');
            }
        });
    });


    // Live Workout Mode Logic
    const btnStart = document.getElementById('btnStartLive');
    const prePanel = document.getElementById('preWorkoutPanel');
    const awPanel = document.getElementById('activeWorkoutPanel');
    const liveSelect = document.getElementById('liveWorkoutSelect');
    const awTimer = document.getElementById('awTimer');
    const awTimerLabel = document.getElementById('awTimerLabel');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if(!liveSelect.value) {
                showToast('Select an exercise first!', 'warning');
                return;
            }
            prePanel.classList.add('hidden');
            awPanel.classList.remove('hidden');
            document.getElementById('awExerciseName').textContent = liveSelect.options[liveSelect.selectedIndex].text;
            
            secondsElapsed = 0;
            awTimerLabel.textContent = "Workout Active";
            awTimer.style.color = 'var(--neon-cyan)';
            if(activeTimer) clearInterval(activeTimer);
            activeTimer = setInterval(() => {
                secondsElapsed++;
                awTimer.textContent = formatTime(secondsElapsed);
            }, 1000);
        });
    }

    document.getElementById('btnEndWorkout')?.addEventListener('click', () => {
        clearInterval(activeTimer);
        prePanel.classList.remove('hidden');
        awPanel.classList.add('hidden');
        showToast('Workout Ended. Great job!', 'success');
        loadDashboardData();
        loadAdvancedAnalytics();
    });

    let restTimerInterval = null;
    document.getElementById('btnLogSet')?.addEventListener('click', async () => {
        const weight = document.getElementById('awWeight').value;
        const reps = document.getElementById('awReps').value;
        if (!weight || !reps) return showToast('Enter weight and reps', 'warning');
        
        try {
            await ApiService.addWorkout({
                exercise_id: liveSelect.value,
                date: new Date().toISOString().split('T')[0],
                sets: 1, reps, weight_used: weight, rpe: 8, rest_time_seconds: 0
            });
            showToast('Set Logged!', 'success');
            document.getElementById('awReps').value = '';
            
            clearInterval(activeTimer);
            let restSeconds = 90;
            awTimerLabel.textContent = "REST";
            awTimer.style.color = 'var(--neon-magenta)';
            
            if(restTimerInterval) clearInterval(restTimerInterval);
            restTimerInterval = setInterval(() => {
                restSeconds--;
                awTimer.textContent = formatTime(restSeconds);
                if (restSeconds <= 0) {
                    clearInterval(restTimerInterval);
                    showToast('Rest is over! Get back to it!', 'warning');
                    secondsElapsed = 0;
                    awTimerLabel.textContent = "Workout Active";
                    awTimer.style.color = 'var(--neon-cyan)';
                    activeTimer = setInterval(() => {
                        secondsElapsed++;
                        awTimer.textContent = formatTime(secondsElapsed);
                    }, 1000);
                }
            }, 1000);
        } catch(err) {}
    });

    document.getElementById('btnSkipRest')?.addEventListener('click', () => {
        if(restTimerInterval) clearInterval(restTimerInterval);
        secondsElapsed = 0;
        awTimerLabel.textContent = "Workout Active";
        awTimer.style.color = 'var(--neon-cyan)';
        if(activeTimer) clearInterval(activeTimer);
        activeTimer = setInterval(() => {
            secondsElapsed++;
            awTimer.textContent = formatTime(secondsElapsed);
        }, 1000);
    });

    // Mock Video Call logic
    document.getElementById('btnStartVideoCall')?.addEventListener('click', () => {
        document.getElementById('chatInterface').classList.add('hidden');
        document.getElementById('videoCallInterface').classList.remove('hidden');
        
        let videoSeconds = 0;
        const vTimer = document.getElementById('videoTimer');
        setInterval(() => {
            videoSeconds++;
            vTimer.textContent = formatTime(videoSeconds);
        }, 1000);
        showToast('Connecting to trainer via Secure WebRTC...', 'success');
    });

    document.getElementById('btnEndCall')?.addEventListener('click', () => {
        document.getElementById('videoCallInterface').classList.add('hidden');
        document.getElementById('chatInterface').classList.remove('hidden');
        showToast('Video call ended.', 'warning');
    });
}

// Make globally available
window.subscribeTrainer = async (id) => {
    try {
        await ApiService.subscribeToTrainer(id);
        showToast('🎉 Successfully Subscribed! Opening chat...', 'success');
        // Reload trainer cards + subscription data in place
        await loadTrainersAndSubscription();
        // Navigate to Chat & Video section
        setTimeout(() => {
            const chatLink = document.querySelector('[data-target="trainer-chat"]');
            if (chatLink) {
                chatLink.click();
            }
        }, 1000);
    } catch (e) {
        showToast('Failed to subscribe. Try again.', 'error');
    }
};

window.deleteWorkout = async (id) => {
    if(confirm('Are you sure you want to delete this workout?')) {
        try {
            await ApiService.deleteWorkout(id);
            showToast('Workout removed', 'success');
            loadDashboardData();
        } catch (error) {}
    }
};

window.deleteProgress = async (id) => {
    if(confirm('Are you sure you want to delete this log?')) {
        try {
            await ApiService.deleteProgress(id);
            showToast('Log removed', 'success');
            loadDashboardData();
        } catch (error) {}
    }
};
