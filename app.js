/* ============================================================
   SmartCal AI - Full Version
   - 24H Free Trial
   - Random CTA for Subscription
   - Render YOLO Server 연결
   - PWA 설치 + 아이콘 스타일 선택
   ============================================================ */
// PortOne(Iamport) 초기화
const IMP = window.IMP;
IMP.init("imp86203201");  // 여기에 본인 MID 사용

// === 24시간 무료 체험 설정 ===
// 처음 앱을 실행한 시점부터 24시간 동안 무료로 사용 가능
// 24시간이 지나면 촬영 버튼 클릭 시 구독 모달이 뜸

const FREE_TRIAL_HOURS = 24;                     // 무료 체험 시간 (24시간)
const FREE_TRIAL_KEY = "smartcal_free_trial_v2"; // localStorage 키

function loadFreeTrialState() {
  const now = Date.now();
  const saved = localStorage.getItem(FREE_TRIAL_KEY);

  // 저장된 기록이 없으면 → 지금 시간을 시작 시간으로 저장
  if (!saved) {
    const state = { startedAt: now, expired: false };
    localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(state));
    return state;
  }

  try {
    const state = JSON.parse(saved);
    const diffMs = now - state.startedAt;
    const diffHours = diffMs / (1000 * 60 * 60);

    // 24시간이 지났으면 expired = true
    if (diffHours >= FREE_TRIAL_HOURS && !state.expired) {
      state.expired = true;
      localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(state));
    }
    return state;
  } catch (e) {
    // 혹시 데이터가 깨져 있으면 처음부터 다시
    const state = { startedAt: now, expired: false };
    localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(state));
    return state;
  }
}

// 전역 무료 체험 상태
let freeTrialState = loadFreeTrialState();
let modalOpenedOnce = false; // EXPIRED 됐을 때 모달 한 번만 자동 오픈용

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

// === 구독 CTA 메시지 랜덤 출력 ===
const ctaMessages = [
  // ===== 한국어 – 가격/숫자 강조 =====
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

  // ===== 한국어 – FOMO / 긴급 자극 =====
  "⚠️ 무료 체험이 끝나면, 다시는 ‘무제한 분석’ 기회를 못 볼 수도 있어요.",
  "🚨 지금 구독하지 않으면, 다음 식사도 ‘대충 계산’으로 넘어가게 됩니다.",
  "⏰ 오늘도 그냥 지나가면, 내일도 같은 몸무게예요. 지금이 바꿀 수 있는 시간.",
  "👀 이미 다른 사람들은 프리미엄으로 음식 데이터를 쌓고 있어요. 나만 뒤처질 건가요?",
  "🧨 ‘나중에 할게…’가 쌓여서 지금 몸무게가 된 거예요. 이번만은 바로 시작해봐요.",
  "❗ 건강검진 결과지 보고 후회하기 전에, 오늘부터 기록을 바꿔보세요.",
  "🔒 무료 모드는 곧 잠깁니다. 프리미엄을 열 수 있는 열쇠는 지금 이 버튼 하나.",
  "🚦“내일부터…”라고 생각했다면, 이 버튼이 오늘의 마지막 신호일 수 있어요.",
  "🎯 목표 몸무게까지 남은 건 시간이 아니라 ‘시작’입니다. 시작 버튼 = 구독하기.",

  // ===== 한국어 – 기능/업데이트 강조 =====
  "🌍 매일 0시, 전세계 음식 데이터 자동 업데이트! 살아있는 AI 식단 사전.",
  "🍱 오늘 새로 추가된 음식만 25종! 한식·중식·일식·디저트까지 계속 늘어납니다.",
  "🤖 YOLO 기반 음식 인식 엔진, 매일 조금씩 더 똑똑해지고 있어요.",
  "📈 찍을수록 데이터가 쌓이고, 쌓일수록 당신에게 더 정확해집니다.",
  "🧾 식단 일지를 쓰지 않아도, 카메라만 들면 자동 기록이 쌓입니다.",
  "🔥 “이 정도면 PT 선생님보다 낫다”라는 말을 듣는 게 우리의 목표입니다.",
  "📡 SmartCal AI는 당신이 자는 동안에도 음식 데이터를 배우고 있습니다.",
  "💎 지금 구독하면, 앞으로 추가되는 모든 기능을 가장 먼저 만날 수 있어요.",
  "🧊 ‘데모 모드’는 연습 경기일 뿐, 진짜 경기는 프리미엄에서 시작됩니다.",

  // ===== 한국어 – 감성/동기 부여 =====
  "💚 내 몸에 들어가는 숫자를 아는 순간, 진짜 관리가 시작됩니다.",
  "🥗 오늘의 한 끼가 내일의 몸을 만듭니다. 그냥 먹기엔 너무 아깝잖아요?",
  "🏅 지금의 선택 하나가 3개월 후 사진에서 티가 납니다.",
  "🧩 운동, 수면, 식단 중 가장 빼먹기 쉬운 건 ‘칼로리 기록’입니다. 그걸 우리가 대신 해줄게요.",
  "🎁 지금 구독하면 ‘미래의 나’에게 주는 가장 값싼 선물이 됩니다.",
  "🌱 작은 기록이 쌓여서, 언젠가 거울 앞에서 미소 짓는 날이 옵니다.",

  // ===== 영어 – 글로벌 유저용 =====
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
  const idx = Math.floor(Math.random() * ctaMessages.length);
  ctaEl.textContent = ctaMessages[idx];
}

