// app.js - SmartCal AI 프론트엔드 (튜토리얼 닫기 + 3회 무료 + 구독 팝업 + QR 연동 준비)

// ---------------- 공통 상수 ----------------
const MAX_FREE_SHOTS = 3;
const STORAGE_KEYS = {
  SHOTS: "sc_used_shots",
  TUTORIAL_SEEN: "sc_tutorial_seen"
};

document.addEventListener("DOMContentLoaded", () => {
  // ---- DOM 요소 찾기 ----
  const video = document.getElementById("camera");          // 카메라 <video>
  const canvas = document.createElement("canvas");          // 캡처용 숨김 캔버스
  const captureBtn = document.getElementById("capture-btn");// 촬영 버튼
  const freeBadge = document.getElementById("free-status"); // 상단 "3회 중 n회" 텍스트

  const resultKcal = document.getElementById("result-kcal");
  const resultCarb = document.getElementById("result-carb");
  const resultProtein = document.getElementById("result-protein");
  const resultFat = document.getElementById("result-fat");
  const coachingText = document.getElementById("coaching-text");

  const tutorialOverlay = document.getElementById("tutorial-overlay"); // 사용법 팝업 전체
  const tutorialCloseBtn = document.getElementById("tutorial-close-btn"); // "닫기" 버튼

  const subscribeModal = document.getElementById("subscribe-modal"); // 구독 팝업 전체
  const subscribeCloseBtn = document.getElementById("subscribe-close-btn"); // "나중에 생각할게요" 버튼

  // 요소가 없으면 조용히 빠져나가기 (에러 방지)
  if (!video || !captureBtn) {
    console.warn("필수 DOM 요소를 찾지 못했습니다. HTML id들을 다시 확인해 주세요.");
    return;
  }

  // ---- 3회 무료 사용 횟수 불러오기 ----
  let usedShots = Number(localStorage.getItem(STORAGE_KEYS.SHOTS) || "0");
  if (usedShots < 0 || Number.isNaN(usedShots)) usedShots = 0;
  updateFreeBadge();

  // ---- 튜토리얼 (SmartCal AI 사용법) 표시/닫기 ----
  initTutorialOverlay();

  // ---- 카메라 시작 ----
  startCamera(video);

  // ---- 촬영 버튼 클릭 이벤트 ----
  captureBtn.addEventListener("click", async () => {
    // 1) 무료 횟수 초과 시 구독 팝업
    if (usedShots >= MAX_FREE_SHOTS) {
      openSubscribeModal();
      return;
    }

    // 2) 화면 캡처 (추후 YOLO 서버에 보낼 이미지)
    const imageBase64 = await captureFrame(video, canvas);

    // 3) 실제 YOLO 서버 호출 자리에 오게 될 부분
    //    지금은 예시용 "더미 분석"으로 동작 → 나중에 API 붙이면 이 부분만 교체
    const analysis = await dummyAnalyze(imageBase64);

    // 4) 결과 화면에 반영
    renderResult(analysis);

    // 5) 사용 횟수 증가 & 저장
    usedShots += 1;
    localStorage.setItem(STORAGE_KEYS.SHOTS, String(usedShots));
    updateFreeBadge();

    // 6) 무료 횟수 다 쓰면 구독 팝업 자동 표시
    if (usedShots >= MAX_FREE_SHOTS) {
      openSubscribeModal();
    }
  });

  // ---- 구독 팝업 닫기 버튼 ----
  if (subscribeCloseBtn && subscribeModal) {
    subscribeCloseBtn.addEventListener("click", () => {
      subscribeModal.classList.add("hidden");
    });
  }

  // ---------------- 함수 정의들 ----------------

  function updateFreeBadge() {
    // 상단에 "n / 3 · 무료 체험 · 남은 촬영 0회(총 3회)" 이런 느낌으로 보여주는 텍스트
    if (!freeBadge) return;
    const left = Math.max(MAX_FREE_SHOTS - usedShots, 0);
    freeBadge.textContent = `${usedShots} / ${MAX_FREE_SHOTS} · 무료 체험 · 남은 촬영 ${left}회 (총 ${MAX_FREE_SHOTS}회)`;
  }

  function initTutorialOverlay() {
    if (!tutorialOverlay || !tutorialCloseBtn) return;

    const alreadySeen = localStorage.getItem(STORAGE_KEYS.TUTORIAL_SEEN) === "1";

    if (alreadySeen) {
      tutorialOverlay.classList.add("hidden");
    } else {
      tutorialOverlay.classList.remove("hidden");
    }

    // ★ 여기서 확실히 닫기 이벤트 연결
    tutorialCloseBtn.addEventListener("click", () => {
      tutorialOverlay.classList.add("hidden");
      localStorage.setItem(STORAGE_KEYS.TUTORIAL_SEEN, "1");
    });
  }

  function startCamera(videoEl) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("이 브라우저에서는 카메라를 사용할 수 없습니다.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        videoEl.srcObject = stream;
        videoEl.play();
      })
      .catch((err) => {
        console.error("카메라 접근 오류:", err);
        alert("카메라 권한을 허용해 주세요.");
      });
  }

  async function captureFrame(videoEl, canvasEl) {
    const w = videoEl.videoWidth || 640;
    const h = videoEl.videoHeight || 480;
    canvasEl.width = w;
    canvasEl.height = h;

    const ctx = canvasEl.getContext("2d");
    ctx.drawImage(videoEl, 0, 0, w, h);

    // dataURL 형식 (추후 서버로 전송 가능)
    const dataUrl = canvasEl.toDataURL("image/jpeg", 0.85);
    return dataUrl;
  }

  // ---- 실제 YOLO/칼로리 서버가 오기 전까지 사용할 "예시 분석" ----
  // 나중에 여기를 callSmartCalApi(imageBase64) 같은 함수로 교체하면 됩니다.
  async function dummyAnalyze(imageBase64) {
    // QR로 들어온 매장/테이블 정보 (URL 파라미터)
    const params = new URLSearchParams(window.location.search);
    const place = params.get("place") || "demo";
    const table = params.get("table") || "1";

    console.log("임시 분석 실행 (실제 서버 자리)", { place, table, imageLen: imageBase64.length });

    // 지금은 "사과 1개" 예시값을 사용 (실제 사용 흐름 확인용)
    return {
      foodName: "사과 1개",
      total: {
        calories: 95,
        carbs: 25,
        protein: 0.5,
        fat: 0.3
      },
      coaching: "자연식 위주, 아주 좋아요 🍎\n오늘도 이렇게 가볍게 시작해 볼까요?"
    };
  }

  function renderResult(analysis) {
    if (!analysis || !analysis.total) return;
    const t = analysis.total;

    if (resultKcal) resultKcal.textContent = `${Math.round(t.calories)} kcal`;
    if (resultCarb) resultCarb.textContent = `${t.carbs} g`;
    if (resultProtein) resultProtein.textContent = `${t.protein} g`;
    if (resultFat) resultFat.textContent = `${t.fat} g`;

    if (coachingText) {
      coachingText.textContent = analysis.coaching || "오늘 식단도 잘 선택하셨어요! 😊";
    }
  }

  function openSubscribeModal() {
    if (!subscribeModal) return;
    subscribeModal.classList.remove("hidden");
  }

});

// ============================
// 사용법 팝업(guideModal) 닫기 안전 장치
// ============================
window.addEventListener('load', () => {
  const guideModal = document.getElementById('guideModal');
  const guideCloseBtn = document.getElementById('guideCloseBtn');

  // 혹시 요소가 없으면 그냥 리턴
  if (!guideModal || !guideCloseBtn) return;

  // 1) "닫기" 버튼 클릭 시 팝업 숨기기
  guideCloseBtn.addEventListener('click', () => {
    guideModal.style.display = 'none';
  });

  // 2) 검은 배경(바깥쪽)을 클릭해도 닫히게 하고 싶다면
  guideModal.addEventListener('click', (event) => {
    // 바깥(overlay) 영역만 클릭했을 때만 닫기
    if (event.target === guideModal) {
      guideModal.style.display = 'none';
    }
  });
});
