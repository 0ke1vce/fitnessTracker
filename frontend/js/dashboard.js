let exercisesList = [];
let weightChartInstance = null;

async function initDashboard() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('userNameDisplay').textContent = user.name;
        }

        // Set date
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString(undefined, dateOptions);

        // Fetch initial data
        await fetchExercises();
        await loadDashboardData();
        
        setupDashboardListeners();
    } catch (error) {
        console.error('Failed to init dashboard', error);
    }
}

async function fetchExercises() {
    try {
        exercisesList = await ApiService.getExercises();
        const select = document.getElementById('exerciseSelect');
        const muscleFilter = document.getElementById('muscleFilter');

        const populateExercises = (filterBy = "") => {
            select.innerHTML = '<option value="">Select Exercise</option>';
            exercisesList
                .filter(ex => filterBy === "" || ex.muscle_group === filterBy)
                .forEach(ex => {
                    select.innerHTML += `<option value="${ex.id}">${ex.name} (${ex.muscle_group})</option>`;
                });
        };

        if (muscleFilter) {
            const muscles = [...new Set(exercisesList.map(e => e.muscle_group))];
            muscleFilter.innerHTML = '<option value="">All Muscles</option>';
            muscles.forEach(m => {
                muscleFilter.innerHTML += `<option value="${m}">${m}</option>`;
            });
            // remove old listener if replacing to avoid duplicates, but fine here
            muscleFilter.onchange = (e) => populateExercises(e.target.value);
        }

        if (select) {
            populateExercises();
        }
    } catch (error) {
        console.error(error);
    }
}

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
    } catch (error) {
        console.error(error);
    }
}

function renderWorkouts(workouts) {
    const list = document.getElementById('workoutsList');
    if (!list) return;

    if (workouts.length === 0) {
        list.innerHTML = '<p class="text-muted">No workouts scheduled yet.</p>';
        return;
    }

    list.innerHTML = workouts.map(w => `
        <div class="list-item">
            <div class="list-item-info">
                <h4>${w.exercise_name}</h4>
                <p><i class="fa-regular fa-calendar"></i> ${new Date(w.date).toLocaleDateString()} | ${w.sets} Sets x ${w.reps} Reps</p>
            </div>
            <div class="list-item-actions">
                <button onclick="deleteWorkout(${w.id})" title="Remove Workout"><i class="fa-solid fa-trash"></i></button>
            </div>
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
            <div class="list-item-info">
                <h4>${p.weight ? p.weight + ' kg' : 'Stats logged'}</h4>
                <p>
                    <i class="fa-regular fa-calendar"></i> ${new Date(p.date).toLocaleDateString()}
                    ${p.calories ? ` | <i class="fa-solid fa-fire text-gradient"></i> ${p.calories} kcal` : ''}
                </p>
                ${p.notes ? `<p class="text-muted" style="margin-top: 5px; font-size: 0.8rem;">${p.notes}</p>` : ''}
            </div>
            <div class="list-item-actions">
                <button onclick="deleteProgress(${p.id})" title="Remove Log"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function updateStats(workouts, progress) {
    document.getElementById('statWorkouts').textContent = workouts.length;
    
    if (progress.length > 0) {
        const latestWeight = progress[0].weight;
        document.getElementById('statWeight').textContent = latestWeight ? `${latestWeight} kg` : '-- kg';
    } else {
        document.getElementById('statWeight').textContent = '-- kg';
    }
}

function renderChart(progress) {
    const ctx = document.getElementById('weightChart');
    const emptyMsg = document.getElementById('emptyChartMessage');
    if (!ctx) return;

    const weightData = [...progress].reverse().filter(p => p.weight);
    
    if (weightData.length === 0) {
        ctx.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    } else {
        ctx.style.display = 'block';
        if (emptyMsg) emptyMsg.style.display = 'none';
    }

    const labels = weightData.map(p => new Date(p.date).toLocaleDateString());
    const dataPoints = weightData.map(p => p.weight);

    if (weightChartInstance) {
        weightChartInstance.destroy();
    }

    weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weight (kg)',
                data: dataPoints,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8' } },
                y: { ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function setupDashboardListeners() {
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

    // Sidebar navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const targetId = link.getAttribute('data-target');
            document.getElementById('pageTitle').textContent = link.textContent.trim();
            
            sections.forEach(sec => {
                if(sec.id === targetId) sec.classList.add('active');
                else sec.classList.remove('active');
            });
            
            // Auto close mobile menu on selection
            const sidebar = document.querySelector('.sidebar');
            if(sidebar) sidebar.classList.remove('expanded');
        });
    });

    // Mobile Hamburger Menu
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.toggle('expanded');
        });
    }
}

// Make globally available for inline onclick
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
