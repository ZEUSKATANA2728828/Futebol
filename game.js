// ===== CONFIGURAÇÕES =====
const CONFIG = {
    canvasWidth: 800,
    canvasHeight: 450,
    fieldColor: '#2ecc71',
    playerRadius: 12,
    ballRadius: 8,
    playerSpeed: 4,
    ballSpeed: 8,
    matchTime: 120, // segundos
    difficulty: 'medium'
};

// ===== ESTADO DO JOGO =====
const STATE = {
    screen: 'loading',
    gameActive: false,
    gamePaused: false,
    matchTimeLeft: CONFIG.matchTime,
    playerScore: 0,
    cpuScore: 0,
    wins: 0,
    games: 0,
    level: 1,
    
    // Controles
    joystickActive: false,
    joystickX: 0,
    joystickY: 0,
    
    // Jogo
    players: [],
    ball: null,
    controlledPlayer: null
};

// ===== ELEMENTOS DOM =====
const screens = {
    loading: document.getElementById('loadingScreen'),
    menu: document.getElementById('menuScreen'),
    game: document.getElementById('gameScreen'),
    pause: document.getElementById('pauseScreen'),
    end: document.getElementById('endScreen')
};

// ===== INICIALIZAÇÃO =====
function init() {
    // Configurar canvas
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Ajustar tamanho
    resizeCanvas(canvas);
    window.addEventListener('resize', () => resizeCanvas(canvas));
    
    // Carregar dados
    loadData();
    
    // Configurar controles
    setupControls();
    
    // Configurar eventos
    setupEvents();
    
    // Simular carregamento
    setTimeout(() => {
        switchScreen('menu');
        showLoading(100);
    }, 2000);
    
    // Iniciar loop do jogo
    gameLoop(ctx, canvas);
}

// ===== FUNÇÕES DO JOGO =====
function resizeCanvas(canvas) {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    CONFIG.canvasWidth = canvas.width;
    CONFIG.canvasHeight = canvas.height;
}

function showLoading(percent) {
    const fill = document.querySelector('.loader-fill');
    fill.style.width = percent + '%';
}

function switchScreen(screenName) {
    // Esconder todas as telas
    Object.values(screens).forEach(screen => {
        screen.style.display = 'none';
    });
    
    // Mostrar tela atual
    screens[screenName].style.display = 'flex';
    STATE.screen = screenName;
    
    // Ações específicas
    if (screenName === 'menu') {
        updateMenuStats();
    }
}

function updateMenuStats() {
    document.getElementById('wins').textContent = STATE.wins;
    document.getElementById('games').textContent = STATE.games;
    document.getElementById('level').textContent = STATE.level;
}

function setupControls() {
    // Joystick
    const joystick = document.getElementById('joystick');
    const handle = joystick.querySelector('.joystick-handle');
    
    let active = false;
    
    joystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        active = true;
        updateJoystick(e);
    });
    
    joystick.addEventListener('touchmove', (e) => {
        if (!active) return;
        e.preventDefault();
        updateJoystick(e);
    });
    
    joystick.addEventListener('touchend', () => {
        active = false;
        STATE.joystickActive = false;
        STATE.joystickX = 0;
        STATE.joystickY = 0;
        handle.style.transform = 'translate(-50%, -50%)';
    });
    
    // Mouse para desktop
    joystick.addEventListener('mousedown', (e) => {
        e.preventDefault();
        active = true;
        updateJoystick(e);
        
        const moveHandler = (e) => updateJoystick(e);
        const upHandler = () => {
            active = false;
            STATE.joystickActive = false;
            STATE.joystickX = 0;
            STATE.joystickY = 0;
            handle.style.transform = 'translate(-50%, -50%)';
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    });
    
    function updateJoystick(e) {
        const rect = joystick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let clientX, clientY;
        if (e.type.includes('touch')) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;
        
        // Limitar ao círculo
        const maxDist = rect.width / 2;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > maxDist) {
            deltaX = (deltaX / distance) * maxDist;
            deltaY = (deltaY / distance) * maxDist;
        }
        
        // Atualizar estado
        STATE.joystickActive = true;
        STATE.joystickX = deltaX / maxDist;
        STATE.joystickY = deltaY / maxDist;
        
        // Mover visual
        handle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
}

