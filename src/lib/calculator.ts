/**
 * TumbuhLayak - Core Deterministic Calculation Engine
 * Integrates:
 * 1. Phased Bill of Quantities (RAB Bertahap) with Material/Labor/Contingency breakdowns
 * 2. Building Depreciation Model (MAPPI / SPI Straight-Line adjusted by physical condition)
 * 3. Post-Renovation Property Valuation (Cost-Plus-Utility + Synergy + Depreciation Recovery)
 * 4. 5-Year Property Value Trajectory (Without Renovation vs With TumbuhLayak)
 * 5. Bank BTN Home Expansion Financing & Layer 1 Arisan Collective Housing Calculator
 */

import {
  ArisanSimulationResult,
  BuildingCondition,
  DailyArisanSimulationInput,
  DailyArisanSimulationResult,
  DailyArisanYearlyPoint,
  ExpansionModule,
  FinancingSimulation,
  FiveYearProjectionPoint,
  HousingProfile,
  ModuleCostResult,
  PhaseRABResult,
  SavingPlanSimulation,
  ValuationSummary,
} from '../types';
import { BASELINE_PHASES, BTN_FINANCING_CONFIG } from '../data/housingConfig';

const CONDITION_DEPRECIATION_MULTIPLIER: Record<BuildingCondition, number> = {
  prima: 0.75,
  terawat: 1.0,
  'perlu-peremajaan': 1.35,
};

