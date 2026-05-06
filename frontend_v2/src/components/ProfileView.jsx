import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function ProfileView() {
    const [profile, setProfile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = () => {
        api.getProfile().then(setProfile).catch(console.error);
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile({ ...profile, profile_image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateProfile(profile);
            alert('Profile saved successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile');
        }
        setIsSaving(false);
    };

    if (!profile) return <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>;

    return (
        <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 className="text-gradient">My Profile</h2>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#333', border: '2px solid var(--neon-cyan)', overflow: 'hidden' }}>
                    {profile.profile_image ? (
                        <img src={profile.profile_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Avatar</div>
                    )}
                </div>
                <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{profile.name}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>{profile.email}</p>
                    <label style={{ display: 'inline-block', marginTop: '10px', cursor: 'pointer', color: 'var(--neon-cyan)', fontSize: '0.9rem' }}>
                        Change Photo <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div className="input-group">
                    <label style={{ display:'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Age</label>
                    <input type="number" name="age" className="input-field" value={profile.age || ''} onChange={handleChange} />
                </div>
                <div className="input-group">
                    <label style={{ display:'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Height (cm)</label>
                    <input type="number" name="height" className="input-field" value={profile.height || ''} onChange={handleChange} />
                </div>
                <div className="input-group">
                    <label style={{ display:'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Current Weight (kg)</label>
                    <input type="number" name="weight" className="input-field" value={profile.weight || ''} onChange={handleChange} />
                </div>
                <div className="input-group">
                    <label style={{ display:'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Goal Weight (kg)</label>
                    <input type="number" name="goal_weight" className="input-field" value={profile.goal_weight || ''} onChange={handleChange} />
                </div>
            </div>
            
            <button onClick={handleSave} disabled={isSaving} className="btn-primary" style={{ marginTop: '30px' }}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
}
