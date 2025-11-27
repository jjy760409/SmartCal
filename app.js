// app.js

"use strict";

/**
 * ===============================
 *  기본 상수 & 저장 키
 * ===============================
 */

// 무료 일일 사용 제한 (3회)
const FREE_DAILY_LIMIT = 3;

// 로컬스토리지 키
const STORAGE_KEYS = {
  PLAN: "scal_plan",            // "free" | "unlimited"
  USAGE_DATE: "scal_usage_date",
  USAGE_COUNT: "scal_usage_count",
  HISTORY: "scal_history"
};

// 칼로로 음성 스타일 (C: 귀엽고 든든한 친구)
const CALORO_VOICE_PROFILE = {
  id: "C",
  name: "Caloro",
  style: "귀엽고 든든한 친구",
  locale: "ko-KR",
  pitch: 1.05,
  speakingRate: 1.02
};

// AI 서버 주소 (B 방식: 진짜 AI)
// ★ 실제 YOLO/AI 서버 주소로 변경해서 사용 ★
const SMARTCAL_API_URL = "https://YOUR_SMARTCAL_AI_SERVER_URL/api/predict"; 
// 예: https://smartcal-yolo-server.onrender.com/predict

// 전역 상태
let currentStream = null;
let currentFacingMode = "environment"; // "user" | "environment"
let deferredInstallPrompt = null;
let IMP_INSTANCE = null;

/**
 * ===============================
 *  유틸 함수
 * ===============================
 */

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getUsageCount() {
  const today = getTodayKey();
  const savedDate = localStorage.getItem(STORAGE_KEYS.USAGE_DATE);
  if (savedDate !== today) {
    localStorage.setItem(STORAGE_KEYS.USAGE_DATE, today);
    localStorage.setItem(STORAGE_KEYS.USAGE_COUNT, "0");
    return 0;
  }
  return parseInt(localStorage.getItem(STORAGE_KEYS.USAGE_COUNT) || "0", 10);
}

function incrementUsageCount() {
  const today = getTodayKey();
  const savedDate = localStorage.getItem(STORAGE_KEYS.USAGE_DATE);
  if (savedDate !== today) {
    localStorage.setItem(STORAGE_KEYS.USAGE_DATE, today);
    localStorage.setItem(STORAGE_KEYS.USAGE_COUNT, "1");
    localStorage.setItem(STORAGE_KEYS.USAGE_DATE, today);
    return 1;
  } else {
    const current = getUsageCount() + 1;
    localStorage.setItem(STORAGE_KEYS.USAGE_COUNT, String(current));
    return current;
  }
}

function isUnlimited() {
  return localStorage.getItem(STORAGE_KEYS.PLAN) === "unlimited";
}

function setPlanUnlimited() {
  localStorage.setItem(STORAGE_KEYS.PLAN, "unlimited");
}

function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory(list) {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(list));
}

/**
 * ===============================
 *  슬로건 자동 변환
 * ===============================
 */

function setDynamicSlogan() {
  const userLang = navigator.language || navigator.userLanguage;
  const sloganElement = document.getElementById("sloganText");
  if (!sloganElement) return;

  if (userLang && userLang.startsWith("ko")) {
    // 한국 사용자 → 칼로로 문구
    sloganElement.innerText = "칼로로와 함께 똑똑하게 먹고, 건강하게 살자! 🍽️💚";
  } else {
    // 글로벌 사용자 → 영어 슬로건
    sloganElement.innerText = "Eat Smart. Live Better. 🌎✨";
  }
}

/**
 * ===============================
 *  UI 업데이트 (뱃지/문구)
 * ===============================
 */

function updateUsageUI() {
  const badge = document.getElementById("usageBadge");
  const usageText = document.getElementById("usageText");

  if (!badge || !usageText) return;

  if (isUnlimited()) {
    badge.classList.remove("pill-free");
    badge.classList.add("pill-premium");
    badge.textContent = "무제한 이용중";

    usageText.textContent =
      "지금은 Caloro 무제한 구독 상태예요. 마음껏 촬영하고 기록해 보세요! 🚀";
  } else {
    const used = getUsageCount();
    const remain = Math.max(FREE_DAILY_LIMIT - used, 0);
    badge.classList.remove("pill-premium");
    badge.classList.add("pill-free");
    badge.textContent = `FREE ${FREE_DAILY_LIMIT}회`;

    usageText.textContent = `오늘 무료로 ${FREE_DAILY_LIMIT}번까지 촬영할 수 있어요. (남은 횟수: ${remain}회)`;
  }
}

/**
 * ===============================
 *  카메라 관련
 * ===============================
 */

