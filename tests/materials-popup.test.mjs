import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import test from "node:test";
import sharp from "sharp";

const source = fs.readFileSync(new URL("../src/components/MaterialsPopup.tsx", import.meta.url), "utf8");

test("materials popup preserves the supplied JPEG and intrinsic dimensions", async () => {
  const bytes = fs.readFileSync(new URL("../public/images/popup.jpg", import.meta.url));
  assert.equal(bytes.subarray(0, 3).toString("hex"), "ffd8ff");
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), "c4594a729432d1b976cfbce9c53c494caa3ab5642a00f20775bce493b9ef3ce7");
  const metadata = await sharp(bytes).metadata();
  assert.deepEqual([metadata.format, metadata.width, metadata.height], ["jpeg", 1668, 2501]);
  await sharp(bytes).stats();
  assert.match(source, /width=\{1668\}/);
  assert.match(source, /height=\{2501\}/);
  assert.match(source, /unoptimized/);
  assert.match(source, /h-auto w-full object-contain/);
});

test("popup uses a native modal with two dismiss controls and scroll cleanup", () => {
  assert.match(source, /dialog\.showModal\(\)/);
  assert.match(source, /<dialog/);
  assert.match(source, /aria-labelledby="materials-popup-heading"/);
  assert.match(source, /<form method="dialog">/);
  assert.equal((source.match(/type="submit"/g) || []).length, 2);
  assert.match(source, /aria-label="팝업 닫기"/);
  assert.match(source, /확인/);
  assert.match(source, /addEventListener\("close", restoreScroll\)/);
  assert.match(source, /removeEventListener\("close", restoreScroll\)/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage/);
  assert.match(source, /event.key !== "Tab"/);
  assert.match(source, /last.focus\(\)/);
  assert.match(source, /first.focus\(\)/);
  const page = fs.readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  assert.equal((page.match(/<MaterialsPopup \/>/g) || []).length, 1);
});
