import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function WorkoutsView() {
    const [workouts, setWorkouts] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [formData, setFormData] = useState({
        exercise_id: '', date: new Date().toISOString().split('T')[0], sets: '', reps: '', weight_used: ''
    });

    useEffect(() => {
        fetchWorkouts();
        api.getExercises().then(setExercises).catch(console.error);
    }, []);

    const fetchWorkouts = () => {
        api.getWorkouts().then(setWorkouts).catch(console.error);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.addWorkout(formData);
            alert('Workout added! You earned 50 XP.');
            setFormData({ ...formData, sets: '', reps: '', weight_used: '' });
            fetchWorkouts();
        } catch (err) {
            console.error('Error adding workout', err);
            alert('Failed to add workout');
        }
    };

    return (
        <div>
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
                <h2 className="text-gradient" style={{ marginTop: 0 }}>Log New Workout</h2>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', alignItems: 'end' }}>
                    <div className="input-group">
                        <label style={{ display:'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Exercise</label>
                        <select className="input-field" value={formData.exercise_id} onChange={e => setFormData({...formData, exercise_id: e.target.value})} required style={{ padding: '10px', background: 'var(--panel-bg)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <option value="">Select Exercise</option>
                            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label style={{ display:'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Date</label>
                        <input type="date" className="input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label style={{ display:'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Sets</label>
                        <input type="number" min="1" className="input-field" value={formData.sets} onChange={e => setFormData({...formData, sets: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label style={{ display:'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Reps</label>
                        <input type="number" min="1" className="input-field" value={formData.reps} onChange={e => setFormData({...formData, reps: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label style={{ display:'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Weight (kg)</label>
                        <input type="number" step="0.1" className="input-field" value={formData.weight_used} onChange={e => setFormData({...formData, weight_used: e.target.value})} />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '12px' }}>Add Workout</button>
                </form>
            </div>

            <h2 className="text-gradient">Workout History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                {workouts.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No workouts logged yet. Time to hit the gym!</p>
                ) : (
                    workouts.map((w, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--neon-cyan)' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{w.exercise_name || `Exercise ID: ${w.exercise_id}`}</h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{new Date(w.date).toLocaleDateString()}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{w.sets} Sets</span> x {w.reps} Reps
                                {w.weight_used > 0 && <span style={{ marginLeft: '10px', color: 'var(--neon-lime)' }}>@ {w.weight_used}kg</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
