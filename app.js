// ===========================
// 0. PortOne(Iamport) 초기화
// ===========================

if (IMP) {
  // 가맹점 식별코드(MID): imp86203201
  IMP.init('imp86203201');
} else {
  console.warn('PortOne(Iamport) 스크립트가 로드되지 않았습니다.');
}

// ===========================
// 1. 전역 상수 & 상태
// ===========================
const YOLO_API_URL = https://undefectively-preinsinuative-tricia.ngrok-free.dev -> http://localhost:8000

const SUBSCRIPTION_STORAGE_KEY = 'smartcal_subscription_v1';
const USAGE_STORAGE_KEY = 'smartcal_daily_usage_v1';
const HISTORY_STORAGE_KEY = 'smartcal_history_v1';

const DAILY_FREE_LIMIT = 3;

let dailyUsage = 0;
let currentDateKey = '';
let currentStream = null;
let usingFrontCamera = false;

let deferredPWAInstallEvent = null;

// ===========================
// 2. 유틸 함수
// ===========================
function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ===========================
// 3. 구독(무제한) 상태 관련
// ===========================
function restoreSubscriptionState() {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) {
      updateUsageText();
      return;
    }
    const state = JSON.parse(raw);
    if (state && state.unlimited) {
      applyUnlimitedUI(state);
    } else {
      updateUsageText();
    }
  } catch (err) {
    console.error('구독 상태 복원 중 오류', err);
    updateUsageText();
  }
}

function activateUnlimitedMode(planName) {
  const state = {
    plan: planName || 'PRO',
    unlimited: true,
    activatedAt: new Date().toISOString(),
  };
  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state));
  applyUnlimitedUI(state);
}

function applyUnlimitedUI(state) {
  const usageBadge = document.getElementById('usageBadge');
  const usageText = document.getElementById('usageText');
  const messageEl = document.getElementById('message');

  if (usageBadge) {
    usageBadge.textContent = 'UNLIMITED';
    usageBadge.classList.remove('pill-free');
    usageBadge.classList.add('pill-premium');
  }
  if (usageText) {
    usageText.textContent =
      '무제한 이용중 · 오늘 횟수 제한 없이 마음껏 촬영해 보세요. 🚀';
  }
  if (messageEl) {
    messageEl.textContent =
      '식단을 찍기만 하면 SmartCal AI가 칼로리를 계속 기록해 드립니다. 🙌';
  }
}

function isUnlimited() {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
    return !!state.unlimited;
  } catch (e) {
    return false;
  }
}

// ===========================
// 4. 일일 사용 횟수 관리
// ===========================
function restoreDailyUsage() {
  currentDateKey = getTodayKey();
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) {
      dailyUsage = 0;
      updateUsageText();
      return;
    }
    const data = JSON.parse(raw);
    if (data.date === currentDateKey) {
      dailyUsage = data.count || 0;
    } else {
      dailyUsage = 0;
    }
  } catch (e) {
    dailyUsage = 0;
  }
  updateUsageText();
}

function saveDailyUsage() {
  const payload = {
    date: currentDateKey,
    count: dailyUsage,
  };
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(payload));
}

function increaseUsageAndSave() {
  dailyUsage += 1;
  saveDailyUsage();
  updateUsageText();
}

function updateUsageText() {
  const usageText = document.getElementById('usageText');
  const badge = document.getElementById('usageBadge');

  if (isUnlimited()) {
    if (badge) {
      badge.textContent = 'UNLIMITED';
      badge.classList.remove('pill-free');
      badge.classList.add('pill-premium');
    }
    if (usageText) {
      usageText.textContent =
        '무제한 이용중 · 오늘 횟수 제한 없이 마음껏 촬영해 보세요. 🚀';
    }
    return;
  }

  if (badge) {
    badge.textContent = 'FREE 24H';
    badge.classList.add('pill-free');
    badge.classList.remove('pill-premium');
  }
  if (usageText) {
    usageText.textContent = `무료 체험 중 · 오늘 ${dailyUsage}/${DAILY_FREE_LIMIT}회 사용했습니다.`;
  }
}

// ===========================
// 5. 카메라 관련
// ===========================
async function startCamera() {
  const video = document.getElementById('video');
  if (!video) return;

  if (currentStream) {
    currentStream.getTracks().forEach((t) => t.stop());
  }

  const constraints = {
    audio: false,
    video: {
      facingMode: usingFrontCamera ? 'user' : 'environment',
    },
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;
  } catch (err) {
    console.error('카메라 시작 오류', err);
    const message = document.getElementById('message');
    if (message) {
      message.textContent =
        '카메라 권한을 허용해 주세요. 브라우저 설정에서 카메라 허용 후 다시 시도해 주세요. 🙏';
    }
  }
}

