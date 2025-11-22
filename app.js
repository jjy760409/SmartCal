/* ============================================================
   SmartCal AI - Full Version (24H Trial + Random CTA + Server)
   ============================================================ */

// ==============================
// 0. 24시간 무료 체험 설정
// ==============================
const FREE_TRIAL_HOURS = 24;
const FREE_TRIAL_KEY = "smartcal_free_trial_v2";

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
    const state = { startedAt: now, expired: false };
    localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(state));
    return state;
  }
}

let freeTrialState = loadFreeTrialState();

function isFreeTrialExpired() {
  return !!freeTrialState.expired;
}

function getFreeTrialRemainText() {
  if (isFreeTrialExpired()) return "0시간 0분";

  const now = Date.now();
  const endTime =
    freeTrialState.startedAt + FREE_TRIAL_HOURS * 60 * 60 * 1000;
  const remainMs = Math.max(endTime - now, 0);
  const remainHours = Math.floor(remainMs / (1000 * 60 * 60));
  const remainMinutes = Math.floor((remainMs / (1000 * 60)) % 60);

  return `${remainHours}시간 ${remainMinutes}분`;
}

// ==============================
// 1. 랜덤 구독 CTA 메시지
// ==============================
const ctaMessages = [
  "☕ 하루 130원으로 식단 고민 끝! 커피 1잔보다 싸게 평생 식단 관리 시작해요.",
  "🔥 월 3,900원으로 무제한 AI 칼로리 분석! 한 번 외식값보다도 저렴해요.",
  "📊 한 끼 잘못 먹으면 +800kcal, SmartCal AI로 사전에 막을 수 있어요.",
  "🧠 1초 스캔으로 음식 인식, 24시간 365일 쉬지 않는 당신만의 식단 비서.",
  "📌 무료 체험 종료까지 남은 시간 동안만 이 가격! 지금 놓치면 다시는 못 볼 수 있어요.",
  "💰 하루 130원 투자로 1년 뒤 몸무게–5kg를 목표로 관리해 보세요.",
  "📉 1일 3번 잘못된 칼로리 계산 → 1년 뒤 5kg 차이가 될 수 있어요. 지금 바로 정확하게!",
  "🚨 24시간 중 단 5초만 투자하세요. ‘촬영 → 인식 → 칼로리’ 끝.",
  "💡 다이어트 실패율 90%는 ‘기록 안 함’에서 시작됩니다. 우리는 기록을 자동으로 만듭니다.",
  "🏃‍♂️ 오늘 300kcal만 줄여도 한 달에 약–9,000kcal 절감! 지금 시작하는 사람이 이깁니다.",
  "⚠️ 무료 체험이 끝나면, 다시는 ‘무제한 분석’ 기회를 못 볼 수도 있어요.",
  "🚨 지금 구독하지 않으면, 다음 식사도 ‘대충 계산’으로 넘어가게 됩니다.",
  "⏰ 오늘도 그냥 지나가면, 내일도 같은 몸무게예요. 지금이 바꿀 수 있는 시간.",
  "👀 이미 다른 사람들은 프리미엄으로 음식 데이터를 쌓고 있어요. 나만 뒤처질 건가요?",
  "🧨 ‘나중에 할게…’가 쌓여서 지금 몸무게가 된 거예요. 이번만은 바로 시작해봐요.",
  "❗ 건강검진 결과지 보고 후회하기 전에, 오늘부터 기록을 바꿔보세요.",
  "🔒 무료 모드는 연습 경기일 뿐, 진짜 경기는 프리미엄에서 시작됩니다.",
  "🌍 매일 0시, 전세계 음식 데이터 자동 업데이트! 살아있는 AI 식단 사전.",
  "🍱 오늘 새로 추가된 음식만 수십 종! 한식·중식·일식·디저트까지 계속 늘어납니다.",
  "🤖 YOLO 기반 음식 인식 엔진, 매일 조금씩 더 똑똑해지고 있어요.",
  "📈 찍을수록 데이터가 쌓이고, 쌓일수록 당신에게 더 정확해집니다.",
  "🧾 식단 일지를 쓰지 않아도, 카메라만 들면 자동 기록이 쌓입니다.",
  "🔥 “이 정도면 PT 선생님보다 낫다”라는 말을 듣는 게 우리의 목표입니다.",
  "📡 SmartCal AI는 당신이 자는 동안에도 음식 데이터를 배우고 있습니다.",
  "💎 지금 구독하면, 앞으로 추가되는 모든 기능을 가장 먼저 만날 수 있어요.",
  "💚 내 몸에 들어가는 숫자를 아는 순간, 진짜 관리가 시작됩니다.",
  "🥗 오늘의 한 끼가 내일의 몸을 만듭니다. 그냥 먹기엔 너무 아깝잖아요?",
  "🏅 지금의 선택 하나가 3개월 후 사진에서 티가 납니다.",
  "🧩 운동, 수면, 식단 중 가장 빼먹기 쉬운 건 ‘칼로리 기록’입니다. 그걸 우리가 대신 해줄게요.",
  "🎁 지금 구독하면 ‘미래의 나’에게 주는 가장 값싼 선물이 됩니다.",
  "🌱 작은 기록이 쌓여서, 언젠가 거울 앞에서 미소 짓는 날이 옵니다.",
  "⚡ Unlock unlimited SmartCal AI. 1 tap = full nutrition insight.",
  "🔥 Less than $0.1 per day for a 24/7 AI nutrition coach.",
  "📊 Stop guessing, start measuring. Every bite now has a number.",
  "🚀 Join the top 1% of people who actually track their calories correctly.",
  "🧠 Let AI remember every meal so your brain can focus on living.",
  "💰 Cheaper than coffee, more valuable than anything you drink.",
  "🥇 Be the premium user your health deserves.",
  "⏰ Free trial ending soon. Don’t let your progress disappear."
];