async function startCamera(facingMode = "environment") {
  const video = document.getElementById("video");
  if (!video) return;

  // 기존 스트림 정리
  if (currentStream) {
    currentStream.getTracks().forEach((t) => t.stop());
    currentStream = null;
  }

  try {
    const constraints = {
      audio: false,
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;
  } catch (err) {
    console.error("카메라 시작 오류:", err);
    const message = document.getElementById("message");
    if (message) {
      message.textContent = "카메라에 접근할 수 없어요. 브라우저 권한을 확인해 주세요. 🔒";
    }
  }
}

function toggleCamera() {
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  startCamera(currentFacingMode);
}

/**
 * ===============================
 *  캡처 & AI 분석
 * ===============================
 */

async function captureAndAnalyze() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const resultSection = document.getElementById("resultSection");
  const message = document.getElementById("message");

  if (!video || !canvas) return;

  // 캔버스에 현재 프레임 그리기
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    if (message) {
      message.textContent = "카메라가 아직 준비 중이에요. 잠시 후 다시 시도해 주세요.";
    }
    return;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, width, height);

  if (message) {
    message.textContent = "칼로로가 지금 사진을 분석 중이에요... 🤖";
  }

  try {
    // 캔버스 → Blob 변환
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );

    // 실제 AI 서버로 전송
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    const response = await fetch(SMARTCAL_API_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("AI 서버 응답 에러");
    }

    const data = await response.json();
    // 서버에서 이런 형태로 응답한다고 가정:
    // { food_name: "김밥", calories: 350, note: "1인분 기준" }

    const foodName = data.food_name || "알 수 없는 음식";
    const calories = data.calories || 0;
    const note =
      data.note || "AI가 이미지를 분석한 결과입니다. 추정값이므로 참고용으로 사용해 주세요.";

    showResult(foodName, calories, note);
    addHistoryItem(foodName, calories);
  } catch (err) {
    console.error("AI 분석 오류:", err);
    showResult(
      "분석 실패",
      0,
      "AI 서버와 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요."
    );
  }

  if (resultSection) {
    resultSection.classList.remove("hidden");
  }
}

function showResult(foodName, calories, note) {
  const foodNameEl = document.getElementById("foodName");
  const calorieValueEl = document.getElementById("calorieValue");
  const resultNoteEl = document.getElementById("resultNote");

  if (foodNameEl) foodNameEl.textContent = foodName;
  if (calorieValueEl) calorieValueEl.textContent = calories;
  if (resultNoteEl) resultNoteEl.textContent = note;
}

/**
 * ===============================
 *  섭취 기록 관리
 * ===============================
 */

function addHistoryItem(foodName, calories) {
  const history = getHistory();
  const now = new Date();
  history.push({
    foodName,
    calories,
    time: now.toISOString()
  });
  saveHistory(history);
  renderHistory();
}

function renderHistory() {
  const historySection = document.getElementById("historySection");
  const listEl = document.getElementById("historyList");
  const totalEl = document.getElementById("historyTotal");
  const dateLabel = document.getElementById("historyDateLabel");

  const history = getHistory();
  if (!listEl || !totalEl || !dateLabel) return;

  if (history.length === 0) {
    historySection && historySection.classList.add("hidden");
    listEl.innerHTML = "";
    totalEl.textContent = "0";
    return;
  }

  historySection && historySection.classList.remove("hidden");

  const today = getTodayKey().replace(/-/g, ".");
  dateLabel.textContent = `오늘 섭취 기록 (${today})`;

  listEl.innerHTML = "";
  let total = 0;
  history.forEach((item) => {
    total += Number(item.calories || 0);
    const li = document.createElement("li");
    li.className = "history-item";

    const time = new Date(item.time);
    const hh = String(time.getHours()).padStart(2, "0");
    const mm = String(time.getMinutes()).padStart(2, "0");

    li.innerHTML = `
      <div class="history-main">
        <span class="history-food">${item.foodName}</span>
        <span class="history-kcal">${item.calories} kcal</span>
      </div>
      <span class="history-time">${hh}:${mm}</span>
    `;
    listEl.appendChild(li);
  });

  totalEl.textContent = total;
}

/**
 * ===============================
 *  구독 모달
 * ===============================
 */

