function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),              // 타임스탬프
    data.name,               // 성명
    data.affiliationType,            // 소속분류
    data.orgName,            // 소속명
    data.position,           // 직위
    data.phone,              // 연락처
    data.email,              // 이메일
    (data.sessions || []).join(", "),  // 참여세션 (체크박스 배열 → 문자열)
    data.consent             // 동의여부
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}