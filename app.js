// SmartCal AI - Netlify Functions 연동 버전 (버튼 ID 자동 인식 버전)
// - 3회 무료 제한 + 구독 모달
// - /api/analyze 로 이미지(JSON, base64) 전송
// - 오늘 섭취 기록 + 총 칼로리
// - PWA 서비스워커 등록

const MAX_FREE_USES = 3;

let captureCount = 0;
let currentStream = null;
let currentFacingMode = "environment";

// 오늘 기록
let todayHistoryKey = "";
let history = [];

// ===== DOM 요소 가져오기 (ID 여러 개 대비) =====
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const guideOverlay = document.getElementById("guideOverlay");

// 버튼들: id 이름이 다를 수 있어서 여러 후보를 동시에 확인
const captureBtn =
  document.getElementById("captureBtn") ||
  document.getElementById("captureButton") || // 혹시 이렇게 썼을 경우
  document.querySelector("[data-role='captureBtn']");

const switchCameraBtn =
  document.getElementById("switchCameraBtn") ||
  document.getElementById("cameraSwitchBtn") ||
  document.querySelector("[data-role='switchCameraBtn']");

const resetGuideBtn =
  document.getElementById("resetGuideBtn") ||
  document.getElementById("showGuideBtn") ||
  document.querySelector("[data-role='resetGuideBtn']");

const usageText =
  document.getElementById("usageText") ||
  document.getElementById("usageLabel") ||
  document.querySelector("[data-role='usageText']");

const usageBadge =
  document.getElementById("usageBadge") ||
  document.getElementById("usageTag") ||
  document.querySelector("[data-role='usageBadge']");

const message =
  document.getElementById("message") ||
  document.getElementById("helperMessage") ||
  document.querySelector("[data-role='message']");

const resultSection =
  document.getElementById("resultSection") ||
  document.getElementById("analysisResult") ||
  document.querySelector("[data-role='resultSection']");

const foodNameEl =
  document.getElementById("foodName") ||
  document.getElementById("foodTitle") ||
  document.querySelector("[data-role='foodName']");

const calorieValueEl =
  document.getElementById("calorieValue") ||
  document.getElementById("calorieNumber") ||
  document.querySelector("[data-role='calorieValue']");

const resultNoteEl =
  document.getElementById("resultNote") ||
  document.getElementById("resultText") ||
  document.querySelector("[data-role='resultNote']");

const historySection =
  document.getElementById("historySection") ||
  document.getElementById("todayHistory") ||
  document.querySelector("[data-role='historySection']");

const historyDateLabel =
  document.getElementById("historyDateLabel") ||
  document.getElementById("historyTitle") ||
  document.querySelector("[data-role='historyDateLabel']");

const historyList =
  document.getElementById("historyList") ||
  document.querySelector("[data-role='historyList']");

const historyTotalEl =
  document.getElementById("historyTotal") ||
  document.querySelector("[data-role='historyTotal']");

const historyClearBtn =
  document.getElementById("historyClearBtn") ||
  document.querySelector("[data-role='historyClearBtn']");

const subscriptionModal =
  document.getElementById("subscriptionModal") ||
  document.querySelector("[data-role='subscriptionModal']");

const closeModalBtn =
  document.getElementById("closeModalBtn") ||
  document.querySelector("[data-role='closeModalBtn']");

const subscribeBtn =
  document.getElementById("subscribeBtn") ||
  document.querySelector("[data-role='subscribeBtn']");

const laterBtn =
  document.getElementById("laterBtn") ||
  document.querySelector("[data-role='laterBtn']");

// ===== 날짜 유틸 =====
function getTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function formatTodayLabel(key) {
  const [y, m, d] = key.split("-");
  return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
}

