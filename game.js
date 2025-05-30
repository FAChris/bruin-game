<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Bruin Catch (Unofficial)</title> <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
    <style>
        /* --- CSS Styles (No changes needed here, but kept for completeness) --- */
        html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; background-color: #ADD8E6; font-family: 'Press Start 2P', cursive; }
body {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    min-height: 100vh; /* Or leave it commented out if you did that */
    /* padding: 1rem; */ /* Try commenting this out */
    padding: 0; /* Or try padding: 0; */
    box-sizing: border-box;
    touch-action: none;
    transition: background-color 1s ease;
}     
        .intro-text { font-size: 0.9em; color: #333; margin-bottom: 1rem; text-align: center; flex-shrink: 0; width: 100%; }
        /* --- MODIFIED: Added outline: none for focus --- */
        .game-container { border: 5px solid #2774AE; position: relative; overflow: hidden; width: 100%; max-width: 600px; aspect-ratio: 3 / 4; border-radius: 15px; box-shadow: 0 6px 12px rgba(0,0,0,0.15); background-color: #F2A900; cursor: grab; margin-top: 0; flex-shrink: 1; min-height: 0; outline: none; /* Remove focus outline */ }
        canvas { display: block; width: 100%; height: 100%; visibility: hidden; background-color: transparent; }
        /* Name Input Overlay */
        #name-input-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255, 255, 255, 0.95); z-index: 30; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; text-align: center; color: #2774AE; }
         /* Leaderboard Display */
         #leaderboard-display { margin-top: 15px; font-size: 0.7em; text-align: left; width: 80%; max-width: 300px; border: 1px solid #ccc; padding: 10px; background-color: #f0f0f0; border-radius: 5px; }
         #leaderboard-display h3 { margin: 0 0 5px 0; text-align: center; font-size: 1.1em; }
         #leaderboard-list { list-style: none; padding: 0; margin: 0; }
         #leaderboard-list li { margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
         #leaderboard-list li span { display: inline-block; }
         #leaderboard-list .rank { width: 20px; text-align: right; margin-right: 5px;}
         #leaderboard-list .name { width: calc(50% - 25px); margin-right: 5px; overflow: hidden; text-overflow: ellipsis;}
         #leaderboard-list .score { width: calc(30% - 5px); text-align: right; margin-right: 5px;}
         #leaderboard-list .level { width: 20%; text-align: right; }
        #name-input-overlay h2 { font-size: 1.3em; margin-bottom: 15px; }
        #name-input-overlay p { font-size: 0.8em; line-height: 1.4; margin-bottom: 10px; /* Reduced margin */ max-width: 90%; }
        /* --- ADDED: Style for fullscreen hint --- */
        #name-input-overlay .fullscreen-hint { font-size: 0.65em; color: #555; margin-top: 5px; margin-bottom: 15px; }
        #player-name-input { font-family: 'Press Start 2P', cursive; font-size: 1em; padding: 10px; margin-bottom: 20px; border: 2px solid #2774AE; border-radius: 5px; text-align: center; width: 80%; max-width: 250px; }
        #start-game-button { font-family: 'Press Start 2P', cursive; font-size: 1em; padding: 12px 25px; background-color: #2774AE; color: white; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; }
        #start-game-button:hover { background-color: #1E5A8C; }

        /* In-Game UI */
        .ui-overlay { position: absolute; top: 10px; left: 15px; right: 15px; display: flex; justify-content: space-between; align-items: flex-start; color: #ffffff; font-size: 1em; z-index: 10; pointer-events: none; visibility: hidden; }
        .ui-left, .ui-center, .ui-right { display: flex; flex-direction: column; gap: 5px; }
        .ui-left { align-items: flex-start; } .ui-center { align-items: center; } .ui-right { align-items: flex-end; }
        .score, .lives, .level, .high-score-display, .high-level-display, .player-name-display, .combo-display, .bonus-display { background-color: rgba(39, 116, 174, 0.7); padding: 5px 10px; border-radius: 5px; white-space: nowrap; }
        .level { font-size: 0.9em; }
        .high-score-display, .high-level-display { font-size: 0.8em; background-color: rgba(0, 0, 0, 0.5); }
        .player-name-display { position: absolute; bottom: 10px; left: 10px; font-size: 0.8em; background-color: rgba(0, 0, 0, 0.5); z-index: 10; }
        .combo-display { position: absolute; bottom: 10px; right: 10px; font-size: 1.1em; color: #FFD700; text-shadow: 1px 1px 2px rgba(0,0,0,0.7); z-index: 10; display: none; }
         .bonus-display { position: absolute; top: 50px; left: 50%; transform: translateX(-50%); font-size: 1.2em; color: #ff4500; background-color: rgba(255, 255, 0, 0.8); z-index: 15; display: none; padding: 5px 15px; animation: pulseBonus 1s infinite alternate; }
         @keyframes pulseBonus { from { transform: translateX(-50%) scale(1); } to { transform: translateX(-50%) scale(1.1); } }
        .message { /* Game Over Message */ position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #2774AE; font-size: 1.2em; text-align: center; display: none; background-color: rgba(255, 255, 255, 0.9); padding: 20px; border-radius: 10px; border: 3px solid #2774AE; z-index: 20; line-height: 1.5; max-width: 80%; box-shadow: 0 0 15px rgba(0,0,0,0.2); cursor: pointer; }
        .level-up-message { position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%); color: #FFD700; font-size: 1.8em; text-align: center; display: none; z-index: 25; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); animation: fadeOutLevelUp 1.5s forwards; }
        @keyframes fadeOutLevelUp { 0% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); } }
        /* Item Notification Style */
        #item-notification { position: absolute; top: 60%; left: 50%; transform: translateX(-50%); font-size: 1.3em; color: white; padding: 8px 15px; border-radius: 8px; background-color: rgba(0, 0, 0, 0.6); z-index: 22; display: none; text-align: center; text-shadow: 1px 1px 2px black; animation: fadeOutNotification 1.5s forwards; }
        @keyframes fadeOutNotification { 0% { opacity: 1; transform: translateX(-50%) translateY(0); } 80% { opacity: 1; transform: translateX(-50%) translateY(0); } 100% { opacity: 0; transform: translateX(-50%) translateY(-20px); } }

        /* Responsive */
         @media (max-width: 600px) { .intro-text { font-size: 0.8em; } .ui-overlay { font-size: 0.9em; top: 8px; left: 12px; right: 12px; } .score, .lives, .level, .high-score-display, .high-level-display, .player-name-display, .combo-display, .bonus-display { padding: 4px 8px; } .combo-display { font-size: 1em; bottom: 8px; right: 8px;} .bonus-display { font-size: 1em; top: 45px; } .message { font-size: 1em; padding: 15px; } .level-up-message { font-size: 1.5em; } #name-input-overlay h2 { font-size: 1.1em; } #name-input-overlay p { font-size: 0.7em; } #name-input-overlay .fullscreen-hint { font-size: 0.6em; } #player-name-input { font-size: 0.9em; } #start-game-button { font-size: 0.9em; } .player-name-display { font-size: 0.7em; bottom: 8px; left: 8px;} #leaderboard-display { font-size: 0.6em; } #item-notification { font-size: 1.1em; } }
         @media (max-width: 450px) { .intro-text { font-size: 0.7em; } .ui-overlay { font-size: 0.75em; left: 10px; right: 10px; } .level { font-size: 0.7em; } .high-score-display, .high-level-display { font-size: 0.65em; padding: 3px 6px;} .combo-display { font-size: 0.9em; } .bonus-display { font-size: 0.9em; } .message { font-size: 0.9em; padding: 10px; } .level-up-message { font-size: 1.2em; } .player-name-display { font-size: 0.65em; } #leaderboard-display { display: none; } #item-notification { font-size: 1em; } }
    </style>
</head>
<body>
    <div class="game-container" id="gameContainer" tabindex="0">
        <div id="name-input-overlay">
            <h2>Enter Player Name</h2>
            <p>Move 🐻 (Arrows/Drag) to catch falling items. Avoid items with red sparkles. Reach the highest level!</p>
            <input type="text" id="player-name-input" placeholder="Bruin" maxlength="15">
            <button id="start-game-button">Start Game</button>
            <div id="leaderboard-display">
                <h3>Leaderboard</h3>
                <ol id="leaderboard-list"><li>Loading...</li></ol>
            </div>
             </div>
        <canvas id="gameCanvas"></canvas>
        <div class="ui-overlay">
            <div class="ui-left">
                <div id="score" class="score">Score: 0</div>
                <div id="high-score" class="high-score-display">Hi: 0 (Bruin)</div>
            </div>
            <div class="ui-center">
                 <div id="level" class="level">Level: 1</div>
                 <div id="high-level" class="high-level-display">Hi Lvl: 1</div>
            </div>
            <div class="ui-right">
                <div id="lives" class="lives">Lives: 3</div>
            </div>
        </div>
        <div id="player-name-display" class="player-name-display">Player: Bruin</div>
        <div id="combo-display" class="combo-display"></div>
        <div id="bonus-display" class="bonus-display">BONUS ROUND!</div>
        <div id="message" class="message">Tap or Click to Start</div>
        <div id="levelUpMessage" class="level-up-message">Level Up!</div>
        <div id="item-notification"></div>
    </div>

    <script>
        // --- Setup ---
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const gameContainer = document.getElementById('gameContainer');
        const scoreElement = document.getElementById('score');
        const livesElement = document.getElementById('lives');
        const levelElement = document.getElementById('level');
        const highScoreElement = document.getElementById('high-score');
        const highLevelElement = document.getElementById('high-level');
        const messageElement = document.getElementById('message');
        const levelUpMessageElement = document.getElementById('levelUpMessage');
        const nameInputOverlay = document.getElementById('name-input-overlay');
        const playerNameInput = document.getElementById('player-name-input');
        const startGameButton = document.getElementById('start-game-button');
        const uiOverlay = document.querySelector('.ui-overlay');
        const playerNameDisplayElement = document.getElementById('player-name-display');
        const leaderboardListElement = document.getElementById('leaderboard-list');
        const comboDisplayElement = document.getElementById('combo-display');
        const bonusDisplayElement = document.getElementById('bonus-display');
        const itemNotificationElement = document.getElementById('item-notification');

        // --- Game Variables ---
        let player; let playerName = "Bruin";
        let items = []; let particles = [];
        let score = 0; let leaderboard = [];
        let lives = 3; let level = 1;
        let baseGameSpeed = 2; let gameSpeed = baseGameSpeed;
        let baseItemSpawnInterval = 95; let itemSpawnInterval = baseItemSpawnInterval;
        let itemTimer = 0;
        let isGameOver = true;
        let animationFrameId = null;
        let touchStartX = null; let playerStartX = null; let isDragging = false;
        let comboCount = 0; const comboThreshold = 3;
        let comboMultiplier = 1; const maxComboMultiplier = 5;
        let isBonusRoundActive = false; let bonusRoundTimer = 0; const bonusRoundDuration = 600;
        const bonusRoundChance = 0.0001;
        let isPlayerBig = false; let playerBigTimer = 0; const playerBigDuration = 480;
        let isPlayerSmall = false; let playerSmallTimer = 0; const playerSmallDuration = 480;
        let passiveScoreTimer = 0; const passiveScoreInterval = 60;
        const smallPassiveScore = 2; const bigPassiveScore = 1;
        let notificationTimeoutId = null;

        // --- Constants (unchanged) ---
        const levelThresholds = [100, 250, 500, 800, 1200, 2000, 3000, 4000, 5500];
        const levelSpeedIncrease = 0.5; const levelIntervalDecrease = 10;
        const basePlayerWidth = 40; const basePlayerHeight = 40;
        const playerEmoji = '🐻'; const playerSpeed = 9;
        const playerAnimSpeed = 10;
        const itemSize = 35;
        const goodItems = ['🎓', '📚', '🏀', '🏆']; const badItems = ['🗑️', '💥', '💔'];
        const goldenItemEmoji = '🌟'; const superRareItemEmoji = '💎';
        const lifeItemEmoji = '💙'; const growItemEmoji = '🍄'; const shrinkItemEmoji = '💧';
        const itemValue = 10; const goldenItemValue = 30; const superRareItemValue = 100;
        const penaltyValue = 0; const missPenalty = 1;
        const superRareSpeedMultiplier = 2.1;
        const particleLifespan = 40;
        const goodParticleColor = '#FFD700'; const badParticleColor = '#DC143C';
        const goldenParticleColor = '#FFFF00'; const badItemSparkleColor = 'rgba(255, 0, 0, 0.8)';
        const superRareParticleColor = '#FFFFFF'; const lifeParticleColor = '#00BFFF';
        const growParticleColor = '#32CD32'; const shrinkParticleColor = '#8A2BE2';
        const LEADERBOARD_KEY = 'bruinCatchLeaderboard_v2';
        let themeColors = { sky1: '#87CEEB', sky2: '#ADD8E6', ground1: '#8B4513', ground2: '#A0522D', bodyBg: '#e0f2fe' };
        const groundHeight = 20;
        let groundY;

        // --- Tone.js Setup (unchanged) ---
        let jumpSynth, collectSynth, hurtSynth, levelUpSynth, bonusSynth, powerupSynth;
        let soundsEnabled = false;
        function initAudio() { if (soundsEnabled || typeof Tone === 'undefined') return; if (Tone.context.state !== 'running') { Tone.start().then(() => { if (soundsEnabled) return; jumpSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }).toDestination(); collectSynth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 } }).toDestination(); hurtSynth = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.1 } }).toDestination(); levelUpSynth = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 0.3 } }).toDestination(); bonusSynth = new Tone.Synth({ oscillator: { type: 'pulse', width: 0.4 }, envelope: { attack: 0.1, decay: 0.4, sustain: 0.2, release: 0.5 } }).toDestination(); powerupSynth = new Tone.Synth({ oscillator: { type: 'sine' }, volume: -6, envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.2 } }).toDestination(); soundsEnabled = true; console.log("Audio Initialized"); }).catch(e => { console.error("Audio init failed:", e); soundsEnabled = false; if (isGameOver) { messageElement.innerHTML = "Audio failed. Tap to retry."; messageElement.style.display = 'block'; } }); } else if (!soundsEnabled) { jumpSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }).toDestination(); collectSynth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 } }).toDestination(); hurtSynth = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.1 } }).toDestination(); levelUpSynth = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 0.3 } }).toDestination(); bonusSynth = new Tone.Synth({ oscillator: { type: 'pulse', width: 0.4 }, envelope: { attack: 0.1, decay: 0.4, sustain: 0.2, release: 0.5 } }).toDestination(); powerupSynth = new Tone.Synth({ oscillator: { type: 'sine' }, volume: -6, envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.2 } }).toDestination(); soundsEnabled = true; console.log("Audio Initialized (Context running)"); } }
        function playSound(type, note = 'C4', duration = '8n') { if (!soundsEnabled) return; try { const now = Tone.now(); if (type === 'good' && collectSynth) collectSynth.triggerAttackRelease('C5', '16n', now); else if (type === 'golden' && collectSynth) collectSynth.triggerAttackRelease('E5', '16n', now + 0.01); else if (type === 'superRare' && collectSynth) collectSynth.triggerAttackRelease('G5', '8n', now + 0.02); else if (type === 'bad' && hurtSynth) hurtSynth.triggerAttackRelease('C3', '8n', now); else if (type === 'miss' && hurtSynth) hurtSynth.triggerAttackRelease('A2', '16n', now); else if (type === 'life' && powerupSynth) powerupSynth.triggerAttackRelease('A4', '8n', now); else if (type === 'grow' && powerupSynth) powerupSynth.triggerAttackRelease('E4', '8n', now); else if (type === 'shrink' && powerupSynth) powerupSynth.triggerAttackRelease('C4', '8n', now); else if (type === 'levelUp' && levelUpSynth) levelUpSynth.triggerAttackRelease('G4', '4n', now); else if (type === 'bonusStart' && bonusSynth) bonusSynth.triggerAttackRelease('C5', '2n', now); else if (type === 'gameOver' && hurtSynth) hurtSynth.triggerAttackRelease('F2', '1n', now); } catch (e) { console.error("Sound playback error:", e); } }

        // --- Leaderboard Handling (unchanged) ---
        function loadLeaderboard() { try { const storedData = localStorage.getItem(LEADERBOARD_KEY); leaderboard = storedData ? JSON.parse(storedData) : []; if (!Array.isArray(leaderboard)) leaderboard = []; leaderboard.sort((a, b) => b.score - a.score || b.level - a.level); } catch (e) { console.error("LS Error (Load Leaderboard):", e); leaderboard = []; } finally { displayLeaderboard(); updateTopScoreDisplay(); } }
