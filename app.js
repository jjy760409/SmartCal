// ===============================
// 기본 설정 & 전역 상태
// ===============================

// 🔁 YOLO 서버 URL (나중에 실제 주소로 교체)
const YOLO_SERVER_URL = 'https://YOUR-YOLO-SERVER/predict';

// 무료 체험에서 허용하는 촬영 횟수
const FREE_CAPTURE_LIMIT = 3;

// 로컬스토리지 키
const STORAGE_KEYS = {
  usageCount: 'smartcal_usage_count',
  unlimited: 'smartcal_unlimited',
  history: 'smartcal_history'
};

// 카메라 상태
let currentStream = null;
let currentFacingMode = 'environment'; // 기본: 후면 카메라

// 사용 상태
let usageCount = 0;
let isUnlimited = false;

// PWA 설치 프롬프트
let deferredInstallPrompt = null;

// ===============================
// DOM 요소 가져오기
// ===============================
const videoEl          = document.getElementById('video');
const canvasEl         = document.getElementById('canvas');
const guideOverlayEl   = document.getElementById('guideOverlay');
const switchCameraBtn  = document.getElementById('switchCameraBtn');
const captureBtn       = document.getElementById('captureBtn');

const usageBadgeEl     = document.getElementById('usageBadge');
const usageTextEl      = document.getElementById('usageText');
const messageEl        = document.getElementById('message');

const resultSectionEl  = document.getElementById('resultSection');
const foodNameEl       = document.getElementById('foodName');
const calorieValueEl   = document.getElementById('calorieValue');
const resultNoteEl     = document.getElementById('resultNote');

const historySectionEl = document.getElementById('historySection');
const historyDateLabel = document.getElementById('historyDateLabel');
const historyListEl    = document.getElementById('historyList');
const historyTotalEl   = document.getElementById('historyTotal');
const historyClearBtn  = document.getElementById('historyClearBtn');

const installBtn       = document.getElementById('installBtn');

// 구독 모달 관련
const subscriptionModalEl = document.getElementById('subscriptionModal');
const ctaMessageEl        = document.getElementById('ctaMessage');
const paySelectedEl       = document.getElementById('paySelected');
const laterBtn            = document.getElementById('laterBtn');
const closeModalBtn       = document.getElementById('closeModalBtn');

// ===============================
// 초기화
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  initTrialState();
  initCamera();
  initHistory();
  initPWA();
  initSubscriptionModal();
  initPayments();
});

// ===============================
// 체험 / 무제한 상태 관리
// ===============================

function initTrialState() {
  // 무제한 여부
  const unlimitedFlag = localStorage.getItem(STORAGE_KEYS.unlimited);
  isUnlimited = unlimitedFlag === 'yes';

  // 사용 횟수
  const savedUsage = parseInt(localStorage.getItem(STORAGE_KEYS.usageCount) || '0', 10);
  usageCount = isNaN(savedUsage) ? 0 : savedUsage;

  if (isUnlimited) {
    setUnlimitedMode();
  } else {
    updateFreeModeUI();
  }
}

function updateFreeModeUI() {
  if (!usageBadgeEl || !usageTextEl) return;

  usageBadgeEl.textContent = 'FREE 24H';
  usageBadgeEl.classList.remove('pill-unlimited');
  if (!usageBadgeEl.classList.contains('pill-free')) {
    usageBadgeEl.classList.add('pill-free');
  }

  usageTextEl.textContent = `무료 체험 중 · 오늘 ${usageCount}/${FREE_CAPTURE_LIMIT}회 사용했습니다.`;
}

// ✅ 결제 성공 후 무제한 모드로 전환하는 함수
function setUnlimitedMode() {
  // 1) 상태 저장 (새로고침해도 유지)
  localStorage.setItem(STORAGE_KEYS.unlimited, 'yes');
  localStorage.setItem(STORAGE_KEYS.usageCount, '0');

  // 2) 화면 배지/문구 바꾸기
  if (usageBadgeEl) {
    usageBadgeEl.textContent = 'UNLIMITED';
    usageBadgeEl.classList.remove('pill-free');
    usageBadgeEl.classList.add('pill-unlimited');
  }

  if (usageTextEl) {
    usageTextEl.textContent = '무제한 이용중입니다. 마음껏 촬영해 보세요! 🚀';
  }

  // 3) 내부 플래그
  isUnlimited = true;
  usageCount = 0;
  window.smartcalIsUnlimited = true;
  window.smartcalUsageCount = 0;
}

// ===============================
// 카메라 관련
// ===============================

