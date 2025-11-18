// 카메라 열기
const video = document.getElementById("camera");
const captureBtn = document.getElementById("captureBtn");
const retakeBtn = document.getElementById("retakeBtn");
const resultSection = document.getElementById("resultSection");
const canvas = document.getElementById("captureCanvas");

const caloAvatar = document.getElementById("caloAvatar");
const caloTitle = document.getElementById("caloTitle");
const caloMessage = document.getElementById("caloMessage");

const resultFoodName = document.getElementById("resultFoodName");
const resultCalorie = document.getElementById("resultCalorie");
const carbBar = document.getElementById("carbBar");
const sugarBar = document.getElementById("sugarBar");
const proteinBar = document.getElementById("proteinBar");
const fatBar = document.getElementById("fatBar");
const carbValue = document.getElementById("carbValue");
const sugarValue = document.getElementById("sugarValue");
const proteinValue = document.getElementById("proteinValue");
const fatValue = document.getElementById("fatValue");
const caloCoachingTitle = document.getElementById("caloCoachingTitle");
const caloCoachingMessage = document.getElementById("caloCoachingMessage");

// 튜토리얼
const tutorialModal = document.getElementById("tutorialModal");
const openTutorialBtn = document.getElementById("openTutorialBtn");
const closeTutorialBtn = document.getElementById("closeTutorialBtn");

// 더미 음식 데이터 (모의 AI 분석용)
const SAMPLE_FOODS = [
  {
    name: "사과 1개 (중간 크기)",
    kcal: 95,
    carb: 25,
    sugar: 19,
    protein: 0.5,
    fat: 0.3,
    coaching:
      "자연식 간식 선택, 훌륭해요! 🍎 섬유질이 많아서 포만감을 오래 유지시켜 줄 거예요.",
    mood: "good",
  },
  {
    name: "초콜릿 케이크 1조각",
    kcal: 340,
    carb: 46,
    sugar: 32,
    protein: 4,
    fat: 15,
    coaching:
      "오늘은 달콤한 보상 타임이네요 🍰 내일은 조금 더 가벼운 선택으로 균형을 맞춰 볼까요?",
    mood: "warn",
  },
  {
    name: "닭가슴살 샐러드 1접시",
    kcal: 210,
    carb: 10,
    sugar: 5,
    protein: 24,
    fat: 8,
    coaching:
      "단백질과 채소 밸런스가 아주 좋아요 🥗 운동 후 식사로도 최고예요!",
    mood: "great",
  },
  {
    name: "아메리카노 1잔 (무가당)",
    kcal: 5,
    carb: 1,
    sugar: 0,
    protein: 0,
    fat: 0,
    coaching:
      "칼로리 부담 거의 없는 깔끔한 선택이에요 ☕ 단, 카페인 섭취량만 주의해 주세요.",
    mood: "neutral",
  },
];

// 카메라 시작
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = stream;
  } catch (err) {
    console.error("카메라 사용 불가:", err);
    caloTitle.textContent = "카메라 권한이 필요해요 📷";
    caloMessage.textContent =
      "브라우저 설정에서 카메라 접근을 허용한 뒤, 페이지를 새로고침해 주세요.";
  }
}

// 사진 촬영 + 캔버스에 그리기
function captureFrame() {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const size = Math.min(vw, vh);
  const sx = (vw - size) / 2;
  const sy = (vh - size) / 2;

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

  return canvas.toDataURL("image/jpeg", 0.6);
}

// 모의 AI 분석
function fakeAnalyzeFood() {
  const food = SAMPLE_FOODS[Math.floor(Math.random() * SAMPLE_FOODS.length)];

  resultFoodName.textContent = food.name;
  resultCalorie.textContent = `${food.kcal} kcal`;

  const max = Math.max(food.carb, food.sugar, food.protein, food.fat, 1);

  carbBar.style.width = `${(food.carb / max) * 100}%`;
  sugarBar.style.width = `${(food.sugar / max) * 100}%`;
  proteinBar.style.width = `${(food.protein / max) * 100}%`;
  fatBar.style.width = `${(food.fat / max) * 100}%`;

  carbValue.textContent = `${food.carb} g`;
  sugarValue.textContent = `${food.sugar} g`;
  proteinValue.textContent = `${food.protein} g`;
  fatValue.textContent = `${food.fat} g`;

  caloCoachingTitle.textContent = "AI 코칭";

  caloCoachingMessage.textContent = food.coaching;

  // Calo 표정/느낌 변경
  switch (food.mood) {
    case "great":
      caloAvatar.textContent = "😄";
      caloTitle.textContent = "완벽한 선택이에요!";
      caloMessage.textContent = "이대로만 먹으면 몸이 정말 좋아질 거예요 ✨";
      break;
    case "good":
      caloAvatar.textContent = "😊";
      caloTitle.textContent = "건강한 선택이에요!";
      caloMessage.textContent = "이런 간식 패턴이 쌓이면, 몸이 훨씬 가벼워져요.";
      break;
    case "warn":
      caloAvatar.textContent = "🤔";
      caloTitle.textContent = "가끔은 괜찮아요!";
      caloMessage.textContent =
        "대신 오늘 나머지 식사에서는 조금 더 가볍게 가볼까요?";
      break;
    default:
      caloAvatar.textContent = "🤖";
      caloTitle.textContent = "Calo가 기록 중이에요.";
      caloMessage.textContent = "하루 전체 패턴을 보고 더 정확한 코칭을 준비할게요.";
  }
}

captureBtn.addEventListener("click", () => {
  const dataUrl = captureFrame();
  if (!dataUrl) {
    alert("카메라 준비 중입니다. 1~2초 후 다시 눌러 주세요.");
    return;
  }

  caloTitle.textContent = "AI가 분석 중이에요…";
  caloMessage.textContent = "1초만 기다려 주세요. 영양정보를 계산하고 있어요 ✨";

  captureBtn.disabled = true;
  retakeBtn.hidden = false;

  // 실제론 여기서 서버/YOLO API 호출
  setTimeout(() => {
    fakeAnalyzeFood();
    resultSection.hidden = false;
    captureBtn.disabled = false;
  }, 800);
});

retakeBtn.addEventListener("click", () => {
  resultSection.hidden = true;
  retakeBtn.hidden = true;
  caloAvatar.textContent = "🤖";
  caloTitle.textContent = "다음 음식도 찍어 볼까요?";
  caloMessage.textContent =
    "접시에 담고 가운데 박스 안에 맞춘 뒤 다시 촬영 버튼을 눌러 주세요.";
});

openTutorialBtn.addEventListener("click", () => {
  tutorialModal.hidden = false;
});

closeTutorialBtn.addEventListener("click", () => {
  tutorialModal.hidden = true;
});

// PWA 서비스워커 등록
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.warn("서비스워커 등록 실패:", err);
    });
  });
}

// 초기 카메라 시작
startCamera();
