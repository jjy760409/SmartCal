// SmartCal AI - 24시간 무료 체험 버전 (v24h_2025-11-22)
console.log("SmartCal app.js v24h_2025-11-22 loaded");

// ==============================
// 0. 무료 체험 / 구독 상태
// ==============================
const FREE_TRIAL_HOURS = 24;
const FREE_TRIAL_KEY = "smartcal_free_trial_v1";
const SUB_KEY = "smartcal_is_subscribed";

let freeTrialState = null;
let isSubscribed = false;

// ==============================
// 전역 상태 & DOM 참조용 변수
// ==============================
let video,
  canvas,
  guideOverlay,
  captureBtn,
  switchCameraBtn,
  resetGuideBtn,
  usageText,
  usageBadge,
  messageEl,
  resultSection,
  foodNameEl,
  calorieValueEl,
  resultNoteEl,
  historySection,
  historyDateLabel,
  historyList,
  historyTotalEl,
  historyClearBtn,
  subscriptionModal,
  closeModalBtn,
  subscribeBtn,
  laterBtn;

let currentStream = null;
let currentFacingMode = "environment";

let todayHistoryKey = "";
let history = [];

// ==============================
// 1. 무료 체험 상태 관리
// ==============================

function loadFreeTrialState() {
  const now = Date.now();
  const saved = localStorage.getItem(FREE_TRIAL_KEY);

  if (!saved) {
    const state = { startedAt: now, expired: false };
    localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(state));
    return state;
  }

  try {
    const state = JSON.parse(saved);
    const diffMs = now - state.startedAt;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= FREE_TRIAL_HOURS && !state.expired) {
      state.expired = true;
      localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(state));
    }
    return state;
  } catch (e) {
    console.warn("FREE_TRIAL 데이터 손상, 재설정", e);
    const state = { startedAt: now, expired: false };
    localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(state));
    return state;
  }
}

function isFreeTrialExpired() {
  return !!freeTrialState?.expired;
}

function getRemainTimeText() {
  const now = Date.now();
  const endTime =
    freeTrialState.startedAt + FREE_TRIAL_HOURS * 60 * 60 * 1000;
  const remainMs = Math.max(endTime - now, 0);
  const remainHours = Math.floor(remainMs / (1000 * 60 * 60));
  const remainMinutes = Math.floor((remainMs / (1000 * 60)) % 60);
  return `${remainHours}시간 ${remainMinutes}분`;
}

// ==============================
// 2. 공통 유틸
// ==============================

function setMessage(text, type = "info") {
  if (!messageEl) return;
  messageEl.textContent = text || "";
  if (!text) return;
  if (type === "error") messageEl.style.color = "#fb7185";
  else if (type === "warn") messageEl.style.color = "#facc15";
  else messageEl.style.color = "#f97316";
}

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

// ==============================
// 3. 오늘 기록 관리
// ==============================

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
  if (!historySection || !historyList || !historyTotalEl || !historyDateLabel)
    return;

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

// ==============================
// 4. 카메라
// ==============================

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

// ==============================
// 5. 무료 체험 UI 업데이트
// ==============================

function updateUsageUI() {
  if (!usageBadge && !usageText) return;

  // 1) 이미 구독한 경우 → 무제한
  if (isSubscribed) {
    if (usageText) usageText.textContent = "구독 중: 무제한 이용 가능합니다.";
    if (usageBadge) {
      usageBadge.textContent = "PREMIUM";
      usageBadge.classList.remove("limit");
    }
    if (captureBtn) captureBtn.disabled = false;
    return;
  }

  // 2) 무료 체험 끝난 경우
  if (isFreeTrialExpired()) {
    if (usageText) {
      usageText.textContent =
        "무료 24시간 체험이 끝났습니다. 계속 이용하려면 구독을 선택해 주세요.";
    }
    if (usageBadge) {
      usageBadge.textContent = "LIMIT REACHED";
      usageBadge.classList.add("limit");
    }
    if (captureBtn) captureBtn.disabled = true;
    return;
  }

  // 3) 무료 체험 중
  if (usageText) {
    usageText.textContent = `무료 체험 남은 시간: ${getRemainTimeText()}`;
  }
  if (usageBadge) {
    usageBadge.textContent = "FREE 24H";
    usageBadge.classList.remove("limit");
  }
  if (captureBtn) captureBtn.disabled = false;
}