// === DOM 요소 ===
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const resultSection = document.getElementById("resultSection");
const foodNameEl = document.getElementById("foodName");
const calorieValueEl = document.getElementById("calorieValue");
const resultNoteEl = document.getElementById("resultNote");
const usageText = document.getElementById("usageText");
const usageBadge = document.getElementById("usageBadge");
const subscriptionModal = document.getElementById("subscriptionModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const laterBtn = document.getElementById("laterBtn");
const payButtons = document.querySelectorAll(".btn.pay");
const messageEl = document.getElementById("message");

// 모달 열기 / 닫기
function openSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.add("active");
  modalOpenedOnce = true;
}

function closeSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.remove("active");
}

// 무료 체험 UI 업데이트
function updateUsageUI() {
  if (!usageText && !usageBadge && !captureBtn) return;

  if (isFreeTrialExpired()) {
    // 🔴 무료 체험 끝
    if (usageText) {
      usageText.textContent =
        "무료 24시간 체험이 끝났어요. 구독 후 계속 이용할 수 있습니다.";
    }
    if (usageBadge) {
      usageBadge.textContent = "EXPIRED";
      usageBadge.classList.add("limit");
    }
    // 촬영 버튼은 눌러지지만 실제 촬영은 막고, 모달만 띄움
    if (!modalOpenedOnce) {
      openSubscriptionModal();
    }
    return;
  }

  // 🟢 아직 무료 체험 중
  const remainText = getFreeTrialRemainText();
  if (usageText) {
    usageText.textContent = `무료 체험 남은 시간: ${remainText}`;
  }
  if (usageBadge) {
    usageBadge.textContent = "FREE 24H";
    usageBadge.classList.remove("limit");
  }
}

// 카메라 시작
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    if (video) {
      video.srcObject = stream;
      await video.play();
    }
    if (messageEl) {
      messageEl.textContent =
        "찍고 싶은 음식이 화면 중앙에 오도록 맞춰주세요. 📸";
    }
  } catch (e) {
    alert("카메라 권한을 허용해야 사용 가능합니다.");
    if (messageEl) {
      messageEl.textContent = "카메라 권한을 허용해 주세요. (브라우저 설정)";
    }
  }
}

// === 서버 호출 ===
async function analyzeImageWithServer(dataUrl) {
  try {
    const base64Data = dataUrl.split(",")[1];

    const res = await fetch(
      "https://smartcal-yolo-server.onrender.com/predict",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data })
      }
    );

    if (!res.ok) throw new Error("Server error");
    const data = await res.json();

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response");
    }

    // 음식이 하나 이상 인식된 경우
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

    // 아무것도 인식 못한 경우
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

