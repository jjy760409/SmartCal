/* 기본 설정 */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: #020617;
  color: #e5e7eb;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}

.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 헤더 */
.app-header {
  width: 100%;
  max-width: 640px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
}

.logo-text {
  font-weight: 700;
  font-size: 18px;
  color: #f9fafb;
}

.free-badge {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #022c22;
  color: #a7f3d0;
  font-size: 13px;
}

/* 메인 영역 */
.app-main {
  width: 100%;
  max-width: 640px;
  padding: 0 16px 24px;
}

/* 카메라 카드 */
.camera-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  background: #020617;
  border: 1px solid #0f172a;
}

#camera {
  width: 100%;
  height: auto;
  display: block;
}

/* 가운데 가이드 박스 */
.camera-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.camera-guide-box {
  width: 70%;
  max-width: 360px;
  aspect-ratio: 1 / 1;
  border-radius: 24px;
  border: 3px solid rgba(248, 250, 252, 0.9);
  box-shadow: 0 0 40px rgba(15, 23, 42, 0.9);
}

/* 촬영 버튼 */
.snap-button {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  padding: 14px 32px;
  border-radius: 999px;
  border: none;
  background: #22c55e;
  color: #052e16;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(34, 197, 94, 0.6);
}

/* 카메라 전환 버튼 */
.secondary-btn {
  position: absolute;
  left: 16px;
  bottom: 16px;
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  background: rgba(15, 23, 42, 0.8);
  color: #e5e7eb;
  font-size: 12px;
  cursor: pointer;
}

/* 결과 영역 */
.result-container {
  margin-top: 16px;
  padding: 16px 18px 18px;
  border-radius: 18px;
  background: #020617;
  border: 1px solid #0f172a;
}

.result-kcal {
  font-size: 24px;
  font-weight: 700;
  color: #facc15;
}

.result-nutrients {
  margin-top: 6px;
  font-size: 14px;
  color: #9ca3af;
}

.coaching-text {
  margin-top: 10px;
  font-size: 14px;
  color: #d1fae5;
}

/* 공통 모달 오버레이 */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.7);
  z-index: 1000;
  /* 여기 중요! 오버레이가 클릭을 받도록 */
  pointer-events: auto;
}

/* 모달 대화상자 */
.modal-dialog {
  width: calc(100% - 40px);
  max-width: 360px;
  background: #020617;
  border-radius: 18px;
  padding: 20px 22px 18px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.9);
  border: 1px solid #1e293b;
}

.modal-dialog h2 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #f9fafb;
}

.guide-list {
  margin: 0 0 18px 18px;
  padding: 0;
  color: #e5e7eb;
  font-size: 14px;
}

.guide-list li {
  margin-bottom: 4px;
}

/* 버튼 스타일 */
.primary-btn,
.plan-btn,
.modal-close {
  border-radius: 999px;
  border: none;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
}

.primary-btn {
  width: 100%;
  background: #22c55e;
  color: #052e16;
  font-weight: 700;
}

/* 구독 모달 */
.modal-desc {
  font-size: 14px;
  color: #e5e7eb;
  margin-bottom: 14px;
}

.modal-plan-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.plan-btn {
  width: 100%;
  background: #0f172a;
  color: #e5e7eb;
}

.plan-btn.primary {
  background: #22c55e;
  color: #052e16;
  font-weight: 700;
}

.modal-close {
  width: 100%;
  background: transparent;
  color: #9ca3af;
}

/* 로딩 오버레이 */
.loading-overlay {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.7);
  z-index: 1100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 4px solid rgba(148, 163, 184, 0.5);
  border-top-color: #22c55e;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  font-size: 14px;
  color: #e5e7eb;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 모바일 최적화 */
@media (max-width: 480px) {
  .camera-card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