function setupEvents() {
    // Botões do menu
    document.getElementById('playBtn').addEventListener('click', startGame);
    document.getElementById('settingsBtn').addEventListener('click', () => alert('Configurações em breve!'));
    document.getElementById('helpBtn').addEventListener('click', () => alert('Controles:\nJoystick: Movimento\nPasse: Botão verde\nChute: Botão vermelho\nCarrinho: Botão laranja'));
    
    // Botões do jogo
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('passBtn').addEventListener('click', () => performAction('pass'));
    document.getElementById('shootBtn').addEventListener('click', () => performAction('shoot'));
    document.getElementById('tackleBtn').addEventListener('click', () => performAction('tackle'));
    
    // Botões de pausa
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('pauseMenuBtn').addEventListener('click', () => {
        STATE.gameActive = false;
        switchScreen('menu');
    });
    
    // Botões de fim
    document.getElementById('playAgainBtn').addEventListener('click', startGame);
    document.getElementById('menuEndBtn').addEventListener('click', () => {
        switchScreen('menu');
    });
}

function loadData() {
    const data = localStorage.getItem('miniSoccerData');
    if (data) {
        const saved = JSON.parse(data);
        STATE.wins = saved.wins || 0;
        STATE.games = saved.games || 0;
        STATE.level = saved.level || 1;
    }
}

function saveData() {
    const data = {
        wins: STATE.wins,
        games: STATE.games,
        level: STATE.level
    };
    localStorage.setItem('miniSoccerData', JSON.stringify(data));
}

