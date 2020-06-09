function distLawLB_SelectionChanged(event) {
    const {value} = event;
    if (value == null) return;

    if (value === "Нормальное распределение") {
        setVisibility("NormalDistributionSP", true)
        setVisibility("PoissonDistributionSP", false);
    } else if (value === "Распределение Пуассона") {
        setVisibility("NormalDistributionSP", false)
        setVisibility("PoissonDistributionSP", true);
    } else if (value === "Экспоненциальное распределение") {
        setVisibility("NormalDistributionSP", false)
        setVisibility("PoissonDistributionSP", true);
    }
}

function setVisibility(className, visible) {
    const elements = document.getElementsByClassName(className);

    for(let i = 0 ; i < elements.length; i++) {
        elements[i].style.display = visible ? "" : "none";
    }
}

function getValueById(id) {
    const element = document.getElementById(id);
    return element.value;
}
function get(id) {
    return parseFloat(getValueById(id))
}

function start() {
    killProcess();

    let distribution = null;
    let selectedDistribution = getValueById("distLawLB")

    if (selectedDistribution === "Нормальное распределение") {
        distribution = new window.NormalDistribution(get("muDistTB"), get("sigmaDistTB"));
    } else if (selectedDistribution === "Экспоненциальное распределение") {
        distribution = new window.ExponentialDistribution(get("lambdaDistTB"));
    } else if (selectedDistribution === "Распределение Пуассона") {
        distribution = new window.PoissonDistribution(get("lambdaDistTB"));
    }
    // create bars
    createBars(get("nTB"));

    // console.log(distribution.NextDouble());
    let delay = get("delayTB");
    window.currentModel = new window.Model(get("nTB"), get("mTB"), get("timeTB"), get("dtTB"), get("lambdaTB"), get("muTB"), distribution);
    window.currentModel.Loop(delay, progressBarsCallback, updateTextStateCallback, updateTotalProgressCallback)

}

function killProcess() {
    setVisibility("resumeButton", false);
    setVisibility("pauseButton", true);

    if (window.currentModel) {
        window.currentModel.pause();
    }
}

function pause() {
    window.currentModel.pause();
    setVisibility("resumeButton", true);
    setVisibility("pauseButton", false);
}

function resume() {
    window.currentModel.resume();
    setVisibility("resumeButton", false);
    setVisibility("pauseButton", true);
    let delay = get("delayTB");
    window.currentModel.Loop(delay, progressBarsCallback, updateTextStateCallback, updateTotalProgressCallback);
}

function createBars(count) {
    const element = document.getElementById("barsStates");
    let barsHtml = "";
    for(let i = 0 ; i < count; i++) {
        barsHtml += `<progress value="0" max="1" class="progressBar" id="progressBar-${i}"></progress><br>\n`;
    }

    element.innerHTML = barsHtml;
}

function progressBarsCallback(bars) {
    for(let i = 0 ; i < bars.length; i++) {
        const element = document.getElementById(`progressBar-${i}`);
        if (bars[i].Maximum && bars[i].Maximum !== element.max) {
            element.max = bars[i].Maximum;
        }
        element.value = bars[i].Value;
    }
}

function updateTextStateCallback(value) {
    const element = document.getElementById("details");
    let details = "";
    Object.keys(value).forEach(key => {
        details += `${key}: ${Math.round((value[key] + Number.EPSILON) * 100) / 100}\n`;
    });

    element.innerText = details;
}

function updateTotalProgressCallback(value) {
    const element = document.getElementById("totalProgress");
    if (value.Maximum && value.Maximum !== element.max) {
        element.max = value.Maximum;
    }
    element.value = value.Value;
}