// ===========================
// 0. PortOne(Iamport) 초기화
// ===========================
const IMP = window.IMP || null;
if (IMP) {
  // 가맹점 식별코드(MID): imp86203201
  IMP.init('imp86203201');
} else {
  console.warn('PortOne(Iamport) 스크립트가 로드되지 않았습니다.');
}

// ===========================
// 1. 전역 상수 & 상태
// ===========================
const YOLO_API_URL = 'http://localhost:8000/predict';

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
    ];
    cta.textContent =
      messages[Math.floor(Math.random() * messages.length)];
  }
});
