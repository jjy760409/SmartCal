// SmartCal AI - Camera & Calorie Demo
// ⚠️ 이 파일 전체를 기존 app.js에 그대로 덮어쓰세요!

const MAX_FREE_USES = 3;

let captureCount = 0;
let currentStream = null;
let currentFacingMode = "environment"; // 후면 카메라 우선

// === DOM 요소 가져오기 ===
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const guideOverlay = document.getElementById("guideOverlay");

const captureBtn = document.getElementById("captureBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const resetGuideBtn = document.getElementById("resetGuideBtn");

const usageText = document.getElementById("usageText");
const usageBadge = document.getElementById("usageBadge");
const message = document.getElementById("message");

const resultSection = document.getElementById("resultSection");
const foodNameEl = document.getElementById("foodName");
const calorieValueEl = document.getElementById("calorieValue");
const resultNoteEl = document.getElementById("resultNote");

const subscriptionModal = document.getElementById("subscriptionModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const subscribeBtn = document.getElementById("subscribeBtn");
const laterBtn = document.getElementById("laterBtn");

// === 카메라 시작 ===
async function startCamera() {
  try {
    // 기존 스트림이 있으면 정리
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }

    const constraints = {
      video: {
        facingMode: currentFacingMode
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;
    await video.play();

    setMessage("찍고 싶은 음식이 화면 중앙에 오도록 맞춰주세요. 📸", "info");
  } catch (err) {
    console.error(err);
    setMessage("카메라 접근 권한을 허용해 주세요. (브라우저 설정 확인)", "error");
  }
}

// === 메시지 표시 ===
function setMessage(text, type = "info") {
  message.textContent = text || "";
  if (!text) return;

  if (type === "error") {
    message.style.color = "#fb7185"; // 빨강
  } else if (type === "warn") {
    message.style.color = "#facc15"; // 노랑
  } else {
    message.style.color = "#f97316"; // 주황 (기본)
  }
}

// === 사용 횟수 UI 갱신 ===
function updateUsageUI() {
  usageText.textContent = `무료 사용: ${captureCount} / ${MAX_FREE_USES}회`;

  if (captureCount >= MAX_FREE_USES) {
    usageBadge.textContent = "LIMIT REACHED";
    usageBadge.classList.add("limit");
    captureBtn.disabled = true;
  } else {
    usageBadge.textContent = "FREE MODE";
    usageBadge.classList.remove("limit");
    captureBtn.disabled = false;
  }
}

// === 구독 모달 열기/닫기 ===
function openSubscriptionModal() {
  subscriptionModal.classList.add("active");
}

function closeSubscriptionModal() {
  subscriptionModal.classList.remove("active");
}

// === 간단한 데모용 음식 & 칼로리 예시 ===
const demoFoods = [
  { name: "김밥(1줄)", kcal: 320, note: "일반적인 김밥 1줄 기준 대략적인 칼로리입니다." },
  { name: "치킨(한 조각)", kcal: 250, note: "조리 방법에 따라 실제 칼로리는 달라질 수 있어요." },
  { name: "햄버거(1개)", kcal: 450, note: "소스와 사이즈에 따라 차이가 큽니다." },
  { name: "샐러드(1그릇)", kcal: 110, note: "드레싱을 많이 넣으면 칼로리가 올라갑니다." },
  { name: "라면(1봉지)", kcal: 500, note: "국물을 덜 마시면 칼로리를 조금 줄일 수 있어요." },
  { name: "초콜릿(1조각)", kcal: 60, note: "당분 섭취를 조절하면서 드시는 걸 추천합니다." }
];

function getRandomFoodResult() {
  const item = demoFoods[Math.floor(Math.random() * demoFoods.length)];
  return item;
}

// === 촬영 & 분석 ===
function captureAndAnalyze() {
  // 1) 무료 횟수 초과 확인
  if (captureCount >= MAX_FREE_USES) {
    updateUsageUI();
    openSubscriptionModal();
    setMessage("무료 체험 3회가 모두 사용되었습니다. 😊", "warn");
    return;
  }

  // 2) 비디오 준비 여부 확인
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

    // 캔버스에 현재 프레임 그리기
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    // 실제 버전에서는 여기서 YOLO 등 AI 분석을 호출하면 됩니다.
    // 지금은 데모용으로 랜덤 음식 결과를 반환.
    const result = getRandomFoodResult();

    // 🔥 실제 촬영 1회 완료 → 여기에서만 사용 횟수 증가
    captureCount += 1;
    updateUsageUI();

    // 안내 오버레이 숨기기
    hideGuideOverlay();

    // 결과 표시
    showResult(result);

    // 사용 횟수 소진되었으면 모달 띄우기
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

// === 결과 카드 표시 ===
function showResult(result) {
  foodNameEl.textContent = result.name;
  calorieValueEl.textContent = result.kcal;
  resultNoteEl.textContent = result.note || "촬영한 이미지를 기반으로 대략적인 칼로리를 추정합니다.";
  resultSection.style.display = "block";
}

// === 안내 오버레이 제어 ===
function hideGuideOverlay() {
  guideOverlay.classList.add("hidden");
}

function showGuideOverlay() {
  guideOverlay.classList.remove("hidden");
  setMessage("화면 중앙에 음식이 잘 보이도록 맞춰주세요. 📷", "info");
}

// === 카메라 전환 ===
function toggleCamera() {
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  startCamera();
}

// === 이벤트 리스너 등록 ===
document.addEventListener("DOMContentLoaded", () => {
  // 초기 UI 설정
  updateUsageUI();
  showGuideOverlay();
  startCamera();

  captureBtn.addEventListener("click", captureAndAnalyze);
  switchCameraBtn.addEventListener("click", toggleCamera);
  resetGuideBtn.addEventListener("click", showGuideOverlay);

  // 모달 버튼들
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      closeSubscriptionModal();
    });
  }

  if (laterBtn) {
    laterBtn.addEventListener("click", () => {
      closeSubscriptionModal();
      setMessage("언제든지 다시 촬영하시면 구독 안내를 볼 수 있어요. 😊", "info");
    });
  }

  if (subscribeBtn) {
    subscribeBtn.addEventListener("click", () => {
      // 실제 버전: 결제/구독 화면으로 이동
      setMessage("현재는 데모 버전입니다. 정식 구독 기능은 곧 연결될 예정입니다. 🚀", "info");
      closeSubscriptionModal();
    });
  }

  // 모달 바깥 눌렀을 때 닫기 (백그라운드 클릭)
  subscriptionModal.addEventListener("click", (e) => {
    if (e.target === subscriptionModal) {
      closeSubscriptionModal();
    }
  });
});