// ===== 오늘 기록 =====
function loadHistory() {
  const raw = localStorage.getItem(todayHistoryKey);
  if (!raw) {
    history = [];
    renderHistory();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    history = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("History parse error", e);
    history = [];
  }
  renderHistory();
}
function saveHistory() {
  try {
    localStorage.setItem(todayHistoryKey, JSON.stringify(history));
  } catch (e) {
    console.error("History save error", e);
  }
}
function addHistoryEntry(food) {
  const now = new Date();
  history.push({
    name: food.name,
    kcal: food.kcal,
    time: now.toISOString()
  });
  saveHistory();
  renderHistory();
}
function clearTodayHistory() {
  history = [];
  saveHistory();
  renderHistory();
}
function renderHistory() {
  if (!historySection || !historyList || !historyTotalEl || !historyDateLabel) return;

  if (!history || history.length === 0) {
    historySection.style.display = "none";
    historyList.innerHTML = "";
    historyTotalEl.textContent = "0";
    return;
  }
  historySection.style.display = "block";
  historyDateLabel.textContent = formatTodayLabel(getTodayKey());

  historyList.innerHTML = "";
  let total = 0;

  history.forEach((item) => {
    total += Number(item.kcal) || 0;

    const li = document.createElement("li");
    li.className = "history-item";

    const left = document.createElement("div");
    left.className = "history-left";

    const nameEl = document.createElement("div");
    nameEl.className = "history-name";
    nameEl.textContent = item.name;

    const timeEl = document.createElement("div");
    timeEl.className = "history-time";
    timeEl.textContent = `촬영 시간: ${formatTime(new Date(item.time))}`;

    left.appendChild(nameEl);
    left.appendChild(timeEl);

    const kcalEl = document.createElement("div");
    kcalEl.className = "history-kcal";
    kcalEl.textContent = `${item.kcal} kcal`;

    li.appendChild(left);
    li.appendChild(kcalEl);

    historyList.appendChild(li);
  });

  historyTotalEl.textContent = total.toString();
}

// ===== 카메라 =====
async function startCamera() {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }
    const constraints = { video: { facingMode: currentFacingMode }, audio: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    if (video) {
      video.srcObject = stream;
      await video.play();
    }
    setMessage("찍고 싶은 음식이 화면 중앙에 오도록 맞춰주세요. 📸", "info");
  } catch (err) {
    console.error(err);
    setMessage("카메라 접근 권한을 허용해 주세요. (브라우저 설정 확인)", "error");
  }
}

function setMessage(text, type = "info") {
  if (!message) return;
  message.textContent = text || "";
  if (!text) return;
  if (type === "error") message.style.color = "#fb7185";
  else if (type === "warn") message.style.color = "#facc15";
  else message.style.color = "#f97316";
}

function updateUsageUI() {
  if (usageText) {
    usageText.textContent = `무료 사용: ${captureCount} / ${MAX_FREE_USES}회`;
  }
  if (!usageBadge) return;

  if (captureCount >= MAX_FREE_USES) {
    usageBadge.textContent = "LIMIT REACHED";
    usageBadge.classList.add("limit");
    if (captureBtn) captureBtn.disabled = true;
  } else {
    usageBadge.textContent = "FREE MODE";
    usageBadge.classList.remove("limit");
    if (captureBtn) captureBtn.disabled = false;
  }
}

function openSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.add("active");
}
function closeSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.remove("active");
}

// ===== 데모용 음식 (서버 실패시 fallback) =====
const demoFoods = [
  { name: "김밥(1줄)", kcal: 320, note: "일반적인 김밥 1줄 기준 대략적인 칼로리입니다." },
  { name: "치킨(한 조각)", kcal: 250, note: "조리 방법에 따라 실제 칼로리는 달라질 수 있어요." },
  { name: "햄버거(1개)", kcal: 450, note: "소스와 사이즈에 따라 차이가 큽니다." },
  { name: "샐러드(1그릇)", kcal: 110, note: "드레싱을 많이 넣으면 칼로리가 올라갑니다." },
  { name: "라면(1봉지)", kcal: 500, note: "국물을 덜 마시면 칼로리를 조금 줄일 수 있어요." },
  { name: "초콜릿(1조각)", kcal: 60, note: "당분 섭취를 조절하면서 드시는 걸 추천합니다." }
];
function getRandomFoodResult() {
  return demoFoods[Math.floor(Math.random() * demoFoods.length)];
}

// ===== AI 서버 호출 (base64 JSON) =====
async function analyzeImageWithServer(dataUrl) {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataUrl })
    });

    if (!res.ok) throw new Error("Server error");
    const data = await res.json();

    if (!data || !data.foodName || !data.calories) {
      throw new Error("Invalid response");
    }

    return {
      name: data.foodName,
      kcal: data.calories,
      note: data.note || "AI 분석 결과를 기반으로 한 추정 칼로리입니다."
    };
  } catch (err) {
    console.warn("AI 서버 호출 실패, 데모 모드 사용:", err);
    return null;
  }
}

