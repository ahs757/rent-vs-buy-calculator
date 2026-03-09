const defaults = {
  housePrice: 0,
  downPaymentRatio: 0,
  loanYears: 0,
  loanRate: 0,
  monthlyRent: 0,
  rentGrowth: 0,
  monthlyPropertyFee: 0,
  annualMaintenance: 0,
  holdingYears: 0,
  priceGrowth: 0,
};

const fieldOrder = [
  "housePrice",
  "downPaymentRatio",
  "loanYears",
  "loanRate",
  "monthlyRent",
  "rentGrowth",
  "monthlyPropertyFee",
  "annualMaintenance",
  "holdingYears",
  "priceGrowth",
];

const refs = {
  form: document.getElementById("calc-form"),
  error: document.getElementById("error-msg"),
  summary: document.getElementById("summary"),
  buyCost: document.getElementById("buyCost"),
  rentCost: document.getElementById("rentCost"),
  buyMonthlyCost: document.getElementById("buyMonthlyCost"),
  rentMonthlyCost: document.getElementById("rentMonthlyCost"),
  breakEvenText: document.getElementById("breakEvenText"),
  advice: document.getElementById("advice"),
  buyBar: document.getElementById("buyBar"),
  rentBar: document.getElementById("rentBar"),
  resultCard: document.getElementById("result-card"),
  nextHint: document.getElementById("nextHint"),
  btnMortgage: document.getElementById("btnMortgage"),
  btnIncome: document.getElementById("btnIncome"),
  glanceSummary: document.getElementById("glanceSummary"),
  glanceBuy: document.getElementById("glanceBuy"),
  glanceRent: document.getElementById("glanceRent"),
  glanceDiff: document.getElementById("glanceDiff"),
  glanceBreakEven: document.getElementById("glanceBreakEven"),
};

let latestData = null;
let latestResult = null;

function num(v) {
  return Number.parseFloat(v);
}

function safePow(base, exp) {
  if (base <= 0) return 0;
  return Math.pow(base, exp);
}

