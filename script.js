"use strict";
//
// Types
//
//
// Readonly variables
//
const MIN_TO_SEC = 60, HR_TO_SEC = 60 * MIN_TO_SEC, KM_TO_MI = 1.6093, KM_TO_M = 1000, MI_TO_FT = 5280, DIST_SH = 5, DIST_MD = 10, DIST_MARATHON = 42.195, DIST_HALF = DIST_MARATHON * 0.5, DIST_BACKYARD = 6.706;
const MIN_DIST = 0.01, MAX_DIST = 9999, MIN_TIME = 1, MAX_TIME = (999 * HR_TO_SEC) + (59 * MIN_TO_SEC) + 59, MIN_PACE = (1 * MIN_TO_SEC) + 20, MAX_PACE = (999 * MIN_TO_SEC) + 59, MAX_DEC_PLACE = 2, MAX_DEC_PLACE_SPEED = 1;
// Slope of pace change over dist, for slow and fast runners - sourced from real world data
const EST_SLOPE_SLOW = 6.045, EST_SLOPE_FAST = 4.208, EST_SAMPLE_DIST = 5, EST_SAMPLE_TIME_SLOW = (5.75 * MIN_TO_SEC) * EST_SAMPLE_DIST, EST_SAMPLE_TIME_FAST = (3.75 * MIN_TO_SEC) * EST_SAMPLE_DIST;
//
// State variables
//
const STATE = {
    arrowKeyInput: false,
    isMetric: true,
    dist: DIST_MARATHON,
    time: 3 * HR_TO_SEC,
    pace: 0
};
//
// Elements
//
const INPUTS = {
    dist: getInputEl('INP_DIST'),
    unitKm: getInputEl('INP_UNIT_KM'),
    unitMi: getInputEl('INP_UNIT_MI'),
    paceMin: getInputEl('INP_PACE_MIN'),
    paceSec: getInputEl('INP_PACE_SEC'),
    timeHr: getInputEl('INP_TIME_HR'),
    timeMin: getInputEl('INP_TIME_MIN'),
    timeSec: getInputEl('INP_TIME_SEC'),
    distHalf: getInputEl('INP_DIST_HALF'),
    distMarathon: getInputEl('INP_DIST_MARATHON'),
    distBackyard: getInputEl('INP_DIST_BACKYARD'),
    download: getOutputEl('EL_DOWNLOAD')
}, OUTPUTS = {
    distUnits: getOutputEl('EL_DIST_UNITS'),
    paceUnits: getOutputEl('EL_PACE_UNITS'),
    paceSpeedSm: getOutputEl('EL_PACE_SPEED_SM'),
    paceSpeedLg: getOutputEl('EL_PACE_SPEED_LG'),
    predicted: getOutputEl('EL_PREDICTED'),
};
function getInputEl(id) {
    return document.getElementById(id);
}
function getOutputEl(id) {
    return document.getElementById(id);
}
//
// Init UI
//
function init() {
    // Init default state
    INPUTS.unitKm.checked = STATE.isMetric;
    INPUTS.unitMi.checked = !STATE.isMetric;
    INPUTS.dist.value = STATE.dist;
    INPUTS.timeHr.value = Math.floor(STATE.time / HR_TO_SEC);
    INPUTS.timeMin.value = Math.floor((STATE.time % HR_TO_SEC) / MIN_TO_SEC);
    INPUTS.timeSec.value = Math.round(STATE.time % MIN_TO_SEC);
    // Unit change
    INPUTS.unitKm.onclick = () => onUnitInput(true);
    INPUTS.unitMi.onclick = () => onUnitInput(false);
    // Set up input events
    initInput(INPUTS.dist, 4, 3, onDistInput);
    initInput(INPUTS.paceMin, 2, 0, onPaceInput);
    initInput(INPUTS.paceSec, 2, 0, onPaceInput);
    initInput(INPUTS.timeHr, 3, 0, onTimeInput);
    initInput(INPUTS.timeMin, 2, 0, onTimeInput);
    initInput(INPUTS.timeSec, 2, 0, onTimeInput);
    // Presets
    INPUTS.distMarathon.onclick = () => {
        INPUTS.dist.value = STATE.isMetric ? DIST_MARATHON : DIST_MARATHON / KM_TO_MI;
        INPUTS.dist.oninput();
        INPUTS.dist.onblur();
    };
    INPUTS.distHalf.onclick = () => {
        INPUTS.dist.value = String(STATE.isMetric ? DIST_HALF : DIST_HALF / KM_TO_MI);
        INPUTS.dist.oninput();
        INPUTS.dist.onblur();
    };
    INPUTS.distBackyard.onclick = () => {
        INPUTS.dist.value = String(STATE.isMetric ? DIST_BACKYARD : DIST_BACKYARD / KM_TO_MI);
        INPUTS.dist.oninput();
        INPUTS.dist.onblur();
    };
    onTimeInput(INPUTS.timeHr);
    // Web app download button
    let installEvent = null;
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        installEvent = e;
    });
    INPUTS.download.onclick = () => installEvent?.prompt();
}
function initInput(inp, maxInt, maxDecimal, onInput) {
    inp.dataset.prevValue = '';
    inp.onfocus = () => {
        inp.placeholder = inp.dataset.prevValue = inp.value;
        inp.value = '';
        inp.dataset.hideCursor = '';
    };
    inp.oninput = () => {
        console.log(inp.value);
        let newValue = inp.value
            .replace(/[^0-9.]/g, '')
            .replace(new RegExp(`^([0-9]{${maxInt}})[0-9]*`), '$1');
        if (maxDecimal) {
            newValue = newValue.replace(new RegExp(`(\.[0-9]{${maxDecimal}})[0-9]*$`), '$1');
        }
        else {
            newValue = newValue.replace(/\.[0-9]*/, '');
        }
        if (inp.value !== newValue) {
            inp.value = newValue;
        }
        onInput(inp);
    };
    inp.onmousemove = () => delete inp.dataset.hideCursor;
    inp.onkeydown = e => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            inp.dataset.hasCaret = '';
        }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            STATE.arrowKeyInput = true;
        }
        if (e.key.indexOf('Arrow') === 0 && !inp.value) {
            inp.value = inp.dataset.prevValue;
        }
        if (e.key === 'Enter') {
            document.body.focus();
        }
    };
    inp.onblur = () => {
        if (inp.value) {
            updateUI();
        }
        else {
            inp.value = inp.dataset.prevValue;
        }
        delete inp.dataset.hasCaret;
    };
}
//
// Input events
//
function onUnitInput(isMetric) {
    if (isMetric !== STATE.isMetric) {
        STATE.isMetric = isMetric;
        const SCALE = isMetric ? 1 / KM_TO_MI : KM_TO_MI;
        STATE.dist /= SCALE;
        STATE.pace *= SCALE;
        updateUI();
    }
}
function onDistInput() {
    STATE.dist = parseFloat(INPUTS.dist.value) || 0;
    syncTimeToDist();
    updateUI(INPUTS.dist);
}
function onTimeInput(currentInput = null) {
    STATE.time =
        ((parseFloat(INPUTS.timeHr.value) || 0) * HR_TO_SEC) +
            ((parseFloat(INPUTS.timeMin.value) || 0) * MIN_TO_SEC) +
            parseFloat(INPUTS.timeSec.value) || 0;
    syncPaceToTime();
    updateUI(currentInput);
}
function onPaceInput(currentInput = null) {
    STATE.pace =
        ((parseFloat(INPUTS.paceMin.value) || 0) * MIN_TO_SEC) +
            (parseFloat(INPUTS.paceSec.value) || 0);
    syncTimeToPace();
    updateUI(currentInput);
}
//
// Data sync
//
function syncTimeToPace() {
    STATE.time = STATE.pace * STATE.dist;
}
function syncPaceToTime() {
    STATE.pace = STATE.time / STATE.dist;
}
function syncTimeToDist() {
    STATE.time = STATE.dist * STATE.pace;
}
//
// UI
//
function updateUI(currentInp = null) {
    // Only format current input when editing via keyboard arrows
    if (STATE.arrowKeyInput) {
        currentInp = null;
        STATE.arrowKeyInput = false;
    }
    // Set input max / min
    const SCALE = STATE.isMetric ? 1 : KM_TO_MI;
    if (STATE.dist > MAX_DIST * SCALE || STATE.dist < MIN_DIST * SCALE) {
        STATE.dist = Math.max(MIN_DIST * SCALE, Math.min(MAX_DIST * SCALE, STATE.dist));
        syncTimeToDist();
    }
    if (STATE.time > MAX_TIME * SCALE || STATE.time < MIN_TIME * SCALE) {
        STATE.time = Math.max(MIN_TIME * SCALE, Math.min(MAX_TIME * SCALE, STATE.time));
        syncPaceToTime();
    }
    if (STATE.pace > MAX_PACE * SCALE || STATE.pace < MIN_PACE * SCALE) {
        STATE.pace = Math.max(MIN_PACE * SCALE, Math.min(MAX_PACE * SCALE, STATE.pace));
        syncTimeToPace();
    }
    // Format and sync inputs
    INPUTS.unitKm.checked = STATE.isMetric;
    INPUTS.unitMi.checked = !STATE.isMetric;
    if (currentInp !== INPUTS.dist) {
        INPUTS.dist.value = String(formatDecimal(STATE.dist, MAX_DEC_PLACE));
    }
    if (currentInp !== INPUTS.paceMin) {
        INPUTS.paceMin.value = String(Math.floor(STATE.pace / MIN_TO_SEC));
    }
    if (currentInp !== INPUTS.paceSec) {
        INPUTS.paceSec.value = Math
            .round(STATE.pace % MIN_TO_SEC)
            .toString()
            .padStart(MAX_DEC_PLACE, '0');
    }
    if (currentInp !== INPUTS.timeHr && currentInp !== INPUTS.timeMin && currentInp !== INPUTS.timeSec) {
        INPUTS.timeHr.value = String(Math.floor(STATE.time / HR_TO_SEC));
    }
    if (currentInp !== INPUTS.timeMin && currentInp !== INPUTS.timeSec) {
        INPUTS.timeMin.value = Math
            .floor((STATE.time % HR_TO_SEC) / MIN_TO_SEC)
            .toString()
            .padStart(MAX_DEC_PLACE, '0');
    }
    if (currentInp !== INPUTS.timeSec) {
        INPUTS.timeSec.value = Math
            .round(STATE.time % MIN_TO_SEC)
            .toString()
            .padStart(MAX_DEC_PLACE, '0');
    }
    // Set predicited times
    const UNIT_LABEL = STATE.isMetric ? 'k' : 'M', UNIT_SCALE = (STATE.isMetric ? 1 : KM_TO_MI), DISTS = [
        [
            String(DIST_SH) + UNIT_LABEL,
            DIST_SH * UNIT_SCALE
        ],
        [
            String(DIST_MD) + UNIT_LABEL,
            DIST_MD * UNIT_SCALE
        ],
        [
            Math.floor(DIST_HALF / UNIT_SCALE) + UNIT_LABEL,
            DIST_HALF
        ],
        [
            Math.floor(DIST_MARATHON / UNIT_SCALE) + UNIT_LABEL,
            DIST_MARATHON
        ],
    ];
    OUTPUTS.predicted.innerHTML = DISTS
        .map(([label, dist]) => [
        label,
        formatTime(estimateTime(STATE.dist * SCALE, STATE.time, dist))
    ])
        .map(([label, time]) => `<span>${label}</span><span>${time}</span>`)
        .join('');
    // Set units
    OUTPUTS.distUnits.innerHTML = STATE.isMetric ? 'km' : 'mi';
    OUTPUTS.paceUnits.innerHTML = STATE.isMetric ? 'km' : 'mi';
    OUTPUTS.paceSpeedSm.innerHTML = paceToSpeed(STATE.pace, STATE.isMetric, true) + (STATE.isMetric ? ' m/s' : ' ft/s');
    OUTPUTS.paceSpeedLg.innerHTML = paceToSpeed(STATE.pace, STATE.isMetric, false) + (STATE.isMetric ? ' km/h' : ' mph');
    // Set screen reader units
    INPUTS.dist.setAttribute('aria-label', `distance in ${STATE.isMetric ? 'kilometers' : 'miles'}`);
    INPUTS.paceMin.setAttribute('aria-label', `pace per ${STATE.isMetric ? 'kilometer' : 'mile'}: minutes`);
    INPUTS.paceSec.setAttribute('aria-label', `pace per ${STATE.isMetric ? 'kilometer' : 'mile'}: seconds`);
}
//
// Conversion
//
function paceToSpeed(pace, metric, short) {
    const SPEED = short
        ? (metric ? KM_TO_M : MI_TO_FT) / pace
        : (HR_TO_SEC / pace) * (metric ? 1 : KM_TO_MI);
    return formatDecimal(SPEED, MAX_DEC_PLACE_SPEED);
}
function estimateTime(fromDist, fromTime, toDist) {
    // Get fast time and slow time for fromDist
    //   compare to prevTime to find relative pace slope
    //   use slope to estimate time for toDist
    const FROM_DIST_AT_SLOW_PACE = EST_SAMPLE_TIME_SLOW - (EST_SLOPE_SLOW * (EST_SAMPLE_DIST - fromDist)), FROM_DIST_AT_FAST_PACE = EST_SAMPLE_TIME_FAST - (EST_SLOPE_FAST * (EST_SAMPLE_DIST - fromDist)), FROM_PACE_SCALE = (fromTime - FROM_DIST_AT_SLOW_PACE) / (FROM_DIST_AT_FAST_PACE - FROM_DIST_AT_SLOW_PACE), PACE_SLOPE = EST_SLOPE_SLOW + ((EST_SLOPE_FAST - EST_SLOPE_SLOW) * FROM_PACE_SCALE), FROM_DIST_AT_TO_PACE = fromTime - (PACE_SLOPE * (fromDist - toDist));
    return FROM_DIST_AT_TO_PACE * (toDist / fromDist);
}
//
// Formatting
//
function formatDecimal(num, max) {
    const POW = 10 ** (max + 1);
    return Math.round(num * POW) / POW;
}
function formatTime(seconds) {
    seconds = Math.round(seconds);
    const HRS = Math.floor(seconds / HR_TO_SEC);
    seconds %= HR_TO_SEC;
    const MINS = Math.floor(seconds / MIN_TO_SEC);
    seconds %= MIN_TO_SEC;
    return ((HRS ? HRS + ':' : '') +
        (MINS || HRS ? MINS.toString().padStart(HRS ? 2 : 1, '0') + ':' : '') +
        (seconds.toString().padStart(HRS || MINS ? 2 : 1, '0')));
}
init();
