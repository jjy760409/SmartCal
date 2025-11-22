/* ============================================================
   SmartCal AI - Full Version (24H Trial + Random CTA + Server On)
   ============================================================ */

// === 무료 체험 24H 설정 ===
const FREE_TRIAL_HOURS = 24;
const FREE_TRIAL_KEY = "smartcal_free_trial_v1";

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
    const diffHours = (now - state.startedAt) / (1000 * 60 * 60);
    if (diffHours >= FREE_TRIAL_HOURS && !state.expired) {
      state.expired = true;
      localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(state));
    }
    return state;
  } catch {
    const state = { startedAt: now, expired: false };
    localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(state));
    return state;
  }
}

let freeTrialState = loadFreeTrialState();
function isFreeTrialExpired() {
  return !!freeTrialState.expired;
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
  "⏰ Free trial ending soon. Don’t let your progress disappear.",
];
function showRandomCTA() {
  const ctaEl = document.getElementById("ctaMessage");
  if (!ctaEl) return;
  ctaEl.textContent = ctaMessages[Math.floor(Math.random() * ctaMessages.length)];
}
document.addEventListener("DOMContentLoaded", () => {
  showRandomCTA();
  setInterval(showRandomCTA, 6000);
});

// === 카메라 요소 ===
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

function updateUsageUI() {
  if (isFreeTrialExpired()) {
    if (usageText) usageText.textContent = "무료 체험 종료";
    if (usageBadge) usageBadge.textContent = "EXPIRED";
    if (captureBtn) captureBtn.disabled = true;
    if (subscriptionModal) subscriptionModal.classList.add("active");
    return;
  }

  const now = Date.now();
  const endTime = freeTrialState.startedAt + FREE_TRIAL_HOURS * 3600000;
  const remainMs = Math.max(endTime - now, 0);

  const hours = Math.floor(remainMs / 3600000);
  const mins = Math.floor((remainMs % 3600000) / 60000);

  if (usageText) usageText.textContent = `무료 남은 시간: ${hours}시간 ${mins}분`;
  if (usageBadge) usageBadge.textContent = "FREE 24H";
}

// === 카메라 실행 ===
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = stream;
    await video.play();
  } catch (e) {
    alert("카메라 권한 허용 필요!");
  }
}
startCamera();
updateUsageUI();
setInterval(updateUsageUI, 30000);

// === 서버 호출 ===
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
    if (!res.ok) throw new Error();

    return await res.json();
  } catch {
    return { items: [], totalCalories: 0, note: "AI 서버 연결 실패" };
  }
}

// === 촬영 & 분석 ===
captureBtn?.addEventListener("click", async () => {
  if (isFreeTrialExpired()) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  const data = await analyzeImageWithServer(dataUrl);

  if (resultSection) resultSection.style.display = "block";
  foodNameEl.textContent = data.items.map(i => i.foodName).join(" + ") || "인식 실패";
  calorieValueEl.textContent = `${data.totalCalories} kcal`;
  resultNoteEl.textContent = data.note || "";
});
