let cameraStream;
let useFrontCamera = false;
let shotCount = Number(localStorage.getItem("sc_shotCount") || "0");
const MAX_FREE_SHOTS = 3;

const camera = document.getElementById("camera");
const snapButton = document.getElementById("snapButton");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const resultKcal = document.getElementById("resultKcal");
const resultCarb = document.getElementById("resultCarb");
const resultProtein = document.getElementById("resultProtein");
const resultFat = document.getElementById("resultFat");
const coachingText = document.getElementById("coachingText");
const freeBadge = document.getElementById("freeBadge");
const loadingOverlay = document.getElementById("loadingOverlay");

// 팝업 요소
const guideModal = document.getElementById("guideModal");
const guideCloseBtn = document.getElementById("guideCloseBtn");
const subscribeModal = document.getElementById("subscribeModal");

updateFreeBadge();
openGuideModal();

async function startCamera() {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());

    let cameraFacingMode = useFrontCamera ? "user" : "environment";

    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode }
    });

    camera.srcObject = cameraStream;
}

switchCameraBtn.addEventListener("click", () => {
    useFrontCamera = !useFrontCamera;
    startCamera();
});

snapButton.addEventListener("click", () => {
    if (shotCount >= MAX_FREE_SHOTS) {
        openSubscribeModal();
        return;
    }

    shotCount++;
    localStorage.setItem("sc_shotCount", shotCount.toString());
    updateFreeBadge();

    loadingOverlay.style.display = "flex";

    setTimeout(() => {
        loadingOverlay.style.display = "none";
        const kcal = 95 + Math.floor(Math.random() * 30);
        resultKcal.textContent = `${kcal} kcal`;
        resultCarb.textContent = `${Math.floor(kcal * 0.7 / 4)} g`;
        resultProtein.textContent = `${Math.floor(kcal * 0.2 / 4)} g`;
        resultFat.textContent = `${Math.floor(kcal * 0.1 / 9)} g`;

        coachingText.textContent = "🍎 좋은 음식 선택이에요!";

        if (shotCount >= MAX_FREE_SHOTS) openSubscribeModal();
    }, 2000);
});

// 사용법 팝업
guideCloseBtn.addEventListener("click", () => {
    guideModal.style.display = "none";
});

function updateFreeBadge() {
    const remain = Math.max(0, MAX_FREE_SHOTS - shotCount);
    freeBadge.textContent = `${remain} / ${MAX_FREE_SHOTS} · 무료 체험 · 남은 촬영 ${remain}회 (총 ${MAX_FREE_SHOTS}회)`;
}

// 구독 팝업
function openSubscribeModal() {
    subscribeModal.style.display = "flex";
}
function closeSubscribeModal() {
    subscribeModal.style.display = "none";
}
function selectPlan(plan) {
    alert(plan + " 구독 준비 중입니다! 🚀");
}

// 앱 실행
startCamera();
