// ── WebRTC Video Call Module (Optimized + Debug) ──

class VideoCall {
    constructor(socket, opts = {}) {
        this.socket = socket;
        this.room = null;
        this.pc = null;
        this.localStream = null;
        this.remoteStream = null;
        this.callTimer = null;
        this.seconds = 0;
        this.active = false;

        this.localVideo = document.getElementById(opts.localVideoId || 'localVideo');
        this.remoteVideo = document.getElementById(opts.remoteVideoId || 'remoteVideo');
        this.timerEl = document.getElementById(opts.timerId || 'videoTimer');
        this.callUI = document.getElementById(opts.callUIId || 'videoCallInterface');
        this.btnMic = document.getElementById(opts.btnMicId || 'btnMic');
        this.btnCam = document.getElementById(opts.btnCamId || 'btnCam');
        this.btnEnd = document.getElementById(opts.btnEndId || 'btnEndCall');

        this.micOn = true;
        this.camOn = true;

        this.onCallStart = opts.onCallStart || null;
        this.onCallEnd = opts.onCallEnd || null;

        // Bind handlers
        this._onCallRequest = async () => {
            console.log('[VC] Received call_request in room:', this.room);
            if (typeof showToast === 'function') showToast('📞 Incoming video call...', 'success');
            await this._acceptCall();
        };
        this._onCallAccepted = async () => {
            console.log('[VC] Call accepted, creating offer...');
            await this._createOffer();
        };
        this._onOffer = async (d) => {
            console.log('[VC] Received offer');
            await this._handleOffer(d.sdp);
        };
        this._onAnswer = async (d) => {
            console.log('[VC] Received answer');
            await this._handleAnswer(d.sdp);
        };
        this._onICE = async (d) => {
            await this._handleICE(d.candidate);
        };
        this._onCallEnded = () => {
            console.log('[VC] Call ended by remote');
            if (typeof showToast === 'function') showToast('Call ended', 'success');
            this._stopCall();
        };

        this._attachSocket();
        this._attachButtons();
        console.log('[VC] VideoCall initialized. DOM refs:', {
            localVideo: !!this.localVideo, remoteVideo: !!this.remoteVideo,
            callUI: !!this.callUI, btnMic: !!this.btnMic, btnEnd: !!this.btnEnd
        });
    }