function openSubscriptionModal() {
  const modal = document.getElementById("subscriptionModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeSubscriptionModal() {
  const modal = document.getElementById("subscriptionModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

/**
 * ===============================
 *  Iamport 결제 연동 (클라이언트)
 * ===============================
 *
 * 실제 서비스에서는:
 * 1) 결제 성공 → 서버로 imp_uid, merchant_uid 전달
 * 2) 서버에서 REST API(REST API Key/Secret 사용)로 결제 검증
 * 3) 검증 성공 시에만 무제한 활성화
 */

function initIamport() {
  if (!window.IMP) {
    console.warn("IMP(Iamport) 객체를 찾을 수 없습니다.");
    return;
  }
  IMP_INSTANCE = window.IMP;
  // 포트원에서 발급받은 가맹점 식별코드(MID)
  IMP_INSTANCE.init("imp86203201");
}

function handlePayButtonClick(method) {
  const paySelected = document.getElementById("paySelected");
  if (!IMP_INSTANCE) {
    alert("결제 모듈 준비 중입니다. 잠시 후 다시 시도해 주세요.");
    return;
  }

  let pg = "html5_inicis";   // 기본 PG
  let pay_method = "card";   // 기본 카드 결제

  if (method === "kakao") {
    pg = "kakaopay";
  } else if (method === "toss") {
    pg = "tosspay";
  } else if (method === "paypal") {
    // 해외용 - 실제 PG 연동 시 정책에 맞게 변경 필요
    pg = "paypal";
    pay_method = "paypal";
  }

  if (paySelected) {
    paySelected.textContent = "결제창을 여는 중입니다. 잠시만 기다려 주세요... ⏳";
  }

  const merchantUid = "smartcal_" + new Date().getTime();

  IMP_INSTANCE.request_pay(
    {
      pg,
      pay_method,
      merchant_uid: merchantUid,
      name: "SmartCal AI PRO 무제한 이용권",
      amount: 1900, // 이벤트: 1,900원
      // 필요하면 구매자 정보 추가 가능
      // buyer_email: "",
      // buyer_name: "",
      // buyer_tel: "",
      // buyer_addr: "",
      // buyer_postcode: ""
    },
    function (rsp) {
      if (rsp.success) {
        // ⚠️ 실제 서비스에서는 서버에 검증 요청 필요
        setPlanUnlimited();
        updateUsageUI();
        closeSubscriptionModal();

        if (paySelected) {
          paySelected.textContent =
            "결제가 완료되었어요. 지금부터 Caloro 무제한 기준으로 이용하실 수 있어요! 🎉";
        }

        alert("결제가 정상적으로 완료되었습니다. 이제 무제한으로 이용 가능합니다!");
      } else {
        console.error("결제 실패:", rsp.error_msg);
        alert("결제가 실패했습니다. 다시 시도해 주세요.\n\n사유: " + rsp.error_msg);
        if (paySelected) {
          paySelected.textContent = "결제를 다시 시도해 주세요. 🙏";
        }
      }
    }
  );
}

/**
 * ===============================
 *  PWA 설치 & 아이콘 스타일
 * ===============================
 */

function initPWAInstall() {
  const installBtn = document.getElementById("installBtn");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) {
      installBtn.style.display = "block";
    }
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") {
        installBtn.textContent = "설치 완료! 홈 화면에서 열어보세요 ✅";
      }
      deferredInstallPrompt = null;
    });
  }

  // 아이콘 스타일 선택
  const iconButtons = document.querySelectorAll(".icon-style");
  iconButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const icon = btn.getAttribute("data-icon");
      iconButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      // 선택한 아이콘 스타일 저장 (필요 시 PWA 아이콘 교체에 활용)
      localStorage.setItem("scal_icon_style", icon);
    });
  });

  // 이전에 선택한 아이콘 스타일 복원
  const savedIcon = localStorage.getItem("scal_icon_style");
  if (savedIcon) {
    const selectedBtn = document.querySelector(
      `.icon-style[data-icon="${savedIcon}"]`
    );
    selectedBtn && selectedBtn.classList.add("selected");
  }
}

/**
 * ===============================
 *  이벤트 바인딩 & 초기화
 * ===============================
 */

function initEventListeners() {
  const captureBtn = document.getElementById("captureBtn");
  const switchCameraBtn = document.getElementById("switchCameraBtn");
  const historyClearBtn = document.getElementById("historyClearBtn");
  const laterBtn = document.getElementById("laterBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");

  if (captureBtn) {
    captureBtn.addEventListener("click", async () => {
      // 무료/무제한 체크
      if (!isUnlimited()) {
        const used = getUsageCount();
        if (used >= FREE_DAILY_LIMIT) {
          openSubscriptionModal();
          return;
        }
        incrementUsageCount();
        updateUsageUI();
      }
      await captureAndAnalyze();
    });
  }

  if (switchCameraBtn) {
    switchCameraBtn.addEventListener("click", () => {
      toggleCamera();
    });
  }

  if (historyClearBtn) {
    historyClearBtn.addEventListener("click", () => {
      if (confirm("오늘 섭취 기록을 모두 삭제할까요?")) {
        saveHistory([]);
        renderHistory();
      }
    });
  }

  if (laterBtn) {
    laterBtn.addEventListener("click", () => {
      closeSubscriptionModal();
    });
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      closeSubscriptionModal();
    });
  }

  // 결제 버튼들
  const payButtons = document.querySelectorAll(".btn.pay");
  payButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const method = btn.getAttribute("data-pay");
      handlePayButtonClick(method);
    });
  });
}

// DOM 로드 완료 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  setDynamicSlogan();
  initIamport();
  updateUsageUI();
  renderHistory();
  startCamera(currentFacingMode);
  initPWAInstall();
  initEventListeners();
});