function saveToLeaderboard() {
    if (!playerName) {
        playerName = "Bruin"; // Fallback if no name is entered
    }
    const scoreData = { name: playerName, score: score, level: level };

    fetch('https://aquamarine-dieffenbachia-ed23a6.netlify.app/.netlify/functions/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Score saved:', data);
        loadRemoteLeaderboard(); // Fetch the updated leaderboard from the server
    })
    .catch(error => {
        console.error('Error saving score:', error);
        // Optionally, you could still save locally as a fallback if the server is down
        console.warn('Falling back to local storage for saving score.');
        try {
            const currentEntry = { name: playerName, score: score, level: level };
            let playerIndex = leaderboard.findIndex(entry => entry.name === playerName);
            if (playerIndex !== -1) {
                if (score > leaderboard[playerIndex].score || (score === leaderboard[playerIndex].score && level > leaderboard[playerIndex].level)) {
                    leaderboard[playerIndex] = currentEntry;
                } else {
                    return;
                }
            } else {
                leaderboard.push(currentEntry);
            }
            leaderboard.sort((a, b) => b.score - a.score || b.level - a.level);
            leaderboard = leaderboard.slice(0, 5);
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
            displayLeaderboard();
            updateTopScoreDisplay();
        } catch (e) {
            console.error("LS Error (Save Leaderboard - Fallback):", e);
        }
    });
}        
        function displayLeaderboard() { if (!leaderboardListElement) return; leaderboardListElement.innerHTML = ''; if (leaderboard.length === 0) { leaderboardListElement.innerHTML = '<li>No scores yet!</li>'; return; } leaderboard.forEach((entry, index) => { const li = document.createElement('li'); const safeName = entry.name.replace(/</g, "&lt;").replace(/>/g, "&gt;"); li.innerHTML = `<span class="rank">${index + 1}.</span><span class="name">${safeName}</span><span class="score">${entry.score}</span><span class="level">(L${entry.level})</span>`; leaderboardListElement.appendChild(li); }); }
