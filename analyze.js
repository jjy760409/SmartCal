// netlify/functions/analyze.js
// SmartCal AI 서버 함수 (1단계 데모 버전)
// 나중에 여기 내부만 YOLO 분석으로 교체하면 됨

exports.handler = async (event, context) => {
  const defaultHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  };

  // CORS 사전 요청 처리
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

    // TODO: 여기서 data URL → base64 → YOLO 모델로 분석 예정

    const demoFoods = [
      { foodName: "김밥(1줄)", calories: 320, note: "일반적인 김밥 1줄 기준 대략적인 칼로리입니다." },
      { foodName: "치킨(한 조각)", calories: 250, note: "조리 방법에 따라 실제 칼로리는 달라질 수 있어요." },
      { foodName: "햄버거(1개)", calories: 450, note: "소스와 사이즈에 따라 차이가 큽니다." },
      { foodName: "샐러드(1그릇)", calories: 110, note: "드레싱을 많이 넣으면 칼로리가 올라갑니다." },
      { foodName: "라면(1봉지)", calories: 500, note: "국물을 덜 마시면 칼로리를 조금 줄일 수 있어요." },
      { foodName: "초콜릿(1조각)", calories: 60, note: "당분 섭취를 조절하면서 드시는 걸 추천합니다." }
    ];
    const result = demoFoods[Math.floor(Math.random() * demoFoods.length)];

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify(result)
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
