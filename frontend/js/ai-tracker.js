let aiTrackerEnabled = false;
let detector;
let videoElement;
let canvasElement;
let ctx;
let animationId;

// Standard body keypoint connections for drawing the skeleton
const CONNECTIONS = [
    ['nose', 'left_eye'], ['nose', 'right_eye'], ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
    ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
    ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'], ['left_hip', 'left_knee'],
    ['right_hip', 'right_knee'], ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
];

document.addEventListener('DOMContentLoaded', () => {
    const btnToggleAI = document.getElementById('btnToggleAI');
    if(btnToggleAI) {
        btnToggleAI.addEventListener('click', toggleAITracker);
    }
    // Pre-load model in background
    setTimeout(preLoadModel, 1000);
});

async function preLoadModel() {
    try {
        if (!detector && typeof poseDetection !== 'undefined') {
            console.log('[AI] Pre-loading model...');
            const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
            detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
            console.log('[AI] Model ready.');
        }
    } catch (e) { console.warn('[AI] Pre-load failed:', e); }
}

async function toggleAITracker() {
    const container = document.getElementById('aiTrackerContainer');
    const btn = document.getElementById('btnToggleAI');
    
    if (aiTrackerEnabled) {
        // Turn off
        aiTrackerEnabled = false;
        container.classList.add('hidden');
        btn.innerHTML = '<i class="fa-solid fa-eye"></i> Enable AI Form Tracker';
        btn.style.color = 'var(--neon-cyan)';
        btn.style.borderColor = 'var(--neon-cyan)';
        stopWebcam();
        if (animationId) cancelAnimationFrame(animationId);
    } else {
        // Turn on
        aiTrackerEnabled = true;
        container.classList.remove('hidden');
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Disable AI Form Tracker';
        btn.style.color = 'var(--error)';
        btn.style.borderColor = 'var(--error)';
        
        await initAITracker();
    }
}

async function initAITracker() {
    videoElement = document.getElementById('trackerVideo');
    canvasElement = document.getElementById('trackerCanvas');
    ctx = canvasElement.getContext('2d');

    const statusMsg = document.createElement('div');
    statusMsg.id = 'aiStatusMsg';
    statusMsg.style = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; text-align:center; z-index:5; font-family: Inter, sans-serif; font-size: 0.9rem;';
    statusMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing Camera...';
    canvasElement.parentElement.appendChild(statusMsg);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: 'user' } 
        });
        videoElement.srcObject = stream;
        
        await new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play().then(resolve).catch(resolve);
            };
        });
        
        canvasElement.width = videoElement.videoWidth || 640;
        canvasElement.height = videoElement.videoHeight || 480;

        // Load Pose Detection Model if not pre-loaded
        if (!detector) {
            statusMsg.innerHTML = '<i class="fa-solid fa-microchip fa-spin"></i> Initializing AI Engine...';
            const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
            detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        }

        statusMsg.remove();
        detectPose();

    } catch (err) {
        console.error('AI Tracker Error:', err);
        statusMsg.style.color = 'var(--error)';
        statusMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Error: ' + (err.name === 'NotAllowedError' ? 'Camera Denied' : 'AI Failed');
        setTimeout(() => statusMsg.remove(), 4000);
        aiTrackerEnabled = false;
        document.getElementById('btnToggleAI').innerHTML = '<i class="fa-solid fa-eye"></i> Enable AI Form Tracker';
    }
}

function stopWebcam() {
    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
    }
}

async function detectPose() {
    if (!aiTrackerEnabled) return;

    // Draw video frame to canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Mirror the video horizontally
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvasElement.width, 0);
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // Run pose estimation
    const poses = await detector.estimatePoses(videoElement);
    
    if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        drawSkeleton(keypoints);
    }

    ctx.restore();
    animationId = requestAnimationFrame(detectPose);
}

function drawSkeleton(keypoints) {
    const minConfidence = 0.3;

    // Create a map for easy connection lookup
    const keypointMap = {};
    keypoints.forEach(kp => {
        keypointMap[kp.name] = kp;
    });

    // Draw Connections (Bones)
    ctx.strokeStyle = '#39ff14'; // Neon Lime
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

    // Draw Keypoints (Joints)
    ctx.fillStyle = '#ff00ea'; // Neon Magenta
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
}
