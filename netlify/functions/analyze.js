// netlify/functions/analyze.js
// SmartCal AI 서버 함수 (다중 음식 데모 버전)
// - 프론트에서 base64 data URL을 받는다 (body.image)
// - 임시로 여러 개 음식 결과를 랜덤으로 만든다
// - 나중에 이 부분만 YOLO/AI 분석 코드로 교체하면 됨

exports.handler = async (event, context) => {
  const defaultHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  };

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        ...defaultHeaders,
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const imageDataUrl = body.image;

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: JSON.stringify({ error: "image field is required" })
      };
    }

    // TODO: 여기에서 data URL → base64 분리 → YOLO/AI 모델 분석 예정

    // ── 데모용 음식 목록 ──
    const foodCandidates = [
      { foodName: "김밥(1줄)", calories: 320 },
      { foodName: "치킨(한 조각)", calories: 250 },
      { foodName: "햄버거(1개)", calories: 450 },
      { foodName: "샐러드(1그릇)", calories: 110 },
      { foodName: "라면(1봉지)", calories: 500 },
      { foodName: "초콜릿(1조각)", calories: 60 }
    ];

    // 1~3개 랜덤 선택 (중복 없이)
    const count = Math.floor(Math.random() * 3) + 1; // 1,2,3 중 하나
    const shuffled = [...foodCandidates].sort(() => Math.random() - 0.5);
    const items = shuffled.slice(0, count);

    const totalCalories = items.reduce(
      (sum, item) => sum + (item.calories || 0),
      0
    );

    const note =
      count === 1
        ? "단일 음식에 대한 데모 분석 결과입니다."
        : "여러 음식을 함께 인식한 데모 분석 결과입니다. 실제 YOLO 모델 연결 시 보다 정확한 결과가 제공됩니다.";

    const responseBody = {
      items,          // [{ foodName, calories }, ...]
      totalCalories,  // 합산 칼로리
      note            // 전체 설명
    };

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify(responseBody)
    };
  } catch (err) {
    console.error("Analyze function error:", err);
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
