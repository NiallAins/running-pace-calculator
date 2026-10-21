"use strict";
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
    distBackyard: getInputEl('INP_DIST_BACKYARD')
}, OUTPUTS = {
    distUnits: getOutputEl('EL_DIST_UNITS'),
    paceUnits: getOutputEl('EL_PACE_UNITS'),
    paceSpeedSm: getOutputEl('EL_PACE_SPEED_SM'),
    paceSpeedLg: getOutputEl('EL_PACE_SPEED_LG')
};
const MIN_TO_SEC = 60, HR_TO_SEC = 60 * MIN_TO_SEC, KM_TO_MI = 1.6093, KM_TO_M = 1000, MI_TO_FT = 5280, distMarathon = 42.195, distHalf = distMarathon * 0.5, distBackyard = 6.706;
const MIN_dist = 0.01, MAX_dist = 9999, MIN_TIME = 1, MAX_TIME = (999 * HR_TO_SEC) + (59 * MIN_TO_SEC) + 59, MIN_PACE = (1 * MIN_TO_SEC) + 20, MAX_PACE = (999 * MIN_TO_SEC) + 59, MAX_DEC_PLACE = 2, MAX_DEC_PLACE_SPEED = 1;
const STATE = {
    arrowKeyInput: false,
    isMetric: true,
    dist: distMarathon,
    time: 3 * HR_TO_SEC,
    pace: 0
};
function getInputEl(id) {
    return document.getElementById(id);
}
function getOutputEl(id) {
    return document.getElementById(id);
}
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
    // Value change
    INPUTS.dist.oninput = () => ondistInput();
    INPUTS.paceMin.oninput = e => onPaceInput(e?.target);
    INPUTS.paceSec.oninput = e => onPaceInput(e?.target);
    INPUTS.timeHr.oninput = e => onTimeInput(e?.target);
    INPUTS.timeMin.oninput = e => onTimeInput(e?.target);
    INPUTS.timeSec.oninput = e => onTimeInput(e?.target);
    // Up / down key input
    INPUTS.dist.onkeydown =
        INPUTS.paceMin.onkeydown =
            INPUTS.paceSec.onkeydown =
                INPUTS.timeHr.onkeydown =
                    INPUTS.timeMin.onkeydown =
                        INPUTS.timeSec.onkeydown =
                            e => e.key === 'ArrowDown' || e.key === 'ArrowUp'
                                ? STATE.arrowKeyInput = true
                                : null;
    // Input focus
    INPUTS.dist.onfocus =
        INPUTS.paceMin.onfocus =
            INPUTS.paceSec.onfocus =
                INPUTS.timeHr.onfocus =
                    INPUTS.timeMin.onfocus =
                        INPUTS.timeSec.onfocus =
                            e => e.target.select();
    // Input format on blur
    INPUTS.dist.onblur =
        INPUTS.paceMin.onblur =
            INPUTS.paceSec.onblur =
                INPUTS.timeHr.onblur =
                    INPUTS.timeMin.onblur =
                        INPUTS.timeSec.onblur =
                            () => updateUI();
    // Presets
    INPUTS.distMarathon.onclick = () => {
        INPUTS.dist.value = STATE.isMetric ? distMarathon : distMarathon / KM_TO_MI;
        INPUTS.dist.oninput();
        INPUTS.dist.onblur();
    };
    INPUTS.distHalf.onclick = () => {
        INPUTS.dist.value = String(STATE.isMetric ? distHalf : distHalf / KM_TO_MI);
        INPUTS.dist.oninput();
        INPUTS.dist.onblur();
    };
    INPUTS.distBackyard.onclick = () => {
        INPUTS.dist.value = String(STATE.isMetric ? distBackyard : distBackyard / KM_TO_MI);
        INPUTS.dist.oninput();
        INPUTS.dist.onblur();
    };
    onTimeInput(INPUTS.timeHr);
}
function onUnitInput(isMetric) {
    if (isMetric !== STATE.isMetric) {
        STATE.isMetric = isMetric;
        const SCALE = isMetric ? 1 / KM_TO_MI : KM_TO_MI;
        STATE.dist /= SCALE;
        STATE.pace *= SCALE;
        updateUI();
    }
}
function ondistInput() {
    STATE.dist = parseFloat(INPUTS.dist.value) || 0;
    syncTimeTodist();
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
function syncTimeToPace() {
    STATE.time = STATE.pace * STATE.dist;
}
function syncPaceToTime() {
    STATE.pace = STATE.time / STATE.dist;
}
function syncTimeTodist() {
    STATE.time = STATE.dist * STATE.pace;
}
function updateUI(currentInp = null) {
    // Only format current input when editing via keyboard arrows
    if (STATE.arrowKeyInput) {
        currentInp = null;
        STATE.arrowKeyInput = false;
    }
    // Set input max / min
    const SCALE = STATE.isMetric ? 1 : KM_TO_MI;
    if (STATE.dist > MAX_dist * SCALE || STATE.dist < MIN_dist * SCALE) {
        STATE.dist = Math.max(MIN_dist * SCALE, Math.min(MAX_dist * SCALE, STATE.dist));
        syncTimeTodist();
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
    if (currentInp !== INPUTS.timeHr) {
        INPUTS.timeHr.value = String(Math.floor(STATE.time / HR_TO_SEC));
    }
    if (currentInp !== INPUTS.timeMin) {
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
function paceToSpeed(pace, metric, short) {
    const SPEED = short
        ? (metric ? KM_TO_M : MI_TO_FT) / pace
        : (HR_TO_SEC / pace) * (metric ? 1 : KM_TO_MI);
    return formatDecimal(SPEED, MAX_DEC_PLACE_SPEED);
}
function formatDecimal(num, max) {
    const POW = 10 ** (max + 1);
    return Math.round(num * POW) / POW;
}
init();
