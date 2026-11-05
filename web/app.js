// Set your deployed Google Apps Script Web App URL here:
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz_YOUR_SCRIPT_ID/exec';

let isProcessing = false;

const statusCard = document.getElementById('status-card');
const statusIcon = document.getElementById('status-icon');
const statusTitle = document.getElementById('status-title');
const statusDesc = document.getElementById('status-desc');
const manualForm = document.getElementById('manual-form');
const manualInput = document.getElementById('manual-token');

// Audio synthesis feedback
function playChime(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'success') {
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, ctx.currentTime);
            osc.frequency.setValueAtTime(110, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch (e) {
        // Audio API not supported
    }
}

function updateHUD(type, icon, title, desc) {
    statusCard.className = `status-card ${type}`;
    statusIcon.textContent = icon;
    statusTitle.textContent = title;
    statusDesc.textContent = desc;
}

async function verifyToken(token) {
    if (isProcessing) return;
    isProcessing = true;

    updateHUD('idle', 'â³', 'VERIFYING...', `Querying registry for: ${token}`);

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ token: token })
        });

        const data = await response.json();

        if (data.status === 'SUCCESS') {
            playChime('success');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            updateHUD('success', 'âœ…', 'ACCESS GRANTED', `${data.attendee || 'Valid Pass'} (${token})`);
        } else if (data.status === 'ALREADY_USED') {
            playChime('error');
            if (navigator.vibrate) navigator.vibrate([300]);
            updateHUD('warning', 'âš ï¸', 'ALREADY REDEEMED', `Used at ${data.checkedInAt || 'Earlier'} by ${data.attendee}`);
        } else {
            playChime('error');
            if (navigator.vibrate) navigator.vibrate([400]);
            updateHUD('danger', 'âŒ', 'INVALID PASS', data.message || 'Counterfeit or Unknown Token');
        }
    } catch (err) {
        updateHUD('danger', 'ðŸ”Œ', 'NETWORK ERROR', 'Could not connect to authentication gateway');
    } finally {
        setTimeout(() => {
            isProcessing = false;
        }, 2200);
    }
}

function initScanner() {
    const html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 15, qrbox: { width: 220, height: 220 } };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            verifyToken(decodedText);
        },
        (error) => {}
    ).catch(err => {
        updateHUD('danger', 'ðŸ“·', 'CAMERA DENIED', 'Please allow camera permissions or enter token below');
    });
}

manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = manualInput.value.trim();
    if (val) {
        verifyToken(val);
        manualInput.value = '';
    }
});

window.addEventListener('DOMContentLoaded', initScanner);