    static get rtcConfig() {
        return { iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]};
    }

    setRoom(room) {
        if (this.active) this._stopCall();
        this.room = room;
        console.log('[VC] Room set to:', room);
    }

    async startCall() {
        if (!this.room) {
            if (typeof showToast === 'function') showToast('Select a client/trainer first', 'error');
            return;
        }
        console.log('[VC] Starting call in room:', this.room);
        this.active = true;
        await this._getMedia();
        this._showUI();
        this._startTimer();
        this.socket.emit('call_request', { room: this.room });
    }

    async _acceptCall() {
        console.log('[VC] Accepting call...');
        this.active = true;
        await this._getMedia();
        this._showUI();
        this._startTimer();
        this.socket.emit('call_accepted', { room: this.room });
    }

    endCall() {
        console.log('[VC] Ending call');
        if (this.room) this.socket.emit('call_ended', { room: this.room });
        this._stopCall();
    }

    destroy() {
        this._stopCall();
        this._detachSocket();
    }

    // ═══ PRIVATE ═══

    async _getMedia() {
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            const msg = 'CAMERA BLOCKED: Browsers require HTTPS or Localhost for video. \n\nIf you are using an IP, you MUST enable the "Insecure origins" flag in edge://flags or chrome://flags.';
            alert(msg);
            return;
        }

        try {
            console.log('[VC] Requesting camera access...');
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: true
            });
            
            if (this.localVideo) {
                this.localVideo.srcObject = this.localStream;
                this.localVideo.muted = true;
                await this.localVideo.play();
                console.log('[VC] Local video playing');
            }
        } catch (e) {
            console.error('[VC] Media Error:', e);
            if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                alert('Camera Permission Denied! Please click the camera icon in your browser address bar and allow access.');
            } else {
                if (typeof showToast === 'function') showToast('Camera failed: ' + e.message, 'error');
            }
        }
    }

    _createPC() {
        if (this.pc) { try { this.pc.close(); } catch(e){} }
        this.pc = new RTCPeerConnection(VideoCall.rtcConfig);

        if (this.localStream) {
            this.localStream.getTracks().forEach(t => this.pc.addTrack(t, this.localStream));
        }

        this.pc.ontrack = (e) => {
            console.log('[VC] Remote track received:', e.track.kind);
            if (this.remoteVideo) {
                this.remoteVideo.srcObject = e.streams[0];
                this.remoteVideo.play().catch(() => {});
            }
        };

        this.pc.onicecandidate = (e) => {
            if (e.candidate) {
                this.socket.emit('webrtc_ice', { room: this.room, candidate: e.candidate });
            }
        };

        this.pc.oniceconnectionstatechange = () => {
            console.log('[VC] ICE state:', this.pc?.iceConnectionState);
        };

        this.pc.onconnectionstatechange = () => {
            console.log('[VC] Connection state:', this.pc?.connectionState);
            const s = this.pc?.connectionState;
            if (s === 'connected') {
                if (typeof showToast === 'function') showToast('🎥 Video connected!', 'success');
            }
            if (s === 'disconnected' || s === 'failed') this._stopCall();
        };
    }

    async _createOffer() {
        this._createPC();
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        console.log('[VC] Sending offer to room:', this.room);
        this.socket.emit('webrtc_offer', { room: this.room, sdp: this.pc.localDescription });
    }

    async _handleOffer(sdp) {
        this._createPC();
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        console.log('[VC] Sending answer');
        this.socket.emit('webrtc_answer', { room: this.room, sdp: this.pc.localDescription });
    }

    async _handleAnswer(sdp) {
        if (this.pc) {
            await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log('[VC] Answer set');
        }
    }

    async _handleICE(candidate) {
        if (this.pc) {
            try { await this.pc.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (e) { /* ignore */ }
        }
    }

    _attachSocket() {
        this.socket.on('call_request', this._onCallRequest);
        this.socket.on('call_accepted', this._onCallAccepted);
        this.socket.on('webrtc_offer', this._onOffer);
        this.socket.on('webrtc_answer', this._onAnswer);
        this.socket.on('webrtc_ice', this._onICE);
        this.socket.on('call_ended', this._onCallEnded);
    }

    _detachSocket() {
        this.socket.off('call_request', this._onCallRequest);
        this.socket.off('call_accepted', this._onCallAccepted);
        this.socket.off('webrtc_offer', this._onOffer);
        this.socket.off('webrtc_answer', this._onAnswer);
        this.socket.off('webrtc_ice', this._onICE);
        this.socket.off('call_ended', this._onCallEnded);
    }

    _attachButtons() {
        this.btnEnd?.addEventListener('click', () => this.endCall());
        this.btnMic?.addEventListener('click', () => {
            this.micOn = !this.micOn;
            this.localStream?.getAudioTracks().forEach(t => t.enabled = this.micOn);
            if (this.btnMic) {
                this.btnMic.innerHTML = this.micOn ? '<i class="fa-solid fa-microphone"></i>' : '<i class="fa-solid fa-microphone-slash"></i>';
                this.btnMic.style.background = this.micOn ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.6)';
            }
        });
        this.btnCam?.addEventListener('click', () => {
            this.camOn = !this.camOn;
            this.localStream?.getVideoTracks().forEach(t => t.enabled = this.camOn);
            if (this.btnCam) {
                this.btnCam.innerHTML = this.camOn ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-video-slash"></i>';
                this.btnCam.style.background = this.camOn ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.6)';
            }
        });
    }

    _startTimer() {
        if (this.callTimer) return;
        this.seconds = 0;
        this.callTimer = setInterval(() => {
            this.seconds++;
            const m = String(Math.floor(this.seconds / 60)).padStart(2, '0');
            const s = String(this.seconds % 60).padStart(2, '0');
            if (this.timerEl) this.timerEl.textContent = `${m}:${s}`;
        }, 1000);
    }

    _showUI() { 
        if (this.callUI) this.callUI.classList.remove('hidden'); 
        if (typeof this.onCallStart === 'function') this.onCallStart();
    }

    _stopCall() {
        this.active = false;
        if (this.callTimer) { clearInterval(this.callTimer); this.callTimer = null; }
        if (this.localStream) { this.localStream.getTracks().forEach(t => t.stop()); this.localStream = null; }
        if (this.pc) { try { this.pc.close(); } catch(e){} this.pc = null; }
        if (this.localVideo) this.localVideo.srcObject = null;
        if (this.remoteVideo) this.remoteVideo.srcObject = null;
        if (this.callUI) this.callUI.classList.add('hidden');
        if (this.timerEl) this.timerEl.textContent = '00:00';
        this.seconds = 0;
        this.micOn = true; this.camOn = true;
        if (this.btnMic) { this.btnMic.innerHTML = '<i class="fa-solid fa-microphone"></i>'; this.btnMic.style.background = ''; }
        if (this.btnCam) { this.btnCam.innerHTML = '<i class="fa-solid fa-video"></i>'; this.btnCam.style.background = ''; }
        
        if (typeof this.onCallEnd === 'function') this.onCallEnd();
    }
}