async function initCamera() {
  try {
    await startCamera(currentFacingMode);
  } catch (err) {
    console.error(err);
    if (messageEl) {
      messageEl.textContent = '카메라를 사용할 수 없어요. 브라우저 권한을 확인해 주세요. 🔒';
    }
  }

  if (switchCameraBtn) {
    switchCameraBtn.addEventListener('click', async () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      await startCamera(currentFacingMode);
    });
  }

  if (captureBtn) {
    captureBtn.addEventListener('click', onCaptureClick);
  }
}

async function startCamera(facingMode) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('getUserMedia not supported');
  }

  // 기존 스트림 중지
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: { facingMode },
    audio: false
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  currentStream = stream;
  videoEl.srcObject = stream;

  if (guideOverlayEl) {
    guideOverlayEl.style.display = 'flex';
  }
}

async function onCaptureClick() {
  // 무료 모드에서 사용 횟수 초과 시 모달 열기
  if (!isUnlimited && usageCount >= FREE_CAPTURE_LIMIT) {
    openSubscriptionModal();
    return;
  }

  try {
    if (messageEl) {
      messageEl.textContent = '이미지 분석 중입니다... 잠시만 기다려 주세요. ⏳';
    }

    const blob = await captureCurrentFrame();
    const result = await sendToYolo(blob);

    const foodName = result.food_name || '인식된 음식';
    const calories = result.calories || 0;

    showResult(foodName, calories);
    saveHistoryItem(foodName, calories);

    if (!isUnlimited) {
      usageCount += 1;
      localStorage.setItem(STORAGE_KEYS.usageCount, String(usageCount));
      updateFreeModeUI();

      if (usageCount >= FREE_CAPTURE_LIMIT) {
        // 바로 다음 사용부터는 구독 유도
        openSubscriptionModal();
      }
    }

    if (messageEl) {
      messageEl.textContent = '다음 음식도 촬영해 보세요. 📷';
    }
  } catch (err) {
    console.error(err);
    if (messageEl) {
      messageEl.textContent = '분석 중 오류가 발생했어요. 다시 한 번 촬영해 주세요. 🙏';
    }
  }
}

function captureCurrentFrame() {
  return new Promise((resolve, reject) => {
    if (!videoEl || !canvasEl) {
      reject(new Error('video/canvas 요소를 찾을 수 없음'));
      return;
    }

    const width = videoEl.videoWidth;
    const height = videoEl.videoHeight;

    if (!width || !height) {
      reject(new Error('비디오가 아직 준비되지 않음'));
      return;
    }

    canvasEl.width = width;
    canvasEl.height = height;

    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, width, height);

    canvasEl.toBlob(blob => {
      if (!blob) {
        reject(new Error('이미지 캡처 실패'));
      } else {
        resolve(blob);
      }
    }, 'image/jpeg', 0.9);
  });
}

async function sendToYolo(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'capture.jpg');

  const response = await fetch(YOLO_SERVER_URL, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('YOLO 서버 응답 오류');
  }

  const data = await response.json();
  return data;
}

// ===============================
// 결과 표시 & 기록
// ===============================

function showResult(foodName, calories) {
  if (foodNameEl) foodNameEl.textContent = foodName;
  if (calorieValueEl) calorieValueEl.textContent = Math.round(calories);

  if (resultSectionEl) {
    resultSectionEl.classList.remove('hidden');
  }
}

function initHistory() {
  if (historyClearBtn) {
    historyClearBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.history);
      renderHistory();
    });
  }
  renderHistory();
}

function saveHistoryItem(foodName, calories) {
  const todayKey = getTodayKey();
  const history = getHistory();

  if (!history[todayKey]) {
    history[todayKey] = [];
  }

  history[todayKey].push({
    foodName,
    calories,
    time: new Date().toISOString()
  });

  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  renderHistory();
}

function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function renderHistory() {
  if (!historyListEl || !historyTotalEl || !historySectionEl) return;

  const history = getHistory();
  const todayKey = getTodayKey();
  const todayList = history[todayKey] || [];

  historyListEl.innerHTML = '';

  if (todayList.length === 0) {
    historySectionEl.classList.add('hidden');
    historyTotalEl.textContent = '0';
    if (historyDateLabel) historyDateLabel.textContent = '오늘 섭취 기록';
    return;
  }

  historySectionEl.classList.remove('hidden');
  if (historyDateLabel) historyDateLabel.textContent = `${todayKey} 섭취 기록`;

  let total = 0;

  todayList.forEach(item => {
    total += Number(item.calories || 0);

    const li = document.createElement('li');
    li.className = 'history-item';

    const time = new Date(item.time);
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');

    li.innerHTML = `
      <div class="history-food">${item.foodName}</div>
      <div class="history-meta">
        <span>${hh}:${mm}</span>
        <span>${Math.round(item.calories)} kcal</span>
      </div>
    `;

    historyListEl.appendChild(li);
  });

  historyTotalEl.textContent = String(Math.round(total));
}