// ===== LÓGICA DO JOGO =====
class Player {
    constructor(x, y, team, isControlled = false) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.team = team;
        this.color = team === 'player' ? '#3498db' : '#e74c3c';
        this.hasBall = false;
        this.isControlled = isControlled;
        this.speed = CONFIG.playerSpeed;
        this.radius = CONFIG.playerRadius;
        this.number = Math.floor(Math.random() * 99) + 1;
    }
    
    update(ball) {
        // Movimento
        if (this.isControlled && STATE.joystickActive) {
            this.vx = STATE.joystickX * this.speed;
            this.vy = STATE.joystickY * this.speed;
        } else {
            // IA
            this.aiMove(ball);
        }
        
        // Atrito
        this.vx *= 0.9;
        this.vy *= 0.9;
        
        // Atualizar posição
        this.x += this.vx;
        this.y += this.vy;
        
        // Limites
        this.x = Math.max(this.radius, Math.min(CONFIG.canvasWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(CONFIG.canvasHeight - this.radius, this.y));
        
        // Se tem a bola, atualizar posição da bola
        if (this.hasBall && ball) {
            ball.x = this.x + (this.team === 'player' ? this.radius + 5 : -this.radius - 5);
            ball.y = this.y;
            ball.vx = this.vx * 0.8;
            ball.vy = this.vy * 0.8;
        }
    }
    
    aiMove(ball) {
        if (!ball) return;
        
        const dx = ball.x - this.x;
        const dy = ball.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Lógica simples da IA
        if (ball.owner && ball.owner.team === this.team) {
            // Companheiro tem a bola
            if (distance > 100) {
                // Aproximar
                this.vx += (dx / distance) * this.speed * 0.02;
                this.vy += (dy / distance) * this.speed * 0.02;
            }
        } else {
            // Ir atrás da bola
            if (distance > 30) {
                this.vx += (dx / distance) * this.speed * 0.03;
                this.vy += (dy / distance) * this.speed * 0.03;
            }
            
            // Se estiver perto e não for dono, tentar pegar
            if (distance < 40 && !ball.owner && Math.random() < 0.1) {
                ball.owner = this;
                this.hasBall = true;
            }
        }
        
        // Limitar velocidade
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.speed) {
            this.vx = (this.vx / speed) * this.speed;
            this.vy = (this.vy / speed) * this.speed;
        }
    }
    
    draw(ctx) {
        // Sombra
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        
        // Jogador
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Borda
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Número
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.number, this.x, this.y);
        
        // Indicador de posse
        if (this.hasBall) {
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Resetar sombra
        ctx.shadowColor = 'transparent';
    }
}

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = CONFIG.ballRadius;
        this.owner = null;
        this.color = 'white';
    }
    
    update() {
        // Movimento
        this.x += this.vx;
        this.y += this.vy;
        
        // Atrito
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        // Limites
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx *= -0.8;
        }
        if (this.x > CONFIG.canvasWidth - this.radius) {
            this.x = CONFIG.canvasWidth - this.radius;
            this.vx *= -0.8;
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.vy *= -0.8;
        }
        if (this.y > CONFIG.canvasHeight - this.radius) {
            this.y = CONFIG.canvasHeight - this.radius;
            this.vy *= -0.8;
        }
        
        // Verificar gols
        this.checkGoal();
        
        // Colisão com jogadores
        this.checkPlayerCollision();
    }
    
    checkGoal() {
        // Gol do jogador (direita)
        if (this.x > CONFIG.canvasWidth - 30 && 
            this.y > CONFIG.canvasHeight/2 - 60 && 
            this.y < CONFIG.canvasHeight/2 + 60) {
            this.score('player');
        }
        
        // Gol do CPU (esquerda)
        if (this.x < 30 && 
            this.y > CONFIG.canvasHeight/2 - 60 && 
            this.y < CONFIG.canvasHeight/2 + 60) {
            this.score('cpu');
        }
    }
    
    checkPlayerCollision() {
        for (const player of STATE.players) {
            if (player === this.owner) continue;
            
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = this.radius + player.radius;
            
            if (distance < minDist) {
                // Colisão
                if (this.owner) this.owner.hasBall = false;
                
                // Rebater
                const angle = Math.atan2(dy, dx);
                const force = 3;
                this.vx = Math.cos(angle) * force;
                this.vy = Math.sin(angle) * force;
                
                // Chance de pegar a bola
                if (Math.random() < 0.3) {
                    this.owner = player;
                    player.hasBall = true;
                    playSound('kick');
                }
                
                break;
            }
        }
    }
    
    score(scorer) {
        playSound('goal');
        
        if (scorer === 'player') {
            STATE.playerScore++;
            document.getElementById('playerScore').textContent = STATE.playerScore;
        } else {
            STATE.cpuScore++;
            document.getElementById('cpuScore').textContent = STATE.cpuScore;
        }
        
        // Resetar
        this.reset();
        resetPlayers();
        
        // Dar bola para quem não marcou
        const receivingTeam = scorer === 'player' ? 'cpu' : 'player';
        const receiver = STATE.players.find(p => p.team === receivingTeam && !p.hasBall);
        if (receiver) {
            this.owner = receiver;
            receiver.hasBall = true;
        }
    }
    
    reset() {
        this.x = CONFIG.canvasWidth / 2;
        this.y = CONFIG.canvasHeight / 2;
        this.vx = 0;
        this.vy = 0;
        this.owner = null;
    }
    
    draw(ctx) {
        // Sombra
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        
        // Bola
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalhes
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Padrão
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
    }
    
    kick(power, angle) {
        this.vx = Math.cos(angle) * power;
        this.vy = Math.sin(angle) * power;
        this.owner = null;
        playSound('kick');
    }
}

function startGame() {
    // Resetar estado
    STATE.gameActive = true;
    STATE.gamePaused = false;
    STATE.matchTimeLeft = CONFIG.matchTime;
    STATE.playerScore = 0;
    STATE.cpuScore = 0;
    
    // Atualizar UI
    document.getElementById('playerScore').textContent = '0';
    document.getElementById('cpuScore').textContent = '0';
    document.getElementById('timer').textContent = formatTime(STATE.matchTimeLeft);
    
    // Criar objetos do jogo
    createGameObjects();
    
    // Iniciar temporizador
    startTimer();
    
    // Mudar para tela do jogo
    switchScreen('game');
    
    playSound('whistle');
}