// === 촬영 & 분석 ===
captureBtn?.addEventListener("click", async () => {
  // 무료 체험이 끝났으면 → 촬영 막고 모달 띄우기
  if (isFreeTrialExpired()) {
    openSubscriptionModal();
    return;
  }

  if (!video || !canvas) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  const data = await analyzeImageWithServer(dataUrl);

  if (resultSection) resultSection.classList.remove("hidden");
  if (foodNameEl)
    foodNameEl.textContent = data.name || "인식 실패";
  if (calorieValueEl)
    calorieValueEl.textContent = `${data.kcal} kcal`;
  if (resultNoteEl)
    resultNoteEl.textContent = data.note || "";
});

// === PWA 설치 안내 버튼 ===
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = "block";
});

installBtn?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  if (choice.outcome === "accepted") {
    console.log("📲 사용자 앱 설치 승인");
  }
  deferredPrompt = null;
  installBtn.style.display = "none";
});

// === 아이콘 선택 기능 ===
const iconButtons = document.querySelectorAll(".icon-style");
const MANIFEST_KEY = "smartcal_manifest_style_v1";

function updateManifest(style) {
  alert(`👍 ${style} 스타일로 설치 준비 완료!`);
  localStorage.setItem(MANIFEST_KEY, style);
}

iconButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const style = btn.getAttribute("data-icon");
    if (!style) return;
    updateManifest(style);
  });
});

// === 구독 모달 버튼 동작 ===
closeModalBtn?.addEventListener("click", closeSubscriptionModal);
laterBtn?.addEventListener("click", closeSubscriptionModal);

// 결제 버튼(지금은 데모 URL, 나중에 실제 결제 링크로 교체)
payButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const payType = btn.getAttribute("data-pay");
    let url = "#";

    if (payType === "kakao") {
      url = "https://example.com/pay/kakao"; // 나중에 실제 카카오페이 결제 URL로 변경
    } else if (payType === "toss") {
      url = "https://example.com/pay/toss";  // 나중에 실제 토스 URL로 변경
    } else if (payType === "card") {
      url = "https://example.com/pay/card";  // 나중에 카드 결제 PG사 URL로 변경
    } else if (payType === "paypal") {
      url = "https://example.com/pay/paypal"; // PayPal 결제 링크로 변경
    }

    alert("현재는 데모 모드입니다. 나중에 이 버튼에 실제 결제 URL을 연결하면 됩니다.");
    if (url !== "#") {
      window.open(url, "_blank");
    }
  });
});

// === 초기 실행 ===
document.addEventListener("DOMContentLoaded", () => {
  startCamera();
  updateUsageUI();
  setInterval(updateUsageUI, 60 * 1000); // 1분마다 남은 시간 갱신

  showRandomCTA();
  setInterval(showRandomCTA, 6000); // 6초마다 문구 랜덤 변경
});
// ======================
// 기존에 있던 코드들 ...
// (예: 촬영, YOLO 요청 등)
// ======================


// ===============================================
// 📌 여기 아래에 붙여 넣으세요!!!
// ===============================================

// 결제 성공 후 무제한 활성화 함수
function activateUnlimitedOnThisDevice(planName, paidAmount) {
  const subInfo = {
    plan: planName,
    amount: paidAmount,
    activatedAt: new Date().toISOString(),
  };
  localStorage.setItem("smartcal_subscription", JSON.stringify(subInfo));

  const usageBadge = document.getElementById("usageBadge");
  const usageText = document.getElementById("usageText");

  if (usageBadge) {
    usageBadge.textContent = "무제한 이용중";
    usageBadge.classList.remove("pill-free");
    usageBadge.classList.add("pill-premium");
  }

  if (usageText) {
    usageText.textContent = "이 기기에서는 SmartCal AI를 무제한으로 사용할 수 있어요. 🎉";
  }

  const modal = document.getElementById("subscriptionModal");
  if (modal) modal.classList.remove("show");

  alert("결제가 완료되었습니다! 🎉 이제 무제한으로 이용할 수 있어요.");
}


// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ 결제 버튼 연결 코드는 이 아래 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
// ===========================