// 모달
function openSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.add("active");
}
function closeSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.remove("active");
}

// ==============================
// 6. AI 서버 호출
// ==============================

async function analyzeImageWithServer(dataUrl) {
  try {
    const base64Data = dataUrl.split(",")[1];

    const res = await fetch(
      "https://undefectively-preinsinuative-tricia.ngrok-free.dev/predict",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data })
      }
    );

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();
    if (!data || typeof data !== "object") throw new Error("Invalid response");

    if (Array.isArray(data.items) && data.items.length > 0) {
      const items = data.items.map((item) => ({
        foodName: item.foodName || item.name || "알 수 없는 음식",
        calories: Number(item.calories || item.kcal || 0)
      }));

      const total = data.totalCalories
        ? Number(data.totalCalories)
        : items.reduce((sum, it) => sum + it.calories, 0);

      const combinedName = items.map((it) => it.foodName).join(" + ");

      const lines = items.map(
        (it) => `• ${it.foodName}: ${it.calories} kcal`
      );
      if (data.note) lines.push("", data.note);

      return {
        name: combinedName,
        kcal: total,
        note: lines.join("\n")
      };
    }

    const note =
      data.note ||
      "음식을 잘 인식하지 못했어요. 화면 중앙에 크게 나오도록 다시 촬영해 주세요.";
    return {
      name: "음식을 인식하지 못했어요",
      kcal: 0,
      note
    };
  } catch (err) {
    console.warn("AI 서버 호출 실패:", err);
    return {
      name: "AI 서버 오류",
      kcal: 0,
      note:
        "AI 서버에 연결하지 못했습니다. 와이파이/데이터 상태를 확인한 뒤 다시 시도해 주세요."
    };
  }
}

// ==============================
// 7. 이벤트 연결
// ==============================

function setupEventListeners() {
  // 촬영 버튼
  if (captureBtn) {
    captureBtn.addEventListener("click", async () => {
      // 무료 끝 + 미구독이면 촬영 막고 모달
      if (!isSubscribed && isFreeTrialExpired()) {
        openSubscriptionModal();
        setMessage(
          "무료 24시간 이용이 끝났습니다. 구독 후 다시 이용해 주세요.",
          "warn"
        );
        updateUsageUI();
        return;
      }

      if (!video || !canvas) return;

      setMessage("AI가 음식 분석 중입니다… 🍽️", "info");

      const width = video.videoWidth;
      const height = video.videoHeight;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const result = await analyzeImageWithServer(dataUrl);

      if (resultSection) resultSection.style.display = "block";
      if (foodNameEl) foodNameEl.textContent = result.name;
      if (calorieValueEl) calorieValueEl.textContent = `${result.kcal} kcal`;
      if (resultNoteEl) resultNoteEl.textContent = result.note;

      addHistoryEntry({ name: result.name, kcal: result.kcal });
    });
  }

  // 카메라 전환
  if (switchCameraBtn) {
    switchCameraBtn.addEventListener("click", async () => {
      currentFacingMode =
        currentFacingMode === "environment" ? "user" : "environment";
      await startCamera();
    });
  }

  // 기록 삭제
  if (historyClearBtn) {
    historyClearBtn.addEventListener("click", () => {
      clearTodayHistory();
    });
  }

  // 모달 닫기 / 나중에
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      closeSubscriptionModal();
    });
  }
  if (laterBtn) {
    laterBtn.addEventListener("click", () => {
      closeSubscriptionModal();
    });
  }

  // 구독 버튼 → 간단하게 로컬에서 premium 처리
  if (subscribeBtn) {
    subscribeBtn.addEventListener("click", () => {
      isSubscribed = true;
      localStorage.setItem(SUB_KEY, "true");
      closeSubscriptionModal();
      updateUsageUI();
      setMessage(
        "구독이 설정되었습니다. 이제 무제한으로 이용 가능합니다. 🎉",
        "info"
      );
    });
  }
}