function createGameObjects() {
    STATE.players = [];
    STATE.ball = new Ball(CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2);
    
    // Time do jogador (esquerda)
    STATE.players.push(new Player(CONFIG.canvasWidth * 0.3, CONFIG.canvasHeight * 0.4, 'player', true));
    STATE.players.push(new Player(CONFIG.canvasWidth * 0.3, CONFIG.canvasHeight * 0.6, 'player'));
    
    // Time do CPU (direita)
    STATE.players.push(new Player(CONFIG.canvasWidth * 0.7, CONFIG.canvasHeight * 0.4, 'cpu'));
    STATE.players.push(new Player(CONFIG.canvasWidth * 0.7, CONFIG.canvasHeight * 0.6, 'cpu'));
    
    // Goleiros
    STATE.players.push(new Player(50, CONFIG.canvasHeight / 2, 'player'));
    STATE.players.push(new Player(CONFIG.canvasWidth - 50, CONFIG.canvasHeight / 2, 'cpu'));
    
    // Encontrar jogador controlado
    STATE.controlledPlayer = STATE.players.find(p => p.isControlled);
    
    // Dar bola aleatoriamente
    const playersWithoutGK = STATE.players.filter(p => p.y !== CONFIG.canvasHeight / 2);
    const randomPlayer = playersWithoutGK[Math.floor(Math.random() * playersWithoutGK.length)];
    STATE.ball.owner = randomPlayer;
    randomPlayer.hasBall = true;
}

function resetPlayers() {
    // Resetar posições
    STATE.players[0].x = CONFIG.canvasWidth * 0.3;
    STATE.players[0].y = CONFIG.canvasHeight * 0.4;
    STATE.players[1].x = CONFIG.canvasWidth * 0.3;
    STATE.players[1].y = CONFIG.canvasHeight * 0.6;
    STATE.players[2].x = CONFIG.canvasWidth * 0.7;
    STATE.players[2].y = CONFIG.canvasHeight * 0.4;
    STATE.players[3].x = CONFIG.canvasWidth * 0.7;
    STATE.players[3].y = CONFIG.canvasHeight * 0.6;
    STATE.players[4].x = 50;
    STATE.players[4].y = CONFIG.canvasHeight / 2;
    STATE.players[5].x = CONFIG.canvasWidth - 50;
    STATE.players[5].y = CONFIG.canvasHeight / 2;
    
    // Resetar velocidades
    STATE.players.forEach(p => {
        p.vx = 0;
        p.vy = 0;
        p.hasBall = false;
    });
}

function startTimer() {
    if (STATE.timer) clearInterval(STATE.timer);
    
    STATE.timer = setInterval(() => {
        if (!STATE.gameActive || STATE.gamePaused) return;
        
        STATE.matchTimeLeft--;
        document.getElementById('timer').textContent = formatTime(STATE.matchTimeLeft);
        
        if (STATE.matchTimeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function pauseGame() {
    STATE.gamePaused = true;
    
    // Atualizar tela de pausa
    document.getElementById('pausePlayerScore').textContent = STATE.playerScore;
    document.getElementById('pauseCpuScore').textContent = STATE.cpuScore;
    document.getElementById('pauseTimer').textContent = formatTime(STATE.matchTimeLeft);
    
    switchScreen('pause');
}

function resumeGame() {
    STATE.gamePaused = false;
    switchScreen('game');
}

function restartGame() {
    STATE.gameActive = false;
    if (STATE.timer) clearInterval(STATE.timer);
    setTimeout(startGame, 100);
}

function endGame() {
    STATE.gameActive = false;
    if (STATE.timer) clearInterval(STATE.timer);
    
    // Atualizar estatísticas
    STATE.games++;
    if (STATE.playerScore > STATE.cpuScore) {
        STATE.wins++;
        STATE.level += Math.floor(STATE.playerScore / 3);
    }
    saveData();
    
    // Atualizar tela de fim
    document.getElementById('finalPlayerScore').textContent = STATE.playerScore;
    document.getElementById('finalCpuScore').textContent = STATE.cpuScore;
    
    let title, message;
    const trophy = document.getElementById('trophyIcon');
    
    if (STATE.playerScore > STATE.cpuScore) {
        title = 'VITÓRIA!';
        message = 'Parabéns! Você venceu!';
        trophy.style.background = 'linear-gradient(135deg, #f1c40f, #e67e22)';
    } else if (STATE.playerScore < STATE.cpuScore) {
        title = 'DERROTA';
        message = 'Mais sorte na próxima!';
        trophy.style.background = 'linear-gradient(135deg, #95a5a6, #7f8c8d)';
    } else {
        title = 'EMPATE!';
        message = 'Partida equilibrada!';
        trophy.style.background = 'linear-gradie