function initCameraControls() {
  const switchBtn = document.getElementById('switchCameraBtn');
  const captureBtn = document.getElementById('captureBtn');

  if (switchBtn) {
    switchBtn.addEventListener('click', async () => {
      usingFrontCamera = !usingFrontCamera;
      await startCamera();
    });
  }

  if (captureBtn) {
    captureBtn.addEventListener('click', onCaptureClick);
  }
}

async function onCaptureClick() {
  if (!isUnlimited() && dailyUsage >= DAILY_FREE_LIMIT) {
    const message = document.getElementById('message');
    if (message) {
      message.textContent =
        '오늘 무료 사용 횟수를 모두 사용했어요. 구독을 선택하면 계속 이용할 수 있어요. 💚';
    }
    openSubscriptionModal();
    return;
  }

  try {
    const result = await captureAndAnalyze();
    if (result) {
      increaseUsageAndSave();
      appendHistory(result);
    }
  } catch (err) {
    console.error('분석 중 오류', err);
    const msg = document.getElementById('message');
    if (msg) {
      msg.textContent =
        '분석 중 오류가 발생했어요. 다시 한 번 촬영해 주세요. 🙏';
    }
  }
}

// ===========================
// 6. 캡처 + YOLO 서버 호출
// ===========================
async function captureAndAnalyze() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const resultSection = document.getElementById('resultSection');
  const foodNameEl = document.getElementById('foodName');
  const kcalEl = document.getElementById('calorieValue');
  const noteEl = document.getElementById('resultNote');

  if (!video || !canvas) return null;

  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9)
  );

  const formData = new FormData();
  formData.append('file', blob, 'capture.jpg');

  const message = document.getElementById('message');
  if (message) {
    message.textContent = 'AI가 음식과 칼로리를 분석 중입니다... 🔍';
  }

  let response;
  try {
    response = await fetch(YOLO_API_URL, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('YOLO 서버 연결 실패', err);
    if (message) {
      message.textContent =
        'AI 서버에 일시적으로 접속할 수 없습니다. 잠시 후 다시 시도해 주세요. 🙏';
    }
    throw err;
  }

  if (!response.ok) {
    console.error('YOLO 응답 오류', await response.text());
    if (message) {
      message.textContent =
        'AI 분석 중 오류가 발생했습니다. 다시 촬영해 주세요. 🙏';
    }
    throw new Error('YOLO 응답 오류');
  }

  const data = await response.json();
  // 서버에서 내려주는 형식 예시:
  // { food_name: "김밥", calories: 550, confidence: 0.83 }

  const foodName = data.food_name || '알 수 없는 음식';
  const calories = Math.round(data.calories || 0);
  const confidence = data.confidence || 0;

  if (foodNameEl) foodNameEl.textContent = foodName;
  if (kcalEl) kcalEl.textContent = calories.toString();

  if (noteEl) {
    const confPercent = Math.round(confidence * 100);
    noteEl.textContent =
      confPercent > 0
        ? `AI가 인식한 음식: ${foodName} (신뢰도 약 ${confPercent}% 기준) · 실제와 다를 수 있으니 참고용으로만 사용해 주세요.`
        : '촬영한 이미지를 기반으로 대략적인 칼로리를 추정합니다.';
  }

  if (resultSection) {
    resultSection.classList.remove('hidden');
  }

  if (message) {
    message.textContent = '다음 음식도 바로 찍어서 기록해 볼까요? 📸';
  }

  return {
    name: foodName,
    calories,
  };
}

