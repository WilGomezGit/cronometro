const $ = id => document.getElementById(id);
const CIRC = 2 * Math.PI * 90;
const bar = $("bar");
bar.style.strokeDasharray = CIRC;

let phases = [], idx = 0, grand = 0;
let phaseStart = 0, phaseElapsed = 0, doneBefore = 0;
let running = false, paused = false, raf = 0, lastBeepSec = -1;

function beep(freq = 880, ms = 150) {
    try {
        const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = freq; g.gain.value = 0.2;
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + ms / 1000);
    } catch (e) {}
}

function setPhaseUI(p) {
    document.body.className = p ? p.type : "prep";
    $("phase").textContent = p ? p.label : "¡Listo!";
    $("round").textContent = p && p.total ? `Serie ${p.n} de ${p.total}` : "";
    const nxt = phases[idx + 1];
    $("next").textContent = nxt ? `Siguiente: ${nxt.label} ${fmt(nxt.dur)}` : (p ? "Última fase" : "");
}

// La barra se ajusta sola a la duración de cada fase
function draw() {
    const p = phases[idx];
    if (!p) return;
    const el = Math.min(p.dur, paused ? phaseElapsed : phaseElapsed + (performance.now() - phaseStart) / 1000);
    const left = p.dur - el;
    $("time").textContent = fmt(left);
    bar.style.strokeDashoffset = CIRC * (1 - left / p.dur);
    const done = doneBefore + el;
    $("total").style.width = (done / grand * 100) + "%";
    $("elapsed").textContent = "Transcurrido " + fmt(done);
    $("remaining").textContent = "Restante " + fmt(grand - done);
    document.title = `${fmt(left)} · ${p.label}`;

    const sec = Math.ceil(left);
    if (sec <= 3 && sec > 0 && sec !== lastBeepSec) { lastBeepSec = sec; beep(660, 120); }
    return el >= p.dur;
}

function tick() {
    if (!running) return;
    if (!paused && draw()) { nextPhase(); }
    raf = requestAnimationFrame(tick);
}

function nextPhase() {
    doneBefore += phases[idx].dur;
    idx++;
    lastBeepSec = -1;
    if (idx >= phases.length) { finish(); return; }
    phaseElapsed = 0; phaseStart = performance.now();
    beep(1320, 350);
    if (navigator.vibrate) navigator.vibrate(200);
    setPhaseUI(phases[idx]);
}

function finish() {
    running = false;
    document.body.className = "rest";
    $("phase").textContent = "¡Terminaste! 🎉";
    $("time").textContent = "00:00";
    $("next").textContent = "";
    bar.style.strokeDashoffset = 0;
    $("total").style.width = "100%";
    $("remaining").textContent = "Restante 00:00";
    $("pause").disabled = true;
    $("start").textContent = "REINICIAR";
    try { $("alertSound").play(); } catch (e) {}
    document.title = "Reloj";
}

function start() {
    cancelAnimationFrame(raf);
    phases = buildPhases(loadConfig());
    grand = phases.reduce((s, p) => s + p.dur, 0);
    idx = 0; doneBefore = 0; phaseElapsed = 0; phaseStart = performance.now();
    running = true; paused = false; lastBeepSec = -1;
    $("pause").disabled = false; $("pause").textContent = "PAUSA"; $("start").textContent = "REINICIAR";
    setPhaseUI(phases[0]);
    beep(1320, 250);
    tick();
}

function reset() {
    cancelAnimationFrame(raf);
    running = false; paused = false;
    const cfg = loadConfig();
    phases = buildPhases(cfg); grand = phases.reduce((s, p) => s + p.dur, 0); idx = 0; doneBefore = 0;
    setPhaseUI(null);
    $("phase").textContent = "Listo";
    $("time").textContent = fmt(phases[0] ? phases[0].dur : 0);
    $("next").textContent = `${cfg.blocks.reduce((n, b) => n + b.reps, 0)} series · ${fmt(grand)} en total`;
    bar.style.strokeDashoffset = 0;
    $("total").style.width = "0";
    $("elapsed").textContent = "Transcurrido 00:00";
    $("remaining").textContent = "Restante " + fmt(grand);
    $("pause").disabled = true; $("pause").textContent = "PAUSA"; $("start").textContent = "INICIAR";
    document.title = "Reloj";
}

$("start").addEventListener("click", start);
$("reset").addEventListener("click", reset);
$("pause").addEventListener("click", () => {
    if (!running) return;
    if (paused) { phaseStart = performance.now(); paused = false; $("pause").textContent = "PAUSA"; }
    else { phaseElapsed += (performance.now() - phaseStart) / 1000; paused = true; $("pause").textContent = "CONTINUAR"; }
});

reset();