function showRandomCTA() {
  const ctaEl = document.getElementById("ctaMessage");
  if (!ctaEl) return;
  const msg = ctaMessages[Math.floor(Math.random() * ctaMessages.length)];
  ctaEl.textContent = msg;
}

// ==============================
// 2. 전역 변수 & DOM 요소
// ==============================
let currentStream = null;
let currentFacingMode = "environment";

let todayHistoryKey = "";
let history = [];

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const guideOverlay = document.getElementById("guideOverlay");

const captureBtn = document.getElementById("captureBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const usageText = document.getElementById("usageText");
const usageBadge = document.getElementById("usageBadge");
const message = document.getElementById("message");

const resultSection = document.getElementById("resultSection");
const foodNameEl = document.getElementById("foodName");
const calorieValueEl = document.getElementById("calorieValue");
const resultNoteEl = document.getElementById("resultNote");

const historySection = document.getElementById("historySection");
const historyDateLabel = document.getElementById("historyDateLabel");
const historyList = document.getElementById("historyList");
const historyTotalEl = document.getElementById("historyTotal");
const historyClearBtn = document.getElementById("historyClearBtn");

const subscriptionModal = document.getElementById("subscriptionModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const laterBtn = document.getElementById("laterBtn");

const installBtn = document.getElementById("installBtn");
const iconButtons = document.querySelectorAll(".icon-style");

// ==============================
// 3. 날짜 / 시간 유틸
// ==============================
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
// 4. 메시지 & 오버레이
// ==============================
function setMessage(text, type = "info") {
  if (!message) return;
  message.textContent = text || "";
  if (!text) return;
  if (type === "error") message.style.color = "#fb7185";
  else if (type === "warn") message.style.color = "#facc15";
  else message.style.color = "#f97316";
}

function hideGuideOverlay() {
  if (!guideOverlay) return;
  guideOverlay.classList.add("hidden");
}

function showGuideOverlay() {
  if (!guideOverlay) return;
  guideOverlay.classList.remove("hidden");
  setMessage("화면 중앙에 음식이 잘 보이도록 맞춰주세요. 📷", "info");
}

// ==============================
// 5. 오늘 기록 관리
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
    historySection.classList.add("hidden");
    historyList.innerHTML = "";
    historyTotalEl.textContent = "0";
    return;
  }

  historySection.classList.remove("hidden");
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
// 6. 카메라
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

function toggleCamera() {
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  startCamera();
}

// ==============================
// 7. 무료 체험 UI 업데이트
// ==============================
function updateUsageUI() {
  if (!usageText && !usageBadge && !captureBtn) return;

  if (isFreeTrialExpired()) {
    if (usageText) {
      usageText.textContent =
        "무료 24시간 체험이 끝났어요. 구독 후 계속 이용할 수 있습니다.";
    }
    if (usageBadge) {
      usageBadge.textContent = "EXPIRED";
      usageBadge.classList.add("limit");
    }
    if (captureBtn) {
      captureBtn.disabled = true;
    }
    return;
  }

  const remainText = getFreeTrialRemainText();
  if (usageText) {
    usageText.textContent = `무료 체험 남은 시간: ${remainText}`;
  }
  if (usageBadge) {
    usageBadge.textContent = "FREE 24H";
    usageBadge.classList.remove("limit");
  }
  if (captureBtn) {
    captureBtn.disabled = false;
  }
}

// ==============================
// 8. 구독 모달 & 결제 버튼
// ==============================
function openSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.add("active");
  showRandomCTA();
}

function closeSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.remove("active");
}

function handlePayClick(method) {
  // 실제 결제 URL 연결은 여기서 처리 (지금은 데모 알림)
  let msg = "";
  switch (method) {
    case "kakao":
      msg = "카카오페이 결제 페이지는 추후 연동됩니다.";
      break;
    case "toss":
      msg = "토스 결제 페이지는 추후 연동됩니다.";
      break;
    case "card":
      msg = "카드 결제 PG는 추후 연동됩니다.";
      break;
    case "paypal":
      msg = "PayPal 결제는 글로벌 버전에서 제공될 예정입니다.";
      break;
    default:
      msg = "결제 방식이 아직 준비 중입니다.";
  }
  alert(msg);
}

// ==============================
// 9. AI 서버 호출
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

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();

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
// 10. 촬영 & 분석
// ==============================
async function captureAndAnalyze() {
  if (isFreeTrialExpired()) {
    setMessage(
      "무료 24시간 체험이 끝났어요. 구독 후 계속 사용하실 수 있어요. 💚",
      "warn"
    );
    openSubscriptionModal();
    return;
  }

  if (!video || video.readyState < 2) {
    setMessage("카메라가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.", "warn");
    return;
  }

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

  const result = await analyzeImageWithServer(dataUrl);

  hideGuideOverlay();

  if (resultSection) resultSection.classList.remove("hidden");
  if (foodNameEl) foodNameEl.textContent = result.name;
  if (calorieValueEl) calorieValueEl.textContent = result.kcal;
  if (resultNoteEl) resultNoteEl.textContent = result.note;

  addHistoryEntry({ name: result.name, kcal: result.kcal });

  setMessage("분석이 완료되었습니다! 결과를 확인해 보세요. ✅", "info");
}

// ==============================
// 11. PWA 설치 & 아이콘 선택
// ==============================
let deferredPrompt = null;
const MANIFEST_KEY = "smartcal_manifest_style_v1";

function updateManifest(style) {
  localStorage.setItem(MANIFEST_KEY, style);
  alert(`👍 아이콘 스타일 ${style} 버전으로 설치 준비 완료!`);
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = "block";
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      console.log("📲 사용자 앱 설치 승인");
    }
    deferredPrompt = null;
    installBtn.style.display = "none";
  });
}

iconButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const style = btn.getAttribute("data-icon");
    if (style) updateManifest(style);
  });
});

// ==============================
// 12. 초기화
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  todayHistoryKey = "smartcalHistory-" + getTodayKey();

  showGuideOverlay();
  startCamera();
  loadHistory();

  updateUsageUI();
  setInterval(() => {
    freeTrialState = loadFreeTrialState();
    updateUsageUI();
  }, 60 * 1000);

  if (captureBtn) {
    captureBtn.addEventListener("click", () => {
      captureAndAnalyze();
    });
  }

  if (switchCameraBtn) {
    switchCameraBtn.addEventListener("click", () => {
      toggleCamera();
    });
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
    closeModalBtn.addEventListener("click", () => {
      closeSubscriptionModal();
    });
  }

  if (laterBtn) {
    laterBtn.addEventListener("click", () => {
      closeSubscriptionModal();
      setMessage(
        "언제든지 다시 촬영하시면 구독 안내를 볼 수 있어요. 😊",
        "info"
      );
    });
  }

  const payButtons = document.querySelectorAll(".btn.pay");
  payButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const method = btn.getAttribute("data-pay");
      handlePayClick(method);
    });
  });

  // 모달 바깥 클릭 시 닫기
  if (subscriptionModal) {
    subscriptionModal.addEventListener("click", (e) => {
      if (e.target === subscriptionModal) closeSubscriptionModal();
    });
  }

  // CTA 자동 순환
  showRandomCTA();
  setInterval(showRandomCTA, 6000);
});