// ===== 촬영 & 분석 =====
async function captureAndAnalyze() {
  if (captureCount >= MAX_FREE_USES) {
    updateUsageUI();
    openSubscriptionModal();
    setMessage("무료 체험 3회가 모두 사용되었습니다. 😊", "warn");
    return;
  }
  if (!video || video.readyState < 2) {
    setMessage("카메라가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.", "warn");
    return;
  }

  try {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      setMessage("카메라 화면 정보를 가져오지 못했어요. 다시 시도해 주세요.", "error");
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    setMessage("AI가 이미지를 분석 중입니다… ⏳", "info");
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

    let result = await analyzeImageWithServer(dataUrl);

    if (!result) {
      result = getRandomFoodResult();
      result.note = (result.note || "") + " (데모 모드 결과입니다.)";
    }

    captureCount += 1;
    updateUsageUI();
    hideGuideOverlay();

    showResult(result);
    addHistoryEntry(result);

    if (captureCount >= MAX_FREE_USES) {
      openSubscriptionModal();
      setMessage("무료 3회 체험이 끝났어요. 구독 안내를 확인해 주세요. 🙌", "warn");
    } else {
      setMessage("분석이 완료되었습니다! 결과를 확인해 보세요. ✅", "info");
    }
  } catch (err) {
    console.error(err);
    setMessage("이미지 분석 중 오류가 발생했어요. 다시 시도해 주세요.", "error");
  }
}

function showResult(result) {
  if (!resultSection || !foodNameEl || !calorieValueEl || !resultNoteEl) return;
  foodNameEl.textContent = result.name;
  calorieValueEl.textContent = result.kcal;
  resultNoteEl.textContent =
    result.note || "촬영한 이미지를 기반으로 대략적인 칼로리를 추정합니다.";
  resultSection.style.display = "block";
}

// 안내 오버레이
function hideGuideOverlay() {
  if (!guideOverlay) return;
  guideOverlay.classList.add("hidden");
}
function showGuideOverlay() {
  if (!guideOverlay) return;
  guideOverlay.classList.remove("hidden");
  setMessage("화면 중앙에 음식이 잘 보이도록 맞춰주세요. 📷", "info");
}

// 카메라 전환
function toggleCamera() {
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  startCamera();
}

// PWA 서비스워커 등록
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service worker registered"))
      .catch((err) => console.warn("Service worker registration failed:", err));
  }
}

// ===== 초기화 =====
document.addEventListener("DOMContentLoaded", () => {
  todayHistoryKey = "smartcalHistory-" + getTodayKey();

  updateUsageUI();
  showGuideOverlay();
  startCamera();
  loadHistory();
  registerServiceWorker();

  if (captureBtn) {
    captureBtn.addEventListener("click", () => {
      captureAndAnalyze();
    });
  }

  if (switchCameraBtn) {
    switchCameraBtn.addEventListener("click", toggleCamera);
  }
  if (resetGuideBtn) {
    resetGuideBtn.addEventListener("click", showGuideOverlay);
  }

  if (historyClearBtn) {
    historyClearBtn.addEventListener("click", () => {
      if (confirm("오늘 기록을 모두 삭제할까요?")) {
        clearTodayHistory();
        setMessage("오늘 섭취 기록이 삭제되었습니다.", "info");
      }
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeSubscriptionModal);
  }
  if (laterBtn) {
    laterBtn.addEventListener("click", () => {
      closeSubscriptionModal();
      setMessage("언제든지 다시 촬영하시면 구독 안내를 볼 수 있어요. 😊", "info");
    });
  }
  if (subscribeBtn) {
    subscribeBtn.addEventListener("click", () => {
      alert(
        "현재는 데모 버전입니다.\n\n예시 요금제: SmartCal AI PRO · 월 4,900원 (부가세 별도)\n\n정식 출시 시 실제 결제 화면이 연결됩니다."
      );
      setMessage("현재는 데모 버전입니다. 정식 구독 기능은 곧 연결될 예정입니다. 🚀", "info");
      closeSubscriptionModal();
    });
  }

  if (subscriptionModal) {
    subscriptionModal.addEventListener("click", (e) => {
      if (e.target === subscriptionModal) closeSubscriptionModal();
    });
  }
});
