import React, { useEffect, useRef, useState } from 'react';

// Using global window.tf and window.poseDetection loaded via CDN in index.html to avoid Vite bundler errors with MediaPipe

const CONNECTIONS = [
    ['nose', 'left_eye'], ['nose', 'right_eye'], ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
    ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
    ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'], ['left_hip', 'left_knee'],
    ['right_hip', 'right_knee'], ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
];

export default function AIVision() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isTracking, setIsTracking] = useState(false);
    const detectorRef = useRef(null);
    const requestRef = useRef();

    const startTracking = async () => {
        setIsTracking(true);
        try {
            await tf.ready();
            const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
            detectorRef.current = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    detectPose();
                };
            }
        } catch (err) {
            console.error("AI Tracker failed:", err);
            setIsTracking(false);
        }
    };

    const stopTracking = () => {
        setIsTracking(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    useEffect(() => {
        return () => stopTracking(); // Cleanup on unmount
    }, []);

    const detectPose = async () => {
        if (!videoRef.current || !canvasRef.current || !detectorRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (video.readyState === 4) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const poses = await detectorRef.current.estimatePoses(video);
            
            if (poses.length > 0) {
                drawSkeleton(poses[0].keypoints, ctx);
            }
            ctx.restore();
        }
        
        if (isTracking) {
            requestRef.current = requestAnimationFrame(detectPose);
        }
    };

    const drawSkeleton = (keypoints, ctx) => {
        const minConfidence = 0.3;
        const keypointMap = {};
        keypoints.forEach(kp => { keypointMap[kp.name] = kp; });

        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 4;
        CONNECTIONS.forEach(([kp1, kp2]) => {
            const p1 = keypointMap[kp1];
            const p2 = keypointMap[kp2];
            if (p1 && p2 && p1.score > minConfidence && p2.score > minConfidence) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        });

        ctx.fillStyle = '#ff00ea';
        keypoints.forEach(kp => {
            if (kp.score > minConfidence) {
                ctx.beginPath();
                ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>AI Computer Vision Tracker</h2>
            <p style={{ color: 'var(--text-muted)' }}>Real-time pose estimation using TensorFlow.js</p>
            
            {!isTracking ? (
                <button onClick={startTracking} className="btn-primary" style={{ margin: '20px 0' }}>Enable AI Form Tracker</button>
            ) : (
                <button onClick={stopTracking} className="btn-primary" style={{ margin: '20px 0', background: 'var(--error)' }}>Disable Tracker</button>
            )}

            <div className={`glass-panel ${!isTracking ? 'hidden' : ''}`} style={{ position: 'relative', maxWidth: '640px', margin: '0 auto', overflow: 'hidden', border: '2px solid var(--neon-cyan)' }}>
                <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
                <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: '5px', color: 'var(--neon-lime)' }}>
                    AI Vision Active
                </div>
            </div>
        </div>
    );
}
