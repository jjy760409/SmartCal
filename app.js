// app.js — SmartCal AI 메인 스크립트

// 무료 체험 최대 횟수
const MAX_FREE_SHOTS = 3;
const STORAGE_KEY = "smartcal_freeShots";

// =====================================
// 1. 무료 사용 횟수 관리
// =====================================
function getUsedShots() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = parseInt(raw || "0", 10);
  return Number.isNaN(n) ? 0 : n;
}

function setUsedShots(n) {
  localStorage.setItem(STORAGE_KEY, String(n));
}

function updateFreeBadge() {
  const badge = document.getElementById("freeBadge");
  if (!badge) return;

  const used = getUsedShots();
  const remain = Math.max(0, MAX_FREE_SHOTS - used);

  // 예: "4 / 3 · 무료 체험 · 남은 촬영 0회 (총 3회)"
  badge.textContent = `${used} / ${MAX_FREE_SHOTS} · 무료 체험 · 남은 촬영 ${remain}회 (총 ${MAX_FREE_SHOTS}회)`;
}

// =====================================
// 2. 카메라 & 촬영 로직
// =====================================
function initCameraAndCapture() {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("captureCanvas");
  const snapButton = document.getElementById("snapButton");
  const resultContainer = document.getElementById("resultContainer");

  if (!video || !canvas || !snapButton || !resultContainer) {
    // 이 페이지가 카메라 화면이 아닐 수도 있으니 조용히 리턴
    return;
  }

  // 카메라 시작
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
      })
      .catch((err) => {
        console.error("카메라 접근 실패:", err);
        resultContainer.innerHTML =
          "<p>카메라를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.</p>";
      });
  } else {
    resultContainer.innerHTML =
      "<p>이 브라우저에서는 카메라를 지원하지 않습니다.</p>";
  }

  const ctx = canvas.getContext("2d");

  snapButton.addEventListener("click", () => {
    const used = getUsedShots();

    // 무료 체험 초과 시 → 구독 모달로 전환
    if (used >= MAX_FREE_SHOTS) {
      const subModal = document.getElementById("subscribeModal");
      if (subModal) {
        subModal.style.display = "flex";
      }
      return;
    }

    // 동영상 준비 안 되면 캡처 스킵
    if (!video.videoWidth || !video.videoHeight) {
      console.warn("비디오 준비 중...");
      return;
    }

    // 캡처
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 간단한 "가짜 AI 결과" 생성 (임시용)
    const kcal = 80 + Math.floor(Math.random() * 120);
    const carb = 10 + Math.floor(Math.random() * 30);
    const protein = 3 + Math.floor(Math.random() * 15);
    const fat = 2 + Math.floor(Math.random() * 10);

    // 코칭 문구
    let coaching = "";
    if (kcal < 150) {
      coaching = "가벼운 간식 수준이에요. 좋은 선택입니다 👍";
    } else if (kcal < 220) {
      coaching = "적당한 한 끼로 괜찮아요. 다른 끼니는 조금 가볍게 조절해 보세요 🙂";
    } else {
      coaching = "칼로리가 조금 높은 편이에요. 내일은 야채/단백질 비중을 늘려보면 좋아요 💪";
    }

    resultContainer.innerHTML = `
      <div class="result-kcal">${kcal} kcal</div>
      <div class="result-macro">
        탄수화물 <span>${carb} g</span> ·
        단백질 <span>${protein} g</span> ·
        지방 <span>${fat} g</span>
      </div>
      <p class="result-coaching">${coaching}</p>
    `;

    // 무료 사용 횟수 증가
    const newUsed = used + 1;
    setUsedShots(newUsed);
    updateFreeBadge();
  });

  // 페이지 첫 진입 시에도 뱃지 갱신
  updateFreeBadge();
}

// =====================================
// 3. 사용법 모달(guideModal) 닫기
// =====================================
function initGuideModal() {
  const guideModal = document.getElementById("guideModal");
  const guideCloseBtn = document.getElementById("guideCloseBtn");

  if (!guideModal || !guideCloseBtn) return;

  // 닫기 버튼
  guideCloseBtn.addEventListener("click", () => {
    guideModal.style.display = "none";
  });

  // 검은 배경 클릭 시 닫기
  guideModal.addEventListener("click", (event) => {
    if (event.target === guideModal) {
      guideModal.style.display = "none";
    }
  });
}

// =====================================
// 4. 구독 모달 관련 (HTML에서 onclick으로 호출)
// =====================================
window.closeSubscribeModal = function () {
  const subModal = document.getElementById("subscribeModal");
  if (subModal) {
    subModal.style.display = "none";
  }
};

window.selectPlan = function (plan) {
  // 실제 결제 연동 대신, 지금은 안내/테스트용
  let label = "";
  if (plan === "lite") label = "Lite · 월 2,900원";
  else if (plan === "pro") label = "Pro · 월 4,900원 (추천)";
  else if (plan === "family") label = "Family · 월 8,900원";

  alert(`${label} 구독 플랜을 선택하셨습니다. (실제 결제 연동은 아직입니다 🙂)`);

  // 선택 후 모달 닫기
  closeSubscribeModal();
};

// =====================================
// 5. 페이지 로드 후 한 번에 초기화
// =====================================
window.addEventListener("load", () => {
  initGuideModal();
  initCameraAndCapture();
});