function updateTopScoreDisplay() {
    if (leaderboard.length > 0) {
        let personalHighScore = 0;
        let topScore = leaderboard[0].score;
        let topPlayerName = leaderboard[0].name;
        let personalHighLevel = 1;
        let topLevel = leaderboard[0].level;

        for (const entry of leaderboard) {
            if (entry.name === playerName) {
                personalHighScore = Math.max(personalHighScore, entry.score);
                if (entry.score === personalHighScore) {
                    personalHighLevel = Math.max(personalHighLevel, entry.level);
                }
            }
        }

        if (personalHighScore > 0) {
            if (highScoreElement) highScoreElement.textContent = `Hi: ${personalHighScore} (${playerName})`;
            if (highLevelElement) highLevelElement.textContent = `Hi Lvl: ${personalHighLevel}`;
        } else {
            if (highScoreElement) highScoreElement.textContent = `Hi: ${topScore} (${topPlayerName})`;
            if (highLevelElement) highLevelElement.textContent = `Hi Lvl: ${topLevel}`;
        }
    } else {
        if (highScoreElement) highScoreElement.textContent = `Hi: 0 (Bruin)`;
        if (highLevelElement) highLevelElement.textContent = `Hi Lvl: 1`;
    }
}
        function resetLeaderboard() {
            try {
                localStorage.removeItem(LEADERBOARD_KEY);
                leaderboard = [];
                displayLeaderboard();
                updateTopScoreDisplay();
                console.log("Leaderboard has been reset.");
            } catch (e) {
                console.error("Error resetting leaderboard:", e);
            }
        }
        
        // --- Resize Canvas (unchanged) ---
        function resizeCanvas() { canvas.width = gameContainer.clientWidth; canvas.height = gameContainer.clientHeight; groundY = canvas.height - groundHeight - basePlayerHeight; if (player) { player.y = canvas.height - player.currentHeight - 10; player.x = Math.max(0, Math.min(canvas.width - player.currentWidth, player.x)); } if (!isGameOver) { drawGame(); } }

        // --- Particle System (unchanged) ---
        function createParticle(x, y, count = 8, color = goodParticleColor, speed = 3, type = 'burst') { for (let i = 0; i < count; i++) { let vx, vy; if (type === 'burst') { vx = (Math.random() - 0.5) * speed * 1.5; vy = (Math.random() - 0.5) * speed * 1.5; } else if (type === 'upward') { vx = (Math.random() - 0.5) * speed * 0.8; vy = (Math.random() * -speed) - 1; } else if (type === 'radiate') { const angle = Math.random() * Math.PI * 2; const currentSpeed = Math.random() * speed * 0.5 + 0.2; vx = Math.cos(angle) * currentSpeed; vy = Math.sin(angle) * currentSpeed; } else { vx = (Math.random() - 0.5) * speed * 1.5; vy = (Math.random() * -speed) - 1; } particles.push({ x: x, y: y, vx: vx, vy: vy, life: particleLifespan + Math.random() * 20, size: Math.random() * 4 + 2, color: color, alpha: 1.0 }); } }
        function handleParticles() { for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--; p.alpha = Math.max(0, p.life / particleLifespan); if (p.life <= 0) { particles.splice(i, 1); } else { ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); ctx.globalAlpha = 1.0; } } }

        // --- Object Creation (unchanged) ---
        function createPlayer() { playerWidth = basePlayerWidth; playerHeight = basePlayerHeight; return { x: canvas.width / 2 - playerWidth / 2, y: canvas.height - playerHeight - 10, baseWidth: basePlayerWidth, baseHeight: basePlayerHeight, currentWidth: playerWidth, currentHeight: playerHeight, emoji: playerEmoji, dx: 0, animFrame: 0, update: function() { let moved = false; if (this.dx !== 0) { this.x += this.dx; moved = true; this.animFrame = (this.animFrame + 1) % (playerAnimSpeed * 2); } else { this.animFrame = 0; } if (this.x < 0) this.x = 0; if (this.x > canvas.width - this.currentWidth) this.x = canvas.width - this.currentWidth; if (isPlayerBig) { playerBigTimer--; if (playerBigTimer <= 0) this.setSize('normal'); } if (isPlayerSmall) { playerSmallTimer--; if (playerSmallTimer <= 0) this.setSize('normal'); } }, draw: function() { ctx.save(); const scaleFactor = (this.dx !== 0 && this.animFrame < playerAnimSpeed) ? 1.05 : 1.0; ctx.translate(this.x + this.currentWidth / 2, this.y + this.currentHeight / 2); ctx.scale(scaleFactor, scaleFactor); ctx.font = `${this.currentHeight}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.emoji, 0, 0); ctx.restore(); }, setSize: function(sizeType) { isPlayerBig = false; isPlayerSmall = false; playerBigTimer = 0; playerSmallTimer = 0; if (sizeType === 'big') { this.currentWidth = this.baseWidth * 1.5; this.currentHeight = this.baseHeight * 1.5; isPlayerBig = true; playerBigTimer = playerBigDuration; } else if (sizeType === 'small') { this.currentWidth = this.baseWidth * 0.6; this.currentHeight = this.baseHeight * 0.6; isPlayerSmall = true; playerSmallTimer = playerSmallDuration; } else { this.currentWidth = this.baseWidth; this.currentHeight = this.baseHeight; } this.y = canvas.height - this.currentHeight - 10; this.x = Math.max(0, Math.min(canvas.width - this.currentWidth, this.x)); playerWidth = this.currentWidth; playerHeight = this.currentHeight; }, moveLeft: function() { this.dx = -playerSpeed; }, moveRight: function() { this.dx = playerSpeed; }, stop: function() { this.dx = 0; this.animFrame = 0; } }; }
        function createItem(bonusActive = false) { let emoji; let type; let isGood = true; let isGolden = false; let isSuperRare = false; let itemSpeed = gameSpeed + Math.random() * 1.5; const rand = Math.random(); if (bonusActive) { if (rand < 0.07) { emoji = superRareItemEmoji; type = 'superRare'; isSuperRare = true; itemSpeed = gameSpeed * superRareSpeedMultiplier + Math.random() * 2; } else if (rand < 0.15) { emoji = goldenItemEmoji; type = 'golden'; isGolden = true; } else { emoji = goodItems[Math.floor(Math.random() * goodItems.length)]; type = 'good'; } } else { if (rand < 0.03) { emoji = superRareItemEmoji; type = 'superRare'; isSuperRare = true; itemSpeed = gameSpeed * superRareSpeedMultiplier + Math.random() * 2; } else if (rand < 0.02) { emoji = goldenItemEmoji; type = 'golden'; isGolden = true; } else if (rand < 0.035) { emoji = lifeItemEmoji; type = 'life'; } else if (rand < 0.040) { emoji = growItemEmoji; type = 'grow'; } else if (rand < 0.040) { emoji = shrinkItemEmoji; type = 'shrink'; } else if (rand < 0.305) { emoji = badItems[Math.floor(Math.random() * badItems.length)]; type = 'bad'; isGood = false; } else { emoji = goodItems[Math.floor(Math.random() * goodItems.length)]; type = 'good'; } } return { x: Math.random() * (canvas.width - itemSize), y: -itemSize, size: itemSize, emoji: emoji, type: type, isGood: isGood, isGolden: isGolden, isSuperRare: isSuperRare, speed: itemSpeed, update: function() { this.y += this.speed; }, draw: function() { ctx.save(); ctx.font = `${this.size}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (this.type === 'bad' && Math.random() < 0.3) { createParticle(this.x + this.size / 2, this.y + this.size / 2, 1, badItemSparkleColor, 1.8, 'radiate'); } else if (this.isGolden) { ctx.shadowColor = 'rgba(255, 223, 0, 0.8)'; ctx.shadowBlur = 10; } else if (this.isSuperRare) { ctx.shadowColor = 'rgba(200, 200, 255, 0.9)'; ctx.shadowBlur = 12; if (Math.random() < 0.4) { createParticle(this.x + this.size / 2, this.y + this.size / 2, 1, superRareParticleColor, 1.2, 'radiate'); } } else if (this.type === 'life') { ctx.shadowColor = 'rgba(0, 191, 255, 0.7)'; ctx.shadowBlur = 8;} else if (this.type === 'grow') { ctx.shadowColor = 'rgba(50, 205, 50, 0.7)'; ctx.shadowBlur = 8;} else if (this.type === 'shrink') { ctx.shadowColor = 'rgba(138, 43, 226, 0.7)'; ctx.shadowBlur = 8;} ctx.fillText(this.emoji, this.x + this.size / 2, this.y + this.size / 2); ctx.restore(); } }; }

        // --- Game Logic (unchanged) ---
        function checkLevelUp() { if (level - 1 < levelThresholds.length && score >= levelThresholds[level - 1]) { level++; baseGameSpeed += levelSpeedIncrease; baseItemSpawnInterval = Math.max(20, baseItemSpawnInterval - levelIntervalDecrease); levelElement.textContent = `Level: ${level}`; console.log(`Level Up! Level: ${level}, Speed: ${baseGameSpeed.toFixed(2)}, Interval: ${baseItemSpawnInterval}`); levelUpMessageElement.textContent = `Level ${level}!`; levelUpMessageElement.style.display = 'block'; levelUpMessageElement.style.animation = 'none'; levelUpMessageElement.offsetHeight; levelUpMessageElement.style.animation = ''; playSound('levelUp'); } gameSpeed = baseGameSpeed; itemSpawnInterval = baseItemSpawnInterval; }
        function handleItems() { itemTimer++; if (!isBonusRoundActive && Math.random() < bonusRoundChance && level >= 3) { startBonusRound(); } if (itemTimer >= itemSpawnInterval) { items.push(createItem(isBonusRoundActive)); itemTimer = 0; } for (let i = items.length - 1; i >= 0; i--) { const item = items[i]; item.update(); item.draw(); if ( player && item.x < player.x + player.currentWidth && item.x + item.size > player.x && item.y < player.y + player.currentHeight && item.y + item.size > player.y ) { let particleX = item.x + item.size / 2; let particleY = item.y + item.size / 2; let scoreToAdd = 0; let soundType = 'good'; let notificationText = null; switch(item.type) { case 'superRare': scoreToAdd = superRareItemValue; createParticle(particleX, particleY, 40, superRareParticleColor, 6, 'burst'); soundType = 'superRare'; notificationText = "DIAMOND!"; break; case 'golden': scoreToAdd = goldenItemValue; createParticle(particleX, particleY, 25, goldenParticleColor, 5, 'burst'); soundType = 'golden'; notificationText = "Golden Star!"; break; case 'good': scoreToAdd = itemValue; createParticle(particleX, particleY, 8, goodParticleColor, 3, 'upward'); soundType = 'good'; break; case 'life': lives++; createParticle(particleX, particleY, 15, lifeParticleColor, 4, 'upward'); soundType = 'life'; notificationText = "+1 Life!"; break; case 'grow': if (!isPlayerSmall) player.setSize('big'); createParticle(particleX, particleY, 15, growParticleColor, 4, 'burst'); soundType = 'grow'; notificationText = "Grew Big!"; break; case 'shrink': if (!isPlayerBig) player.setSize('small'); createParticle(particleX, particleY, 15, shrinkParticleColor, 4, 'burst'); soundType = 'shrink'; notificationText = "Shrunk Small!"; break; case 'bad': lives--; createParticle(particleX, particleY, 15, badParticleColor, 4, 'burst'); soundType = 'bad'; comboCount = 0; comboMultiplier = 1; break; } if (scoreToAdd > 0) { scoreToAdd *= comboMultiplier; score += scoreToAdd; comboCount++; if (comboCount >= comboThreshold) { comboMultiplier = Math.min(maxComboMultiplier, Math.floor(comboCount / comboThreshold) + 1); } } else if (item.type !== 'bad') { comboCount = 0; comboMultiplier = 1; } playSound(soundType); if (notificationText) showItemNotification(notificationText); score = Math.max(0, score); scoreElement.textContent = `Score: ${score}`; livesElement.textContent = `Lives: ${lives}`; comboDisplayElement.textContent = comboMultiplier > 1 ? `x${comboMultiplier} Combo!` : ''; comboDisplayElement.style.display = comboMultiplier > 1 ? 'block' : 'none'; checkLevelUp(); items.splice(i, 1); if (lives <= 0) { gameOver(); return; } } else if (item.y > canvas.height) { if (item.isGood && !item.isGolden && !item.isSuperRare) { lives -= missPenalty; livesElement.textContent = `Lives: ${lives}`; playSound('miss'); } comboCount = 0; comboMultiplier = 1; comboDisplayElement.style.display = 'none'; items.splice(i, 1); if (lives <= 0) { gameOver(); return; } } } }
        function startBonusRound() { if (isBonusRoundActive) return; isBonusRoundActive = true; bonusRoundTimer = bonusRoundDuration; bonusDisplayElement.style.display = 'block'; console.log("BONUS ROUND STARTED!"); playSound('bonusStart'); items = []; }
        function updateBonusRound() { if (!isBonusRoundActive) return; bonusRoundTimer--; if (bonusRoundTimer <= 0) { isBonusRoundActive = false; bonusDisplayElement.style.display = 'none'; console.log("BONUS ROUND ENDED!"); } }
        function showItemNotification(text) { if (!itemNotificationElement) return; itemNotificationElement.textContent = text; itemNotificationElement.style.display = 'block'; clearTimeout(notificationTimeoutId); notificationTimeoutId = setTimeout(() => { itemNotificationElement.style.display = 'none'; }, 1500); itemNotificationElement.style.animation = 'none'; itemNotificationElement.offsetHeight; itemNotificationElement.style.animation = ''; }

        // --- Drawing (unchanged) ---
        function drawBackground() { if (!themeColors || !ctx || !canvas) return; const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7); skyGradient.addColorStop(0, themeColors.sky1 || '#87CEEB'); skyGradient.addColorStop(1, themeColors.sky2 || '#ADD8E6'); ctx.fillStyle = skyGradient; ctx.fillRect(0, 0, canvas.width, canvas.height); if (typeof groundHeight !== 'undefined' && groundHeight > 0 && canvas.height > groundHeight) { const groundGradient = ctx.createLinearGradient(0, canvas.height - groundHeight, 0, canvas.height); groundGradient.addColorStop(0, themeColors.ground1 || '#8B4513'); groundGradient.addColorStop(1, themeColors.ground2 || '#A0522D'); ctx.fillStyle = groundGradient; ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight); } }
        function drawGame() { if (canvas.style.visibility !== 'visible' || !ctx) { return; } ctx.clearRect(0, 0, canvas.width, canvas.height); drawBackground(); items.forEach(item => item.draw()); if (player) player.draw(); handleParticles(); }

        // --- Game Loop & State Management (unchanged) ---
        function gameLoop() { if (isGameOver) { cancelAnimationFrame(animationFrameId); animationFrameId = null; return; } if (player) player.update(); handleItems(); if (isGameOver) { cancelAnimationFrame(animationFrameId); animationFrameId = null; return; } handleParticles(); updateBonusRound(); passiveScoreTimer++; if (passiveScoreTimer >= passiveScoreInterval) { passiveScoreTimer = 0; let passiveScoreToAdd = 0; if (isPlayerSmall) { passiveScoreToAdd = smallPassiveScore; } else if (isPlayerBig) { passiveScoreToAdd = bigPassiveScore; } if (passiveScoreToAdd > 0) { score += passiveScoreToAdd; score = Math.max(0, score); scoreElement.textContent = `Score: ${score}`; checkLevelUp(); } } drawGame(); animationFrameId = requestAnimationFrame(gameLoop); }
function gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    console.log("Game Over Triggered - Checking for leaderboard load"); // ADD THIS LINE
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    saveToLeaderboard();
    messageElement.innerHTML = `Game Over!<br>Level: ${level} | Score: ${score}<br>Tap or Click to Play Again`;
    messageElement.style.display = 'block';
    gameContainer.style.cursor = 'pointer';
    playSound('gameOver');
}
        function loadRemoteLeaderboard() {
    console.log("loadRemoteLeaderboard CALLED!"); // ADD THIS LINE
    fetch('https://aquamarine-dieffenbachia-ed23a6.netlify.app/.netlify/functions/get-scores')
        .then(response => response.json())
        .then(data => {
            leaderboard = data;
            displayLeaderboard();
            console.log("Leaderboard data received:", leaderboard);
            updateTopScoreDisplay();
        })
        .catch(error => {
            console.error('Error fetching leaderboard:', error);
            console.warn('Falling back to local storage for leaderboard.');
            loadLeaderboard();
        });
}
        function showNameInputScreen() { isGameOver = true; cancelAnimationFrame(animationFrameId); animationFrameId = null; nameInputOverlay.style.display = 'flex'; canvas.style.visibility = 'hidden'; uiOverlay.style.visibility = 'hidden'; messageElement.style.display = 'none'; levelUpMessageElement.style.display = 'none'; loadLeaderboard(); playerNameInput.value = playerName; try { playerNameInput.focus(); } catch(e) {} }
        function initializeGame() { if (!isGameOver) { console.log("InitializeGame called but game not over. Ignoring."); return; } console.log("Initializing Game..."); initAudio(); isGameOver = false; score = 0; lives = 3; level = 1; baseGameSpeed = 2; baseItemSpawnInterval = 95; gameSpeed = baseGameSpeed; itemSpawnInterval = baseItemSpawnInterval; items = []; particles = []; itemTimer = 0; comboCount = 0; comboMultiplier = 1; isBonusRoundActive = false; bonusRoundTimer = 0; isPlayerBig = false; playerBigTimer = 0; isPlayerSmall = false; playerSmallTimer = 0; passiveScoreTimer = 0; scoreElement.textContent = `Score: ${score}`; livesElement.textContent = `Lives: ${lives}`; levelElement.textContent = `Level: ${level}`; playerNameDisplayElement.textContent = `Player: ${playerName}`; comboDisplayElement.style.display = 'none'; bonusDisplayElement.style.display = 'none'; updateTopScoreDisplay(); messageElement.style.display = 'none'; levelUpMessageElement.style.display = 'none'; gameContainer.style.cursor = 'grab'; canvas.style.visibility = 'visible'; uiOverlay.style.visibility = 'visible'; resizeCanvas(); if (!player) { player = createPlayer(); } else { player.x = canvas.width / 2 - basePlayerWidth / 2; player.dx = 0; player.setSize('normal'); } cancelAnimationFrame(animationFrameId); animationFrameId = requestAnimationFrame(gameLoop); console.log("Game Loop Started with ID:", animationFrameId); }

        // --- Event Listeners ---
        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            // --- MODIFIED: Focus container before toggle ---
            if (e.key.toLowerCase() === 'f') {
                try {
                    gameContainer.focus(); // Attempt to focus the container first
                } catch(focusErr) {
                    console.warn("Could not focus game container:", focusErr);
                }
                toggleFullScreen(); // Then attempt fullscreen
                e.preventDefault(); // Prevent default browser action for 'f'
                return;
            }

            // Existing keydown logic
            if (isGameOver && nameInputOverlay.style.display === 'flex' && (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') && document.activeElement !== playerNameInput) {
                startGameButton.click();
                return;
            }
            if (isGameOver || !player) return;

            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                player.moveLeft();
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                player.moveRight();
            }
        });
        window.addEventListener('keyup', (e) => { if (isGameOver || !player) return; if (((e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') && player.dx < 0) || ((e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') && player.dx > 0)) { player.stop(); } });
        // Touch Controls (unchanged)
        gameContainer.addEventListener('touchstart', (e) => { e.preventDefault(); if (isGameOver) return; if (e.touches.length > 0 && player) { isDragging = true; touchStartX = e.touches[0].clientX; playerStartX = player.x; gameContainer.style.cursor = 'grabbing'; } }, { passive: false });
        gameContainer.addEventListener('touchmove', (e) => { e.preventDefault(); if (!isDragging || isGameOver || !player) return; if (e.touches.length > 0) { const touchCurrentX = e.touches[0].clientX; const deltaX = touchCurrentX - touchStartX; let newPlayerX = playerStartX + deltaX; newPlayerX = Math.max(0, Math.min(canvas.width - player.currentWidth, newPlayerX)); player.x = newPlayerX; } }, { passive: false });
        const stopTouchDragging = () => { if (isDragging) { isDragging = false; touchStartX = null; playerStartX = null; gameContainer.style.cursor = 'grab'; } };
        gameContainer.addEventListener('touchend', stopTouchDragging);
        gameContainer.addEventListener('touchcancel', stopTouchDragging);
        // Mouse Controls (unchanged)
        gameContainer.addEventListener('mousedown', (e) => { if (isGameOver) return; if (player) { isDragging = true; touchStartX = e.clientX; playerStartX = player.x; gameContainer.style.cursor = 'grabbing'; } });
        gameContainer.addEventListener('mousemove', (e) => { if (!isDragging || isGameOver || !player) return; const touchCurrentX = e.clientX; const deltaX = touchCurrentX - touchStartX; let newPlayerX = playerStartX + deltaX; newPlayerX = Math.max(0, Math.min(canvas.width - player.currentWidth, newPlayerX)); player.x = newPlayerX; });
        const stopMouseDragging = () => { if (isDragging) { isDragging = false; touchStartX = null; playerStartX = null; gameContainer.style.cursor = 'grab'; } };
        window.addEventListener('mouseup', stopMouseDragging);
        gameContainer.addEventListener('mouseleave', stopMouseDragging);
         // Start Game Button Listener (unchanged)
         startGameButton.addEventListener('click', () => { playerName = playerNameInput.value.trim().substring(0, 15) || "Bruin"; nameInputOverlay.style.display = 'none'; initializeGame(); });
        startGameButton.addEventListener('touchstart', () => { playerName = playerNameInput.value.trim().substring(0, 15) || "Bruin"; nameInputOverlay.style.display = 'none'; initializeGame(); });
         // Allow Enter key in input field to start game (unchanged)
         playerNameInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') { startGameButton.click(); } });
        playerNameInput.addEventListener('touchstart', (e) => {
  // On touchstart, focus the input to bring up the keyboard if it's not already visible
  playerNameInput.focus();
});
         // Allow restarting by clicking game over message (unchanged)
         messageElement.addEventListener('click', (e) => { e.stopPropagation(); if (isGameOver) { showNameInputScreen(); } });
        messageElement.addEventListener('touchstart', (e) => { e.stopPropagation(); if (isGameOver) { showNameInputScreen(); } });

        // Fullscreen Toggle Function (unchanged, but added more logging)
        function toggleFullScreen() {
            try {
                if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                    console.log('Attempting to enter fullscreen on:', gameContainer);
                    if (gameContainer.requestFullscreen) {
                        gameContainer.requestFullscreen().catch(err => console.error('Fullscreen request failed:', err));
                    } else if (gameContainer.mozRequestFullScreen) { /* Firefox */
                        gameContainer.mozRequestFullScreen().catch(err => console.error('Moz fullscreen failed:', err));
                    } else if (gameContainer.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                        gameContainer.webkitRequestFullscreen().catch(err => console.error('Webkit fullscreen failed:', err));
                    } else if (gameContainer.msRequestFullscreen) { /* IE/Edge */
                        gameContainer.msRequestFullscreen().catch(err => console.error('MS fullscreen failed:', err));
                    } else {
                        console.warn('Fullscreen API not supported by this browser.');
                    }
                } else {
                    console.log('Attempting to exit fullscreen');
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(err => console.error('Exit fullscreen failed:', err));
                    } else if (document.mozCancelFullScreen) { /* Firefox */
                        document.mozCancelFullScreen().catch(err => console.error('Moz exit fullscreen failed:', err));
                    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
                        document.webkitExitFullscreen().catch(err => console.error('Webkit exit fullscreen failed:', err));
                    } else if (document.msExitFullscreen) { /* IE/Edge */
                        document.msExitFullscreen().catch(err => console.error('MS exit fullscreen failed:', err));
                    } else {
                        console.warn('Exit Fullscreen API not supported by this browser.');
                    }
                }
            } catch (err) {
                console.error('Error during fullscreen toggle:', err);
            }
        }

        // --- Initial Setup ---
        window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
    loadRemoteLeaderboard(); // Load leaderboard from the server on page load
    resizeCanvas();
    showNameInputScreen();
});

        console.log("Script End Reached - Basic Test");

    </script>
</body>
</html>
