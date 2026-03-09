const q = new URLSearchParams(window.location.search);

const el = {
  housePrice: document.getElementById("mHousePrice"),
  downRatio: document.getElementById("mDownRatio"),
  years: document.getElementById("mYears"),
  rate: document.getElementById("mRate"),
  error: document.getElementById("mError"),
  monthly: document.getElementById("mMonthly"),
  totalPay: document.getElementById("mTotalPay"),
  downPayment: document.getElementById("mDownPayment"),
  encourage: document.getElementById("mEncourage"),
  target: document.getElementById("mTarget"),
  targetInput: document.getElementById("mTargetInput"),
  targetRange: document.getElementById("mTargetRange"),
  saveYears: document.getElementById("mSaveYears"),
  saveYearsText: document.getElementById("mSaveYearsText"),
  needPerMonth: document.getElementById("mNeedPerMonth"),
  saveMonthly: document.getElementById("mSaveMonthly"),
  saveMonthlyText: document.getElementById("mSaveMonthlyText"),
  needMonths: document.getElementById("mNeedMonths"),
  tip: document.getElementById("mTip"),
};

function setDefaults() {
  el.housePrice.value = q.get("housePrice") || "180";
  el.downRatio.value = q.get("downPaymentRatio") || "30";
  el.years.value = q.get("loanYears") || "30";
  el.rate.value = q.get("loanRate") || "4.2";
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function normalizeStep(value, step) {
  return Math.round(value / step) * step;
}

function formatYuan(v) {
  return `${Math.round(v).toLocaleString("zh-CN")} 元`;
}

function payment(principal, years, annualRate) {
  const n = years * 12;
  const r = annualRate / 100 / 12;
  if (n <= 0) return 0;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

function renderSaving(targetAmount) {
  const months = Number(el.saveYears.value);
  const monthlySave = Number(el.saveMonthly.value);
  const yearsPart = Math.floor(months / 12);
  const monthsPart = months % 12;
  const needPerMonth = targetAmount / months;
  const needMonths = monthlySave > 0 ? Math.ceil(targetAmount / monthlySave) : 0;
  const needYears = needMonths / 12;

  el.target.textContent = formatYuan(targetAmount);
  el.saveYearsText.textContent = `当前选择：${yearsPart}年${monthsPart}个月（共${months}个月）`;
  el.needPerMonth.textContent = `${Math.round(needPerMonth).toLocaleString("zh-CN")} 元/月`;
  el.saveMonthlyText.textContent = `当前：每月 ${monthlySave.toLocaleString("zh-CN")} 元`;
  el.needMonths.textContent = `${needMonths} 个月（约 ${needYears.toFixed(1)} 年）`;

  if (needPerMonth <= 2500) {
    el.tip.textContent = "💡 每天少喝一杯奶茶，每月能多存约 450 元。";
  } else if (needPerMonth <= 4500) {
    el.tip.textContent = "💡 试试每周多做几次饭，每月可多省 600 元左右。";
  } else {
    el.tip.textContent = "💡 目标有点高，延长周期或增加收入会更稳。";
  }
}

function syncPlannerSlidersByTarget(targetAmount) {
  const safeTarget = clamp(targetAmount, 0, 5000000);
  const recommendedMonths = clamp(Math.round(safeTarget / 10000), 1, 600);
  const monthlyBaseline = safeTarget / 96;
  const recommendedMonthly = clamp(normalizeStep(monthlyBaseline, 100), 1000, 100000);

  el.saveYears.value = String(recommendedMonths);
  el.saveMonthly.value = String(recommendedMonthly);
}

function update() {
  const housePrice = Number(el.housePrice.value);
  const downRatio = Number(el.downRatio.value);
  const years = Number(el.years.value);
  const rate = Number(el.rate.value);

  if ([housePrice, downRatio, years, rate].some((x) => !Number.isFinite(x))) {
    el.error.textContent = "参数还没填完整哦。";
    return;
  }
  if (housePrice < 0 || downRatio < 0 || years <= 0 || rate < 0) {
    el.error.textContent = "参数不能为负，贷款年限需要大于 0。";
    return;
  }
  el.error.textContent = "";

  const priceYuan = housePrice * 10000;
  const autoDownPayment = priceYuan * (downRatio / 100);
  const principal = priceYuan - autoDownPayment;
  const m = payment(principal, years, rate);
  const totalPay = m * years * 12;

  const rawTarget = Number(el.targetInput.value);
  const targetAmount = Number.isFinite(rawTarget) ? clamp(rawTarget, 0, 5000000) : autoDownPayment;
  el.targetInput.value = String(Math.round(targetAmount));
  el.targetRange.value = String(Math.round(targetAmount));

  el.monthly.textContent = formatYuan(m) + "/月";
  el.totalPay.textContent = formatYuan(totalPay);
  el.downPayment.textContent = formatYuan(autoDownPayment);
  el.encourage.textContent =
    m > 10000
      ? "月供压力偏大，先把现金流算稳，你会更安心。"
      : "这个月供区间可控，继续保持这份规划感。";

  renderSaving(targetAmount);
}

setDefaults();
const initialTarget = clamp(Number(q.get("downPayment") || 0), 0, 5000000);
el.targetInput.value = String(initialTarget || 500000);
el.targetRange.value = String(initialTarget || 500000);
syncPlannerSlidersByTarget(Number(el.targetInput.value));
update();

[el.housePrice, el.downRatio, el.years, el.rate].forEach((node) => {
  node.addEventListener("input", update);
});
el.saveYears.addEventListener("input", update);
el.saveMonthly.addEventListener("input", update);
el.targetInput.addEventListener("input", () => {
  const target = clamp(Number(el.targetInput.value) || 0, 0, 5000000);
  el.targetInput.value = String(target);
  el.targetRange.value = String(target);
  syncPlannerSlidersByTarget(target);
  update();
});
el.targetRange.addEventListener("input", () => {
  const target = clamp(Number(el.targetRange.value) || 0, 0, 5000000);
  el.targetInput.value = String(target);
  el.targetRange.value = String(target);
  syncPlannerSlidersByTarget(target);
  update();
});