// ==============================
// 8. 초기 실행
// ==============================

function initSmartCal() {
  console.log("SmartCal init start");

  // 무료 체험 / 구독 상태
  freeTrialState = loadFreeTrialState();
  isSubscribed = localStorage.getItem(SUB_KEY) === "true";

  // DOM 요소 찾기
  video = document.getElementById("video");
  canvas = document.getElementById("canvas");
  guideOverlay = document.getElementById("guideOverlay");

  captureBtn =
    document.getElementById("captureBtn") ||
    document.getElementById("captureButton") ||
    document.querySelector("[data-role='captureBtn']");

  switchCameraBtn =
    document.getElementById("switchCameraBtn") ||
    document.getElementById("cameraSwitchBtn") ||
    document.querySelector("[data-role='switchCameraBtn']");

  resetGuideBtn =
    document.getElementById("resetGuideBtn") ||
    document.getElementById("showGuideBtn") ||
    document.querySelector("[data-role='resetGuideBtn']");

  usageText =
    document.getElementById("usageText") ||
    document.getElementById("usageLabel") ||
    document.querySelector("[data-role='usageText']");

  usageBadge =
    document.getElementById("usageBadge") ||
    document.getElementById("usageTag") ||
    document.querySelector("[data-role='usageBadge']");

  messageEl =
    document.getElementById("message") ||
    document.getElementById("helperMessage") ||
    document.querySelector("[data-role='message']");

  resultSection =
    document.getElementById("resultSection") ||
    document.getElementById("analysisResult") ||
    document.querySelector("[data-role='resultSection']");

  foodNameEl =
    document.getElementById("foodName") ||
    document.getElementById("foodTitle") ||
    document.querySelector("[data-role='foodName']");

  calorieValueEl =
    document.getElementById("calorieValue") ||
    document.getElementById("calorieNumber") ||
    document.querySelector("[data-role='calorieValue']");

  resultNoteEl =
    document.getElementById("resultNote") ||
    document.getElementById("resultText") ||
    document.querySelector("[data-role='resultNote']");

  historySection =
    document.getElementById("historySection") ||
    document.getElementById("todayHistory") ||
    document.querySelector("[data-role='historySection']");

  historyDateLabel =
    document.getElementById("historyDateLabel") ||
    document.getElementById("historyTitle") ||
    document.querySelector("[data-role='historyDateLabel']");

  historyList =
    document.getElementById("historyList") ||
    document.querySelector("[data-role='historyList']");

  historyTotalEl =
    document.getElementById("historyTotal") ||
    document.querySelector("[data-role='historyTotal']");

  historyClearBtn =
    document.getElementById("historyClearBtn") ||
    document.querySelector("[data-role='historyClearBtn']");

  subscriptionModal =
    document.getElementById("subscriptionModal") ||
    document.querySelector("[data-role='subscriptionModal']");

  closeModalBtn =
    document.getElementById("closeModalBtn") ||
    document.querySelector("[data-role='closeModalBtn']");

  subscribeBtn =
    document.getElementById("subscribeBtn") ||
    document.querySelector("[data-role='subscribeBtn']");

  laterBtn =
    document.getElementById("laterBtn") ||
    document.querySelector("[data-role='laterBtn']");

  // 오늘 기록 키 초기화
  todayHistoryKey = "smartcal_history_" + getTodayKey();
  loadHistory();

  // 카메라 시작
  startCamera();

  // 이벤트 연결
  setupEventListeners();

  // 무료 체험 UI
  updateUsageUI();
  setInterval(updateUsageUI, 60 * 1000);

  console.log("SmartCal init done");
}

// DOM 이 준비된 후 실행
document.addEventListener("DOMContentLoaded", initSmartCal);