// ===============================
// PWA 설치
// ===============================

function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', onInstallClick);
    }
  });
}

async function onInstallClick() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choiceResult = await deferredInstallPrompt.userChoice;
  if (choiceResult.outcome === 'accepted') {
    console.log('PWA 설치 완료');
  }
  deferredInstallPrompt = null;
  if (installBtn) installBtn.style.display = 'none';
}

// ===============================
// 구독 모달
// ===============================

function initSubscriptionModal() {
  if (laterBtn) {
    laterBtn.addEventListener('click', () => {
      closeSubscriptionModal();
    });
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      closeSubscriptionModal();
    });
  }

  // 랜덤 CTA 문구
  if (ctaMessageEl) {
    const ctas = [
      '지금 구독하면 목표 몸무게에 한 걸음 더 가까워집니다! 💪',
      '하루 한 잔 카페라떼 값으로 건강을 기록해 보세요. ☕',
      '눈치 보지 말고 마음껏 먹고, SmartCal에게 기록은 맡기세요. 📊'
    ];
    ctaMessageEl.textContent = ctas[Math.floor(Math.random() * ctas.length)];
  }
}

function openSubscriptionModal() {
  if (!subscriptionModalEl) return;
  subscriptionModalEl.classList.add('show');
}

function closeSubscriptionModal() {
  if (!subscriptionModalEl) return;
  subscriptionModalEl.classList.remove('show');
}

// ===============================
// 포트원 결제 연동
// ===============================

function initPayments() {
  if (typeof IMP === 'undefined') {
    console.warn('IMP(아임포트) 객체를 찾을 수 없습니다. 스크립트를 확인해 주세요.');
    return;
  }

  // 발급받은 가맹점 식별코드
  IMP.init('imp86203201');

  const payButtons = document.querySelectorAll('.btn.pay');
  payButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const method = btn.getAttribute('data-pay');
      const planTarget = btn.getAttribute('data-plan-target') || 'pro';

      if (paySelectedEl) {
        paySelectedEl.textContent = `${btn.textContent.trim()} 선택됨 · 결제창을 여는 중입니다...`;
      }

      requestPayment(method, planTarget);
    });
  });
}

function requestPayment(method, plan) {
  // 요금제별 금액
  const planInfo = {
    starter: { name: 'SmartCal Starter', amount: 3900 },
    pro:     { name: 'SmartCal PRO',     amount: 4900 },
    ultra:   { name: 'SmartCal Ultra',   amount: 5900 }
  };

  const info = planInfo[plan] || planInfo.pro;

  // PG / pay_method 설정 (실제 계약 PG에 맞게 수정 필요)
  let pg = 'html5_inicis';
  let payMethod = 'card';

  if (method === 'kakao') {
    pg = 'kakaopay';
    payMethod = 'card';
  } else if (method === 'toss') {
    pg = 'tosspay';
    payMethod = 'card';
  } else if (method === 'paypal') {
    // 해외결제용 예시 (실제 PG 정책에 따라 수정)
    pg = 'paypal';
    payMethod = 'card';
  }

  const merchantUid = 'smartcal_' + new Date().getTime();

  IMP.request_pay(
    {
      pg,
      pay_method: payMethod,
      merchant_uid: merchantUid,
      name: info.name,
      amount: info.amount,
      // 필요하면 아래 buyer 정보 채우기
      buyer_email: '',
      buyer_name: '',
      buyer_tel: '',
      buyer_addr: '',
      buyer_postcode: ''
    },
    function (rsp) {
      if (rsp.success) {
        // TODO: 실제 서비스에서는 여기서 서버로 검증 요청(REST API) 후
        // 검증까지 OK일 때만 setUnlimitedMode() 호출하는 것이 안전합니다.

        setUnlimitedMode();
        closeSubscriptionModal();

        if (paySelectedEl) {
          paySelectedEl.textContent = '결제가 정상적으로 완료되었습니다. 무제한 이용이 활성화되었어요! ✅';
        }
        alert('결제가 완료되었습니다. 이제 무제한으로 SmartCal AI를 이용하실 수 있습니다!');

      } else {
        if (paySelectedEl) {
          paySelectedEl.textContent = '결제가 취소되었거나 실패했습니다. 다시 시도해 주세요. 🙏';
        }
        alert('결제가 취소되었거나 실패했습니다.');
      }
    }
  );
}
