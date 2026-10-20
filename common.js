const STORAGE_KEY = "rutina-config-v1";

const DEFAULT_CONFIG = {
    prep: 10,      // segundos de preparación al iniciar
    postRest: 0,   // segundos de "prepárate" después de cada descanso
    blocks: [
        { work: 60, rest: 40, reps: 5 },
        { work: 120, rest: 60, reps: 2 },
        { work: 240, rest: 120, reps: 1 }
    ]
};

function loadConfig() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.blocks) && saved.blocks.length) return saved;
    } catch (e) {}
    return structuredClone(DEFAULT_CONFIG);
}

function saveConfig(cfg) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch (e) {}
}

function fmt(sec) {
    sec = Math.max(0, Math.ceil(sec));
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
}

// Convierte la configuración en una lista plana de fases
function buildPhases(cfg) {
    const phases = [];
    if (cfg.prep > 0) phases.push({ type: "prep", label: "Prepárate", dur: cfg.prep });
    const total = cfg.blocks.reduce((n, b) => n + b.reps, 0);
    let n = 0;
    cfg.blocks.forEach((b, bi) => {
        for (let r = 1; r <= b.reps; r++) {
            n++;
            phases.push({ type: "work", label: "SALTA", dur: b.work, block: bi, rep: r, reps: b.reps, n, total });
            if (n < total) {
                if (b.rest > 0) phases.push({ type: "rest", label: "Descanso", dur: b.rest, block: bi, rep: r, reps: b.reps, n, total });
                if (cfg.postRest > 0) phases.push({ type: "ready", label: "Prepárate", dur: cfg.postRest, block: bi, rep: r, reps: b.reps, n, total });
            }
        }
    });
    return phases;
}

function totalSeconds(cfg) {
    return buildPhases(cfg).reduce((s, p) => s + p.dur, 0);
}
