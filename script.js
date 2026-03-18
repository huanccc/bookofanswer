// --- 1. 答案词库 ---
const answers = [
    "顺其自然。", "现在还不是时候。", "大胆去做吧！", "换个角度想想。", 
    "停下来，仔细思考。", "遵从你内心的直觉。", "答案就在你身边。", 
    "放弃也是一种选择。", "这需要时间的沉淀。", "ERROR: 算力不足", "YES_100%"
];

// --- 2. 鼠标跟随逻辑 ---
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');
const mousePos = { x: 0, y: 0 };
const cursorLink = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
    document.getElementById('mouse-x').textContent = e.clientX;
    document.getElementById('mouse-y').textContent = e.clientY;
    cursorDot.style.left = `${e.clientX}px`;
    cursorDot.style.top = `${e.clientY}px`;
});

const loopCursor = () => {
    const dx = mousePos.x - cursorLink.x;
    const dy = mousePos.y - cursorLink.y;
    cursorLink.x += dx * 0.15;
    cursorLink.y += dy * 0.15;
    cursorOutline.style.left = `${cursorLink.x}px`;
    cursorOutline.style.top = `${cursorLink.y}px`;
    requestAnimationFrame(loopCursor);
};
loopCursor();

// --- 3. 实时时间 ---
setInterval(() => {
    document.getElementById('timestamp').textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
}, 1000);

// --- 4. 赛博乱码文字特效 (核心逻辑) ---
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span style="font-family: monospace; opacity: 0.5;">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// 绑定抽取事件
const answerDisplay = document.getElementById('answer-display');
const scrambler = new TextScramble(answerDisplay);

const triggerAnswer = () => {
    const randomIndex = Math.floor(Math.random() * answers.length);
    scrambler.setText(answers[randomIndex]);
};

// 点击画布或按钮都会触发答案
document.getElementById('canvas-zone').addEventListener('click', triggerAnswer);
document.getElementById('ask-btn').addEventListener('click', (e) => {
    e.preventDefault();
    triggerAnswer();
});

// --- 5. ASCII 背景动画引擎 ---
const canvas = document.getElementById('ascii-canvas');
const ctx = canvas.getContext('2d');
const renderMsEl = document.getElementById('render-ms');
let width, height;
const charSize = 12; 
const densityChars = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

function resize() {
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
resize();

function simpleNoise(x, y, t) {
    return Math.sin(x * 0.05 + t) * Math.cos(y * 0.05 + t) + Math.sin(x * 0.01 - t) * Math.cos(y * 0.12) * 0.5;
}

let time = 0;
function render() {
    const start = performance.now();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${charSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const colsCount = Math.ceil(width / charSize);
    const rowsCount = Math.ceil(height / charSize);

    for (let y = Math.floor(rowsCount * 0.4); y < rowsCount; y++) {
        for (let x = 0; x < colsCount; x++) {
            const posX = x * charSize;
            const posY = y * charSize;
            const dx = posX - mousePos.x;
            const dy = posY - mousePos.y; 
            const dist = Math.sqrt(dx*dx + dy*dy);
            const normalizedY = (rowsCount - y) / rowsCount; 
            const noiseVal = simpleNoise(x, y, time * 0.5);
            const mountainHeight = 0.3 + (Math.sin(x * 0.05 + time * 0.1) * 0.1);

            let char = '';
            let alpha = 0;

            if (normalizedY < mountainHeight + (noiseVal * 0.1)) {
                const index = Math.floor(Math.abs(noiseVal) * densityChars.length);
                char = densityChars[index % densityChars.length];
                alpha = 1 - (normalizedY * 2); 
            }

            if (dist < 150) {
                const lensStrength = 1 - (dist / 150);
                if (Math.random() > 0.5) {
                    char = Math.random() > 0.5 ? '0' : '1';
                    ctx.fillStyle = `rgba(0, 0, 0, ${lensStrength})`;
                } else {
                    ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
                }
                ctx.fillText(char, posX + (charSize/2) - (dx/dist)*10*lensStrength, posY + (charSize/2) - (dy/dist)*10*lensStrength);
            } else if (char) {
                ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
                ctx.fillText(char, posX + (charSize/2), posY + (charSize/2));
            }
        }
    }
    time += 0.01;
    renderMsEl.textContent = (performance.now() - start).toFixed(1);
    requestAnimationFrame(render);
}
render();