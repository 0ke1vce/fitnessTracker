import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Activity, Dumbbell, User, Award, Video, LogOut } from 'lucide-react';
import AIVision from '../components/AIVision';
import WorkoutsView from '../components/WorkoutsView';
import ProfileView from '../components/ProfileView';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';

function DashboardScene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#00f3ff" />
      <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
      <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[4, 2, -10]}>
          <icosahedronGeometry args={[2, 0]} />
          <meshStandardMaterial color="#ff00ea" wireframe />
        </mesh>
      </Float>
      <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} enablePan={false} />
    </>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    api.getGamificationStats().then(setStats).catch(console.error);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <h1 style={{ marginTop: 0 }}>Dashboard Overview</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--neon-cyan)' }}>Level {stats?.level || 1}</h3>
              <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}>
                <div style={{ width: `${Math.min(((stats?.xp || 0) % 100), 100)}%`, height: '100%', background: 'var(--neon-magenta)', borderRadius: '5px' }} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>{stats?.xp || 0} XP</p>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--neon-lime)' }}><Award /> Recent Badges</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {stats?.badges?.length > 0 ? stats.badges.map(b => (
                  <div key={b.badge_name} title={b.description} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>{b.badge_name}</div>
                )) : <p style={{ color: 'var(--text-muted)' }}>No badges yet.</p>}
              </div>
            </div>
          </div>
        </>
      );
    }
    if (activeTab === 'workouts') return <WorkoutsView />;
    if (activeTab === 'vision') return <AIVision />;
    if (activeTab === 'profile') return <ProfileView />;
  };

  return (
    <div className="app-container">
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
        <Canvas camera={{ position: [0, 0, 10] }}>
          <DashboardScene />
        </Canvas>
      </div>
      <nav className="hud-sidebar glass-panel" style={{ zIndex: 10 }}>
        <h2 className="text-gradient" style={{ margin: '0 0 20px 0' }}>FitTrack OS</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
          <button onClick={() => setActiveTab('overview')} className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}><Activity size={20} /> Overview</button>
          <button onClick={() => setActiveTab('workouts')} className={`nav-link ${activeTab === 'workouts' ? 'active' : ''}`}><Dumbbell size={20} /> Workouts</button>
          <button onClick={() => setActiveTab('profile')} className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}><User size={20} /> Profile</button>
          <button onClick={() => setActiveTab('vision')} className={`nav-link ${activeTab === 'vision' ? 'active' : ''}`} style={{ color: 'var(--neon-lime)' }}><Video size={20} /> AI Vision</button>
        </div>
        <button onClick={handleLogout} className="btn-primary" style={{ background: 'var(--error)' }}>
          <LogOut size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Logout
        </button>
      </nav>
      <main className="hud-content" style={{ zIndex: 10 }}>
        {renderContent()}
      </main>
    </div>
  );
}