export function calculateStagedRABAndValuation(
  profile: HousingProfile,
  modules: ExpansionModule[]
): ValuationSummary {
  const contingencyRate = Math.max(0, Math.min(0.3, profile.contingencyRate ?? 0.08));
  const activeModules = modules.filter((m) => m.isSelected);

  // 1. Calculate cost per module
  const moduleResults: ModuleCostResult[] = activeModules.map((m) => {
    const volume = Math.max(0.1, m.customVolume || m.defaultVolume);
    const unitPrice = Math.max(1000, m.customUnitPrice || m.defaultUnitPrice);
    const matRatio = m.customMaterialRatio ?? m.materialRatio;
    const labRatio = m.customLaborRatio ?? m.laborRatio;
    const valueFactor = m.customValueFactor ?? m.valueContributionFactor;

    const baseCost = volume * unitPrice;
    const materialCost = baseCost * matRatio;
    const laborCost = baseCost * labRatio;
    const contingencyCost = baseCost * contingencyRate;
    const totalCost = baseCost + contingencyCost;
    const valueContribution = baseCost * valueFactor;

    return {
      moduleId: m.id,
      name: m.name,
      phaseId: m.selectedPhase || 'tahap-1',
      volume,
      unitLabel: m.unitLabel,
      unitPrice,
      materialCost,
      laborCost,
      baseCost,
      contingencyCost,
      totalCost,
      valueContribution,
    };
  });

  // 2. Aggregate by Phase
  const phases: PhaseRABResult[] = BASELINE_PHASES.map((p) => {
    const phaseMods = moduleResults.filter((m) => m.phaseId === p.id);
    const subtotalMaterial = phaseMods.reduce((acc, cur) => acc + cur.materialCost, 0);
    const subtotalLabor = phaseMods.reduce((acc, cur) => acc + cur.laborCost, 0);
    const subtotalBase = phaseMods.reduce((acc, cur) => acc + cur.baseCost, 0);
    const phaseContingency = phaseMods.reduce((acc, cur) => acc + cur.contingencyCost, 0);
    const totalPhaseCost = phaseMods.reduce((acc, cur) => acc + cur.totalCost, 0);
    const phaseValueContribution = phaseMods.reduce((acc, cur) => acc + cur.valueContribution, 0);

    return {
      phaseId: p.id,
      phaseName: p.name,
      targetTimeline: p.targetTimeline,
      modules: phaseMods,
      subtotalMaterial,
      subtotalLabor,
      subtotalBase,
      contingencyCost: phaseContingency,
      totalPhaseCost,
      phaseValueContribution,
    };
  });

  // 3. RAB Totals
  const totalDevelopmentCost = moduleResults.reduce((acc, cur) => acc + cur.totalCost, 0);
  const totalMaterialCost = moduleResults.reduce((acc, cur) => acc + cur.materialCost, 0);
  const totalLaborCost = moduleResults.reduce((acc, cur) => acc + cur.laborCost, 0);
  const totalContingencyCost = moduleResults.reduce((acc, cur) => acc + cur.contingencyCost, 0);
  const grossValueAdded = moduleResults.reduce((acc, cur) => acc + cur.valueContribution, 0);

  // 4. Area & KDB Calculation
  let addedGroundFootprint = 0;
  let addedTotalArea = 0;

  activeModules.forEach((m) => {
    const vol = m.customVolume || m.defaultVolume;
    if (m.id === 'modul-dak-lantai2') {
      addedTotalArea += vol;
    } else if (m.id === 'modul-kanopi-carport') {
      addedTotalArea += 0;
    } else {
      addedGroundFootprint += vol;
      addedTotalArea += vol;
    }
  });

  const totalBuildingArea = profile.luasBangunanEksisting + addedTotalArea;
  const groundFootprint = profile.luasBangunanEksisting + addedGroundFootprint;
  const kdbRatio = profile.luasTanah > 0 ? groundFootprint / profile.luasTanah : 0.6;
  const isKdbOptimal = kdbRatio <= 0.65;

  // 5. Building Depreciation Model (MAPPI / SPI Straight-Line Adjusted)
  // Land does NOT depreciate; only the existing building structure depreciates over economic life.
  const landShare = Math.max(0.25, Math.min(0.85, profile.porsiNilaiTanah ?? 0.55));
  const initialLandValue = Math.round(profile.nilaiAwalProperti * landShare);
  const initialStructureValue = Math.max(0, profile.nilaiAwalProperti - initialLandValue);

  const buildingAge = Math.max(0, Math.min(45, profile.usiaBangunanTahun ?? 0));
  const economicLife = Math.max(15, Math.min(60, profile.umurEkonomisTahun ?? 30));
  const conditionMult = CONDITION_DEPRECIATION_MULTIPLIER[profile.kondisiBangunan || 'terawat'];

  const rawDepreciationRate = (buildingAge / economicLife) * conditionMult;
  const depreciationRate = Math.min(0.75, Math.max(0, rawDepreciationRate));
  const depreciationAmount = Math.round(initialStructureValue * depreciationRate);
  const depreciatedPropertyValue = initialLandValue + (initialStructureValue - depreciationAmount);

  // 6. Valuation Synergy Multiplier & Post-Renovation Value
  let synergyFactor = 1.0;
  const hasBed = activeModules.some((m) => m.id === 'modul-kamar-tidur');
  const hasBath = activeModules.some((m) => m.id === 'modul-kamar-mandi');
  if (hasBed && hasBath) synergyFactor += 0.04;
  if (isKdbOptimal) synergyFactor += 0.02;
  if (phases.filter((p) => p.modules.length > 0).length >= 2) synergyFactor += 0.02;

  // Renovating rejuvenates part of existing structure's physical depreciation
  const depreciationRecovery =
    activeModules.length > 0
      ? Math.round(Math.min(depreciationAmount * 0.4, grossValueAdded * 0.1))
      : 0;

  const projectedNewPropertyValue =
    depreciatedPropertyValue + Math.round(grossValueAdded * synergyFactor) + depreciationRecovery;

  const netAddedValue =
    projectedNewPropertyValue - (depreciatedPropertyValue + totalDevelopmentCost);

  const netGainVsOriginalHandover =
    projectedNewPropertyValue - (profile.nilaiAwalProperti + totalDevelopmentCost);

  const roiPercentage =
    totalDevelopmentCost > 0 ? (netAddedValue / totalDevelopmentCost) * 100 : 0;

  // 7. 5-Year Trajectory: Without Renovation (Depreciating) vs With TumbuhLayak Renovation
  const annualLandGrowth = 0.035; // conservative 3.5%/yr suburban Indonesia land growth
  const renovatedStructureBase =
    initialStructureValue - depreciationAmount + depreciationRecovery + Math.round(grossValueAdded * synergyFactor);

  const fiveYearProjection: FiveYearProjectionPoint[] = [0, 1, 2, 3, 4, 5].map((yr) => {
    const landAtYr = initialLandValue * Math.pow(1 + annualLandGrowth, yr);

    // Without renovation: existing structure continues aging at current condition multiplier
    const unrenovatedDepRate = Math.min(
      0.8,
      ((buildingAge + yr) / economicLife) * conditionMult
    );
    const unrenovatedStruct = initialStructureValue * (1 - unrenovatedDepRate);
    const withoutRenovationValue = Math.round(landAtYr + unrenovatedStruct);

    // With renovation: rejuvenated structure ages slower (0.75x) over refreshed economic life
    const renovatedDepRate = Math.min(0.5, (yr / (economicLife + 5)) * 0.75);
    const withRenovationValue = Math.round(
      landAtYr + renovatedStructureBase * (1 - renovatedDepRate)
    );

    return {
      yearOffset: yr,
      yearLabel: yr === 0 ? 'Saat ini' : `Thn +${yr}`,
      withoutRenovationValue,
      withRenovationValue,
    };
  });

  // 8. BTN Financing Simulations (Annuity installment formula)
  const financingOptions: FinancingSimulation[] = BTN_FINANCING_CONFIG.interestRates.map((cfg) => {
    const P = totalDevelopmentCost;
    if (P <= 0) {
      return {
        tenorMonths: cfg.tenorMonths,
        annualInterestRate: cfg.rateAnnual,
        monthlyInstallment: 0,
        totalPayment: 0,
        totalInterest: 0,
        recommendedMinIncome: 0,
      };
    }
    const r = cfg.rateAnnual / 12;
    const n = cfg.tenorMonths;
    const monthlyInstallment = Math.round(
      (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
    );
    const totalPayment = monthlyInstallment * n;
    const totalInterest = totalPayment - P;
    const recommendedMinIncome = Math.round(
      monthlyInstallment / BTN_FINANCING_CONFIG.maxDsrRatio
    );

    return {
      tenorMonths: n,
      annualInterestRate: cfg.rateAnnual,
      monthlyInstallment,
      totalPayment,
      totalInterest,
      recommendedMinIncome,
    };
  });

  // 9. Staged Savings Simulation
  const savingOptions: SavingPlanSimulation[] = [6, 12, 18, 24].map((months) => ({
    targetMonths: months,
    monthlySavingsNeeded: totalDevelopmentCost > 0 ? Math.round(totalDevelopmentCost / months) : 0,
  }));

  return {
    initialBuildingArea: profile.luasBangunanEksisting,
    addedBuildingArea: addedTotalArea,
    totalBuildingArea,
    kdbRatio,
    isKdbOptimal,
    initialPropertyValue: profile.nilaiAwalProperti,
    initialLandValue,
    initialStructureValue,
    depreciationRate,
    depreciationAmount,
    depreciatedPropertyValue,
    depreciationRecovery,
    totalDevelopmentCost,
    totalMaterialCost,
    totalLaborCost,
    totalContingencyCost,
    grossValueAdded,
    synergyFactor,
    projectedNewPropertyValue,
    netAddedValue,
    netGainVsOriginalHandover,
    roiPercentage,
    fiveYearProjection,
    phases,
    financingOptions,
    savingOptions,
  };
}

/**
 * Layer 1 Calculator: Skema Arisan Rumah Kolektif Bank BTN
 * Models collective escrow savings paired with BTN bridging construction financing.
 */
export function calculateArisanScheme(
  unitPrice: number,
  memberCount: number,
  cycleMonths: number,
  downPaymentShare = 0.25 // 25% of house price funded via arisan collective DP/equity pool, 75% continued via subsidized BTN KPR
): ArisanSimulationResult {
  const safePrice = Math.max(50000000, unitPrice);
  const safeMembers = Math.max(6, Math.min(60, memberCount));
  const safeMonths = Math.max(12, Math.min(120, cycleMonths));

  // Collective arisan funds the DP + core construction acceleration pool managed in BTN Escrow
  const collectiveTargetPerUnit = safePrice * downPaymentShare;
  const monthlyContributionPerMember =
    Math.ceil(collectiveTargetPerUnit / safeMonths / 500) * 500;
  const monthlyGroupPool = monthlyContributionPerMember * safeMembers;
  const monthsPerUnitHandover = Math.max(1, Number((safeMonths / safeMembers).toFixed(1)));
  const unitsHandedOverPerYear = Number((12 / monthsPerUnitHandover).toFixed(1));
  const btnEscrowBufferNeeded = Math.round(safePrice * (1 - downPaymentShare));

  return {
    unitPrice: safePrice,
    memberCount: safeMembers,
    cycleMonths: safeMonths,
    monthlyContributionPerMember,
    monthlyGroupPool,
    monthsPerUnitHandover,
    unitsHandedOverPerYear,
    btnEscrowBufferNeeded,
  };
}

/**
 * Internal deterministic year-by-year conservation simulator for Gen-Z Daily Micro-Arisan BTN.
 * Models daily auto-debit BTN Escrow inflows against inflation-indexed subsidized house handovers.
 */
function runDailyArisanYears(
  baseHousePrice: number,
  quotaMembers: number,
  dailyContribution: number,
  annualInflationRate: number,
  markupRate: number
) {
  const projectedContractPrice = Math.round(baseHousePrice * (1 + markupRate));
  const totalDays = Math.max(365, Math.ceil(projectedContractPrice / dailyContribution));

  let remainingDays = totalDays;
  let remainingMembers = quotaMembers;
  let escrowBalance = 0;
  let cumulativeUnits = 0;
  let year = 1;
  const yearlySchedule: DailyArisanYearlyPoint[] = [];

  while (remainingDays > 0 && year <= 40) {
    const daysInYear = Math.min(365, remainingDays);
    const annualCashInBtn = quotaMembers * dailyContribution * daysInYear;
    const housePriceInYear = Math.round(
      baseHousePrice * Math.pow(1 + annualInflationRate, year - 1)
    );

    escrowBalance += annualCashInBtn;
    const affordableUnits = Math.floor(escrowBalance / housePriceInYear);
    const unitsHandedOver = Math.min(remainingMembers, affordableUnits);
    const disbursed = unitsHandedOver * housePriceInYear;

    escrowBalance -= disbursed;
    remainingMembers -= unitsHandedOver;
    cumulativeUnits += unitsHandedOver;

    const unitsPerDay = Number((unitsHandedOver / daysInYear).toFixed(2));
    const cumulativePercent = Number(((cumulativeUnits / quotaMembers) * 100).toFixed(1));

    yearlySchedule.push({
      year,
      yearLabel: `Thn ${year}`,
      housePriceInYear,
      unitsHandedOver,
      unitsPerDay,
      cumulativeUnits,
      cumulativePercent,
      annualCashInBtn,
      escrowReserveEnd: Math.round(escrowBalance),
    });

    remainingDays -= daysInYear;
    year++;
  }

  return {
    projectedContractPrice,
    totalDays,
    yearlySchedule,
    cumulativeUnits,
    remainingMembers,
    escrowBalance: Math.round(escrowBalance),
  };
}

/**
 * Solves the exact minimum inflation-buffer markup (%) so 100% of quota members
 * receive an inflation-adjusted house by the end of the cycle without deficit.
 */
export function solveIdealArisanMarkup(
  baseHousePrice: number,
  quotaMembers: number,
  dailyContribution: number,
  annualInflationRate: number
): number {
  const safePrice = Math.max(100000000, baseHousePrice);
  const safeQuota = Math.max(500, Math.min(15000, Math.round(quotaMembers)));
  const safeDaily = Math.max(15000, Math.min(150000, Math.round(dailyContribution)));
  const safeInf = Math.max(0, Math.min(0.12, annualInflationRate));

  if (safeInf <= 0.0001) return 0;

  let lo = 0;
  let hi = 1.5;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const sim = runDailyArisanYears(safePrice, safeQuota, safeDaily, safeInf, mid);
    if (sim.remainingMembers === 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  // Round up cleanly to nearest 1% (0.01) so zero shortfall occurs
  return Math.min(1.5, Math.ceil(hi * 100) / 100);
}

/**
 * Full Gen-Z Daily Micro-Arisan BTN Calculator
 * Models location-based FLPP pricing, quota progress, daily auto-debit cashflow into Bank BTN,
 * accelerated early-year unit delivery (1-2+ units/day), and inflation-indexed markup sustainability.
 */
export function calculateDailyArisanProjection(
  input: DailyArisanSimulationInput
): DailyArisanSimulationResult {
  const baseHousePrice = Math.max(100000000, Math.round(input.baseHousePrice));
  const quotaMembers = Math.max(500, Math.min(15000, Math.round(input.quotaMembers)));
  const dailyContribution = Math.max(15000, Math.min(150000, Math.round(input.dailyContribution)));
  const annualInflationRate = Math.max(0, Math.min(0.12, input.annualInflationRate));
  const markupRate = Math.max(0, Math.min(1.5, input.markupRate));

  const recommendedMarkupRate = solveIdealArisanMarkup(
    baseHousePrice,
    quotaMembers,
    dailyContribution,
    annualInflationRate
  );

  const sim = runDailyArisanYears(
    baseHousePrice,
    quotaMembers,
    dailyContribution,
    annualInflationRate,
    markupRate
  );

  const cycleYears = Number((sim.totalDays / 365).toFixed(1));
  const monthlyContribution = dailyContribution * 30;
  const dailyCashflowBtn = quotaMembers * dailyContribution;
  const monthlyCashflowBtn = dailyCashflowBtn * 30;
  const annualCashflowBtn = dailyCashflowBtn * 365;
  const totalCashflowBtn = quotaMembers * sim.projectedContractPrice;

  const year1UnitsPerDay = sim.yearlySchedule[0]?.unitsPerDay ?? 0;
  const avgUnitsPerDay = Number((sim.cumulativeUnits / Math.max(1, sim.totalDays)).toFixed(2));
  const finalYearHousePrice =
    sim.yearlySchedule[sim.yearlySchedule.length - 1]?.housePriceInYear ?? baseHousePrice;

  const coveragePercent = Number(((sim.cumulativeUnits / quotaMembers) * 100).toFixed(1));
  const isBalanced = sim.remainingMembers === 0;

  // Benchmark: Official Bank BTN KPR FLPP 5% p.a. over 20 years (240 months, 99% financing after 1% DP)
  const kprPrincipal = Math.round(baseHousePrice * 0.99);
  const rMonth = 0.05 / 12;
  const nMonths = 240;
  const kprFlppMonthlyInstallment = Math.round(
    (kprPrincipal * (rMonth * Math.pow(1 + rMonth, nMonths))) /
      (Math.pow(1 + rMonth, nMonths) - 1)
  );
  const kprFlpp20YrTotalPayment =
    kprFlppMonthlyInstallment * nMonths + Math.round(baseHousePrice * 0.01);

  return {
    baseHousePrice,
    projectedContractPrice: sim.projectedContractPrice,
    markupRate,
    recommendedMarkupRate,
    quotaMembers,
    dailyContribution,
    monthlyContribution,
    totalDays: sim.totalDays,
    cycleYears,
    dailyCashflowBtn,
    monthlyCashflowBtn,
    annualCashflowBtn,
    totalCashflowBtn,
    year1UnitsPerDay,
    avgUnitsPerDay,
    finalYearHousePrice,
    totalUnitsFunded: sim.cumulativeUnits,
    shortfallMembers: sim.remainingMembers,
    coveragePercent,
    isBalanced,
    endingEscrowSurplus: sim.escrowBalance,
    kprFlpp20YrTotalPayment,
    kprFlppMonthlyInstallment,
    yearlySchedule: sim.yearlySchedule,
  };
}
