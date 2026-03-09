const q = new URLSearchParams(window.location.search);

const el = {
  gross: document.getElementById("iGross"),
  grossRange: document.getElementById("iGrossRange"),
  insurance: document.getElementById("iInsurance"),
  insuranceRange: document.getElementById("iInsuranceRange"),
  deduction: document.getElementById("iDeduction"),
  deductionRange: document.getElementById("iDeductionRange"),
  mortgage: document.getElementById("iMortgage"),
  mortgageRange: document.getElementById("iMortgageRange"),
  error: document.getElementById("iError"),
  net: document.getElementById("iNet"),
  tax: document.getElementById("iTax"),
  remain: document.getElementById("iRemain"),
  hint: document.getElementById("iHint"),
};

function yuan(v) {
  return `${Math.round(v).toLocaleString("zh-CN")} 元`;
}

function taxRateAndQuick(monthlyTaxable) {
  const annual = monthlyTaxable * 12;
  if (annual <= 36000) return { rate: 0.03, quick: 0 };
  if (annual <= 144000) return { rate: 0.1, quick: 2520 };
  if (annual <= 300000) return { rate: 0.2, quick: 16920 };
  if (annual <= 420000) return { rate: 0.25, quick: 31920 };
  if (annual <= 660000) return { rate: 0.3, quick: 52920 };
  if (annual <= 960000) return { rate: 0.35, quick: 85920 };
  return { rate: 0.45, quick: 181920 };
}

function update() {
  const gross = Number(el.gross.value);
  const insuranceRate = Number(el.insurance.value) / 100;
  const deduction = Number(el.deduction.value);
  const mortgage = Number(el.mortgage.value);

  if ([gross, insuranceRate, deduction, mortgage].some((x) => !Number.isFinite(x))) {
    el.error.textContent = "参数还没填完整哦。";
    return;
  }

  if (gross < 0 || insuranceRate < 0 || deduction < 0 || mortgage < 0) {
    el.error.textContent = "金额和比例不能为负。";
    return;
  }

  el.error.textContent = "";

  const insurance = gross * insuranceRate;
  const taxableMonthly = Math.max(gross - insurance - 5000 - deduction, 0);
  const bracket = taxRateAndQuick(taxableMonthly);
  const annualTax = taxableMonthly * 12 * bracket.rate - bracket.quick;
  const monthlyTax = Math.max(annualTax / 12, 0);

  const net = gross - insurance - monthlyTax;
  const remain = net - mortgage;

  el.net.textContent = yuan(net);
  el.tax.textContent = yuan(monthlyTax);
  el.remain.textContent = yuan(remain);

  el.remain.className = "metric-value";
  if (remain >= 4000) {
    el.remain.classList.add("ok");
    el.hint.textContent = `税后收入 ${yuan(net)}，扣除月供 ${yuan(mortgage)}，每月还能剩 ${yuan(remain)}，压力可控。`;
  } else if (remain >= 0) {
    el.hint.textContent = `税后收入 ${yuan(net)}，扣除月供 ${yuan(mortgage)} 后仅剩 ${yuan(remain)}，建议再留一点安全垫。`;
  } else {
    el.remain.classList.add("warn");
    el.hint.textContent = `月供超出当前税后结余 ${yuan(Math.abs(remain))}，建议先降预算或延长贷款年限。`;
  }
}

el.mortgage.value = q.get("monthlyPayment") || "0";
el.grossRange.value = el.gross.value;
el.insuranceRange.value = el.insurance.value;
el.deductionRange.value = el.deduction.value;
el.mortgageRange.value = el.mortgage.value;

update();
[el.gross, el.insurance, el.deduction, el.mortgage].forEach((node) => {
  node.addEventListener("input", update);
});

el.gross.addEventListener("input", () => {
  const v = Number(el.gross.value);
  el.grossRange.value = String(Number.isFinite(v) ? Math.max(0, Math.min(200000, v)) : 0);
});

el.grossRange.addEventListener("input", () => {
  el.gross.value = el.grossRange.value;
  update();
});

el.insurance.addEventListener("input", () => {
  const v = Number(el.insurance.value);
  el.insuranceRange.value = String(Number.isFinite(v) ? Math.max(0, Math.min(30, v)) : 0);
});

el.insuranceRange.addEventListener("input", () => {
  el.insurance.value = el.insuranceRange.value;
  update();
});

el.deduction.addEventListener("input", () => {
  const v = Number(el.deduction.value);
  el.deductionRange.value = String(Number.isFinite(v) ? Math.max(0, Math.min(20000, v)) : 0);
});

el.deductionRange.addEventListener("input", () => {
  el.deduction.value = el.deductionRange.value;
  update();
});

el.mortgage.addEventListener("input", () => {
  const v = Number(el.mortgage.value);
  el.mortgageRange.value = String(Number.isFinite(v) ? Math.max(0, Math.min(100000, v)) : 0);
});

el.mortgageRange.addEventListener("input", () => {
  el.mortgage.value = el.mortgageRange.value;
  update();
});
