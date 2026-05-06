import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#00f3ff" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#ff00ea" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
        <mesh>
          <torusKnotGeometry args={[2, 0.5, 128, 32]} />
          <meshStandardMaterial color="#333" roughness={0.1} metalness={0.8} />
        </mesh>
      </Float>
      
      <OrbitControls autoRotate enableZoom={false} />
    </>
  );
}

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (isRegistering) {
        res = await api.register({ name, email, password });
      } else {
        res = await api.login(email, password);
      }
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user || { id: res.id, name: res.name, email: res.email }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-container">
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <Canvas camera={{ position: [0, 0, 8] }}>
          <Scene />
        </Canvas>
      </div>

      <div className="auth-container glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>FitTrack</h1>
          <p style={{ color: 'var(--text-muted)' }}>The Ultimate Social Fitness Platform</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
            <button onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: !isRegistering ? 'var(--neon-cyan)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>Login</button>
            <button onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: isRegistering ? 'var(--neon-magenta)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>Register</button>
        </div>

        {error && <p style={{ color: 'var(--error)', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          {isRegistering && (
             <input 
               type="text" 
               className="input-field" 
               placeholder="Full Name" 
               value={name}
               onChange={e => setName(e.target.value)}
               required 
             />
          )}
          <input 
            type="email" 
            className="input-field" 
            placeholder="Email Address" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            className="input-field" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required 
          />
          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
            {isRegistering ? 'CREATE ACCOUNT' : 'ENTER MAINFRAME'}
          </button>
        </form>
      </div>
    </div>
  );
}