// ===========================
// 7. 오늘 섭취 기록 관리
// ===========================
function loadHistory() {
  const dateKey = getTodayKey();
  currentDateKey = dateKey;
  const historySection = document.getElementById('historySection');
  const list = document.getElementById('historyList');
  const totalEl = document.getElementById('historyTotal');
  const dateLabel = document.getElementById('historyDateLabel');

  if (!list || !totalEl) return;

  let total = 0;
  list.innerHTML = '';

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw);
      const todayItems = all[dateKey] || [];
      todayItems.forEach((item) => {
        total += item.calories || 0;
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
          <span class="history-food">${item.name}</span>
          <span class="history-kcal">${item.calories} kcal</span>
        `;
        list.appendChild(li);
      });
    }
  } catch (e) {
    console.error('히스토리 로드 오류', e);
  }

  totalEl.textContent = total.toString();

  if (dateLabel) {
    dateLabel.textContent = `오늘 섭취 기록 (${dateKey})`;
  }

  if (historySection) {
    if (total > 0) {
      historySection.classList.remove('hidden');
    } else {
      historySection.classList.add('hidden');
    }
  }
}

function appendHistory(item) {
  const dateKey = getTodayKey();
  currentDateKey = dateKey;

  let all = {};
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      all = JSON.parse(raw);
    }
  } catch (e) {
    all = {};
  }

  if (!all[dateKey]) all[dateKey] = [];
  all[dateKey].push({
    name: item.name,
    calories: item.calories,
  });

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(all));
  loadHistory();
}

function initHistoryControls() {
  const clearBtn = document.getElementById('historyClearBtn');
  if (!clearBtn) return;

  clearBtn.addEventListener('click', () => {
    if (!confirm('오늘 섭취 기록을 모두 삭제할까요?')) return;

    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const all = JSON.parse(raw);
        all[getTodayKey()] = [];
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(all));
      }
    } catch (e) {
      console.error('히스토리 삭제 오류', e);
    }
    loadHistory();
  });
}

// ===========================
// 8. 구독 모달 / 결제 버튼
// ===========================
function openSubscriptionModal() {
  const modal = document.getElementById('subscriptionModal');
  if (modal) {
    modal.classList.add('show');
  }
}

function closeSubscriptionModal() {
  const modal = document.getElementById('subscriptionModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function initModalButtons() {
  const laterBtn = document.getElementById('laterBtn');
  const closeBtn = document.getElementById('closeModalBtn');

  if (laterBtn) {
    laterBtn.addEventListener('click', () => {
      closeSubscriptionModal();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeSubscriptionModal();
    });
  }
}

function initPaymentButtons() {
  const buttons = document.querySelectorAll('.btn.pay');
  const paySelected = document.getElementById('paySelected');

  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const payType = btn.dataset.pay; // kakao / toss / card / paypal
      const plan = btn.dataset.plan || 'PRO';

      if (paySelected) {
        let label = '';
        if (payType === 'card') label = '신용/체크 카드 결제를 선택하셨습니다.';
        if (payType === 'kakao') label = '카카오페이 결제를 선택하셨습니다.';
        if (payType === 'toss') label = '토스 결제를 선택하셨습니다.';
        if (payType === 'paypal') label = 'PayPal(해외) 결제를 선택하셨습니다.';
        paySelected.textContent = label || '결제 수단을 선택하셨습니다.';
      }

      if (payType === 'card') {
        requestPortOneCardPayment(plan);
      } else {
        alert(
          '카카오페이/토스/PayPal은 PG사 연동 및 카드사 심사 완료 후 순차적으로 오픈됩니다. 현재는 카드 결제만 준비 중입니다.'
        );
      }
    });
  });
}

// 실제 카드 결제 요청 (초기 버전 – 프론트단 활성화용)
function requestPortOneCardPayment(planName) {
  if (!IMP) {
    alert('결제 모듈 초기화 중입니다. 잠시 후 다시 시도해 주세요.');
    return;
  }

  const amount =
    planName === 'Ultra' ? 5900 : planName === 'Starter' ? 3900 : 4900;

  const merchantUid = 'smartcal_' + new Date().getTime();

  IMP.request_pay(
    {
      pg: 'html5_inicis', // PG 계약 후 실제 코드로 수정
      pay_method: 'card',
      merchant_uid: merchantUid,
      name: `SmartCal AI ${planName} 월 구독`,
      amount: amount,
      buyer_email: 'guest@smartcal-ai.com',
      buyer_name: 'SmartCal User',
      m_redirect_url: 'https://smartcal-ai.com/payment-complete.html',
    },
    function (rsp) {
      if (rsp.success) {
        console.log('결제 성공:', rsp);

        // ⚠️ 실제 상용 오픈 시에는 서버에서 imp_uid로 결제 검증 필수!
        activateUnlimitedMode(planName);
        updateUsageText();

        alert(
          '결제가 정상 처리되었습니다. 이제 SmartCal AI를 무제한으로 이용하실 수 있어요! 🎉'
        );
        closeSubscriptionModal();
      } else {
        console.error('결제 실패 또는 취소:', rsp);
        alert(
          '결제가 취소되었거나 실패했습니다.\n사유: ' +
            (rsp.error_msg || '알 수 없는 오류')
        );
      }
    }
  );
}

// ===========================
// 9. PWA 설치
// ===========================
function initPWAInstall() {
  const installBtn = document.getElementById('installBtn');
  if (!installBtn) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPWAInstallEvent = e;
    installBtn.style.display = 'block';
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPWAInstallEvent) return;
    deferredPWAInstallEvent.prompt();
    const { outcome } = await deferredPWAInstallEvent.userChoice;
    console.log('PWA 설치 결과:', outcome);
    deferredPWAInstallEvent = null;
    installBtn.style.display = 'none';
  });
}

// ===========================
// 10. 초기화
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  restoreSubscriptionState();
  restoreDailyUsage();
  loadHistory();

  startCamera();
  initCameraControls();
  initHistoryControls();
  initModalButtons();
  initPaymentButtons();
  initPWAInstall();

  // CTA 문구 랜덤 변경
  const cta = document.getElementById('ctaMessage');
  if (cta) {
    const messages = [
      '지금 구독하면 식단 관리가 훨씬 쉬워집니다. 💚',
      '무제한 구독으로 매 끼니를 자동 기록해 보세요. 📊',
      '오늘 시작한 사람이 내일 더 가볍습니다. 지금 구독! ⚡',
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
    cta.textContent =
      messages[Math.floor(Math.random() * messages.length)];
  }
});