function mortgagePayment(principal, years, annualRate) {
  const n = years * 12;
  if (n <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

function remainingPrincipal(principal, years, annualRate, paidMonths) {
  const n = years * 12;
  const k = Math.min(Math.max(paidMonths, 0), n);
  if (n <= 0 || k >= n) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal * (1 - k / n);
  const factorN = Math.pow(1 + r, n);
  const factorK = Math.pow(1 + r, k);
  return principal * ((factorN - factorK) / (factorN - 1));
}

function rentTotalCost(monthlyRent, annualGrowth, years) {
  const annualBase = monthlyRent * 12;
  const g = annualGrowth / 100;
  if (years <= 0) return 0;
  if (g === 0) return annualBase * years;
  return annualBase * ((Math.pow(1 + g, years) - 1) / g);
}

function calcForYears(params, years) {
  const housePriceYuan = params.housePrice * 10000;
  const downRatio = params.downPaymentRatio / 100;
  const loanPrincipal = housePriceYuan * (1 - downRatio);
  const downPayment = housePriceYuan * downRatio;

  const monthlyPayment = mortgagePayment(loanPrincipal, params.loanYears, params.loanRate);
  const holdMonths = Math.min(years * 12, params.loanYears * 12);
  const paidInstallments = monthlyPayment * holdMonths;
  const remainLoan = remainingPrincipal(loanPrincipal, params.loanYears, params.loanRate, holdMonths);

  const tax = housePriceYuan * 0.015;
  const propertyFee = params.monthlyPropertyFee * 12 * years;
  const maintenance = params.annualMaintenance * years;
  const salePrice = housePriceYuan * safePow(1 + params.priceGrowth / 100, years);
  const saleNet = salePrice - remainLoan;

  const buyTotal = downPayment + paidInstallments + tax + propertyFee + maintenance - saleNet;
  const rentTotal = rentTotalCost(params.monthlyRent, params.rentGrowth, years);

  return {
    buyTotal,
    rentTotal,
    buyMonthlyAvg: years > 0 ? buyTotal / (years * 12) : 0,
    rentMonthlyAvg: years > 0 ? rentTotal / (years * 12) : 0,
    monthlyPayment,
    downPayment,
  };
}

function findBreakEven(params, maxYears = 40) {
  for (let y = 1; y <= maxYears; y += 1) {
    const c = calcForYears(params, y);
    if (c.buyTotal <= c.rentTotal) return y;
  }
  return null;
}

function formatWan(valueYuan) {
  return `${(valueYuan / 10000).toFixed(2)} 万元`;
}

function formatYuanPerMonth(value) {
  return `${Math.round(value).toLocaleString("zh-CN")} 元/月`;
}

function formatYuan(value) {
  return `${Math.round(value).toLocaleString("zh-CN")} 元`;
}

function getInputs() {
  const data = {};
  for (const key of fieldOrder) data[key] = num(document.getElementById(key).value);
  return data;
}

function validate(data) {
  for (const key of fieldOrder) {
    const value = data[key];
    if (!Number.isFinite(value)) return "这里还空着呢，填上才能算得准～";
    if (value < 0 && key !== "priceGrowth") return "金额不能为负哦，重新填一下吧～";
  }

  if (data.downPaymentRatio < 0 || data.downPaymentRatio > 90) return "首付比例建议在 0% 到 90% 之间。";
  if (data.loanYears < 1 || data.loanYears > 100) return "贷款年限建议在 1 到 100 年之间。";
  if (data.holdingYears < 1 || data.holdingYears > 100) return "预计持有年限建议在 1 到 100 年之间。";
  if (data.priceGrowth < -5 || data.priceGrowth > 10) return "房价年涨幅预期建议在 -5% 到 10% 之间。";
  return "";
}

function setBars(buyTotal, rentTotal) {
  const maxVal = Math.max(Math.abs(buyTotal), Math.abs(rentTotal), 1);
  refs.buyBar.style.width = `${(Math.abs(buyTotal) / maxVal) * 100}%`;
  refs.rentBar.style.width = `${(Math.abs(rentTotal) / maxVal) * 100}%`;
}

function setCostStyles(buyTotal, rentTotal) {
  refs.buyCost.className = "metric-value";
  refs.rentCost.className = "metric-value";
  if (buyTotal < rentTotal) {
    refs.buyCost.classList.add("ok");
    refs.rentCost.classList.add("warn");
  } else if (buyTotal > rentTotal) {
    refs.buyCost.classList.add("warn");
    refs.rentCost.classList.add("ok");
  }
}

function generateSummary(data, result) {
  const diff = Math.abs(result.buyTotal - result.rentTotal) / 10000;
  if (result.buyTotal + 1000 < result.rentTotal) {
    return `哇，住到第 ${data.holdingYears} 年，买房更划算，大约能省 ${diff.toFixed(2)} 万元。`;
  }
  if (result.rentTotal + 1000 < result.buyTotal) {
    return `如果只住 ${data.holdingYears} 年，租房更省钱，预计可少花 ${diff.toFixed(2)} 万元。`;
  }
  return `住 ${data.holdingYears} 年，两种方案总成本很接近，关键看你更看重稳定还是灵活。`;
}

function generateAdvice(data, result, breakEvenYear) {
  const conclusion = result.buyTotal <= result.rentTotal ? "结论：按你当前计划，买房更占优。" : "结论：按你当前计划，租房更省钱。";
  const support = `数据：买房约 ${formatWan(result.buyTotal)}，租房约 ${formatWan(result.rentTotal)}。`;
  const emotional = data.downPaymentRatio < 20
    ? "别焦虑，我们先把首付目标拆小，一步步推进就会越来越稳。"
    : "无论租还是买，目标都是更好的生活，你已经在认真做决定了。";
  const breakEvenText = breakEvenYear === null
    ? "按当前参数，长期也未必能跑赢租房。"
    : `盈亏平衡点大约在第 ${breakEvenYear} 年。`;
  return `${conclusion} ${support} ${breakEvenText} ${emotional}`;
}

function renderBreakEven(data, breakEvenYear) {
  if (breakEvenYear === null) {
    refs.breakEvenText.textContent = "🔍 按照你的预期，可能一直租房更合适。";
    return;
  }
  if (breakEvenYear <= data.holdingYears) {
    refs.breakEvenText.textContent = `🔍 大概持有 ${breakEvenYear} 年后，买房开始比租房划算。`;
  } else {
    refs.breakEvenText.textContent = "🔍 按你现在的计划，一直租房更省钱。";
  }
}

function saveState(data) {
  localStorage.setItem("rent-buy-calculator", JSON.stringify(data));
}

function flashResultCard() {
  if (!refs.resultCard) return;
  refs.resultCard.classList.remove("flash");
  void refs.resultCard.offsetWidth;
  refs.resultCard.classList.add("flash");
}

function syncRangeAndInput(targetId, value) {
  const input = document.getElementById(targetId);
  const range = document.querySelector(`input[type="range"][data-sync="${targetId}"]`);
  if (input) input.value = value;
  if (range) range.value = value;
}

function updateNextActions(data, result, breakEvenYear) {
  if (!refs.nextHint) return;

  let hint = "基于你的决策，建议先算清月供和收入，再做决定更稳妥。";
  if (data.holdingYears <= 5 || (breakEvenYear !== null && data.holdingYears < breakEvenYear)) {
    hint = "既然短期租房更划算，先算清月供，为以后买房做准备吧～";
  } else if (breakEvenYear !== null && data.holdingYears >= breakEvenYear) {
    hint = "长期买房更合适，先确认月供压力，再算算收入能否覆盖。";
  }

  if (data.downPaymentRatio < 20) {
    hint += " 首付有点紧，算完月供后可以接着用下面的攒钱计划。";
  }

  refs.nextHint.textContent = hint;

  const monthlyMortgage = result.monthlyPayment;
  refs.btnMortgage.querySelector(".action-sub").textContent =
    monthlyMortgage > data.monthlyRent * 1.5 ? "月供可能偏高，先评估压力" : "房贷压力早知晓";
  refs.btnIncome.querySelector(".action-sub").textContent =
    monthlyMortgage > data.monthlyRent ? "算算收入是否能覆盖" : "税后收入更清晰";

  const baseParams = new URLSearchParams({
    housePrice: String(data.housePrice),
    downPaymentRatio: String(data.downPaymentRatio),
    loanYears: String(data.loanYears),
    loanRate: String(data.loanRate),
    monthlyRent: String(data.monthlyRent),
    holdingYears: String(data.holdingYears),
    monthlyPayment: String(Math.round(result.monthlyPayment)),
    downPayment: String(Math.round(result.downPayment)),
  });
  refs.btnMortgage.href = `./mortgage.html?${baseParams.toString()}`;
  refs.btnIncome.href = `./income.html?${baseParams.toString()}`;
  refs.btnMortgage.classList.remove("is-disabled");
  refs.btnIncome.classList.remove("is-disabled");
}

function setNextActionsInvalid() {
  refs.btnMortgage.href = "./mortgage.html";
  refs.btnIncome.href = "./income.html";
  refs.btnMortgage.classList.remove("is-disabled");
  refs.btnIncome.classList.remove("is-disabled");
  refs.nextHint.textContent = "先把输入里的提示修正好，我再为你推荐最合适的下一步。";
}

function setGlanceInvalid() {
  refs.glanceSummary.textContent = "先修正输入中的提示，我会继续实时给你结论。";
  refs.glanceBuy.textContent = "-";
  refs.glanceRent.textContent = "-";
  refs.glanceDiff.textContent = "-";
  refs.glanceBreakEven.textContent = "-";
}

function updateGlance(data, result, breakEvenYear) {
  const diff = Math.abs(result.buyTotal - result.rentTotal);
  const buyBetter = result.buyTotal < result.rentTotal;
  refs.glanceSummary.textContent = buyBetter
    ? `当前买房更省，大约可省 ${(diff / 10000).toFixed(2)} 万元。`
    : `当前租房更省，大约可省 ${(diff / 10000).toFixed(2)} 万元。`;
  refs.glanceBuy.textContent = formatWan(result.buyTotal);
  refs.glanceRent.textContent = formatWan(result.rentTotal);
  refs.glanceDiff.textContent = formatWan(diff);
  refs.glanceBreakEven.textContent = breakEvenYear === null
    ? "按当前参数，暂时看不到买房跑赢租房的时间点。"
    : `盈亏平衡点：约第 ${breakEvenYear} 年。你当前计划住 ${data.holdingYears} 年。`;
}

function update() {
  const data = getInputs();
  const err = validate(data);
  refs.error.textContent = err;
  if (err) {
    setNextActionsInvalid();
    setGlanceInvalid();
    return;
  }

  saveState(data);
  const result = calcForYears(data, data.holdingYears);
  const breakEvenSearchMax = Math.max(40, Math.ceil(data.holdingYears), Math.ceil(data.loanYears));
  const breakEvenYear = findBreakEven(data, breakEvenSearchMax);

  latestData = data;
  latestResult = result;

  refs.buyCost.textContent = formatWan(result.buyTotal);
  refs.rentCost.textContent = formatWan(result.rentTotal);
  refs.buyMonthlyCost.textContent = formatYuanPerMonth(result.buyMonthlyAvg);
  refs.rentMonthlyCost.textContent = formatYuanPerMonth(result.rentMonthlyAvg);

  refs.summary.textContent = generateSummary(data, result);
  refs.advice.textContent = generateAdvice(data, result, breakEvenYear);

  renderBreakEven(data, breakEvenYear);
  setBars(result.buyTotal, result.rentTotal);
  setCostStyles(result.buyTotal, result.rentTotal);
  updateNextActions(data, result, breakEvenYear);
  updateGlance(data, result, breakEvenYear);
  flashResultCard();
}

function loadInitialValues() {
  const savedRaw = localStorage.getItem("rent-buy-calculator");
  let data = defaults;
  if (savedRaw) {
    try {
      data = { ...defaults, ...JSON.parse(savedRaw) };
    } catch {
      data = defaults;
    }
  }

  for (const key of fieldOrder) {
    syncRangeAndInput(key, data[key]);
  }
}

function setupEvents() {
  refs.form.addEventListener("input", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "range") {
      const inputId = target.dataset.sync;
      if (inputId) {
        const input = document.getElementById(inputId);
        if (input) input.value = target.value;
      }
    } else if (target instanceof HTMLInputElement && target.dataset.key) {
      const range = document.querySelector(`input[type="range"][data-sync="${target.id}"]`);
      if (range) range.value = target.value;
    }
    update();
  });

  const numberInputs = fieldOrder.map((id) => document.getElementById(id));
  numberInputs.forEach((input, index) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const next = numberInputs[index + 1];
        if (next) next.focus();
      }
    });
  });

  refs.btnMortgage.addEventListener("click", (event) => {
    event.preventDefault();
    refs.nextHint.textContent = "先看月供很聪明，做到心里有数就不会慌。";
    window.location.href = refs.btnMortgage.href;
  });

  refs.btnIncome.addEventListener("click", (event) => {
    event.preventDefault();
    refs.nextHint.textContent = "收入和月供一起看，决策会更踏实。";
    window.location.href = refs.btnIncome.href;
  });
}

loadInitialValues();
setupEvents();
update();
