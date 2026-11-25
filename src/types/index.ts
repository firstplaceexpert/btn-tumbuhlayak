/**
 * TumbuhLayak - Core Type Definitions
 * BTN Housingpreneur Batch 3 (Housing Innovation)
 */

export type PhaseId = 'tahap-1' | 'tahap-2' | 'tahap-3';
export type BuildingCondition = 'prima' | 'terawat' | 'perlu-peremajaan';

export interface PhaseInfo {
  id: PhaseId;
  name: string;
  description: string;
  targetTimeline: string;
  badgeColor: string;
}

export interface ExpansionModule {
  id: string;
  name: string;
  category: 'ruang-tidur' | 'sanitasi' | 'eksterior' | 'vertikal' | 'kustom';
  description: string;
  unitLabel: string;
  defaultVolume: number;
  minVolume: number;
  maxVolume: number;

  defaultUnitPrice: number;
  materialRatio: number;
  laborRatio: number;

  valueContributionFactor: number;
  iconKey: 'bed' | 'bath' | 'shield' | 'layers' | 'plus' | 'utensils';

  isSelected: boolean;
  selectedPhase: PhaseId;
  customVolume: number;
  customUnitPrice: number;
  customMaterialRatio: number;
  customLaborRatio: number;
  customValueFactor: number;
}

export interface HousingProfile {
  namaPemilik: string;
  lokasiKota: string;
  luasTanah: number;
  luasBangunanEksisting: number;
  nilaiAwalProperti: number;
  contingencyRate: number;
  // Building Depreciation & Appraisal Parameters (User-Overridable)
  tahunDibangun: number;
  usiaBangunanTahun: number;
  umurEkonomisTahun: number;
  porsiNilaiTanah: number; // e.g., 0.55 = 55% land (non-depreciating), 45% structure
  kondisiBangunan: BuildingCondition;
}

export interface ModuleCostResult {
  moduleId: string;
  name: string;
  phaseId: PhaseId;
  volume: number;
  unitLabel: string;
  unitPrice: number;
  materialCost: number;
  laborCost: number;
  baseCost: number;
  contingencyCost: number;
  totalCost: number;
  valueContribution: number;
}

export interface PhaseRABResult {
  phaseId: PhaseId;
  phaseName: string;
  targetTimeline: string;
  modules: ModuleCostResult[];
  subtotalMaterial: number;
  subtotalLabor: number;
  subtotalBase: number;
  contingencyCost: number;
  totalPhaseCost: number;
  phaseValueContribution: number;
}

export interface FinancingSimulation {
  tenorMonths: number;
  annualInterestRate: number;
  monthlyInstallment: number;
  totalPayment: number;
  totalInterest: number;
  recommendedMinIncome: number;
}

export interface SavingPlanSimulation {
  targetMonths: number;
  monthlySavingsNeeded: number;
}

export interface FiveYearProjectionPoint {
  yearOffset: number;
  yearLabel: string;
  withoutRenovationValue: number;
  withRenovationValue: number;
}

export interface ValuationSummary {
  initialBuildingArea: number;
  addedBuildingArea: number;
  totalBuildingArea: number;
  kdbRatio: number;
  isKdbOptimal: boolean;

  initialPropertyValue: number;
  initialLandValue: number;
  initialStructureValue: number;

  // Depreciation Breakdown (MAPPI / SPI Straight-Line Adjusted)
  depreciationRate: number; // 0..0.75 applied to structure
  depreciationAmount: number;
  depreciatedPropertyValue: number; // Total value after depreciation (before renovation)
  depreciationRecovery: number; // Value restored via renovation rejuvenation

  totalDevelopmentCost: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalContingencyCost: number;

  grossValueAdded: number;
  synergyFactor: number;
  projectedNewPropertyValue: number; // Total value after renovation
  netAddedValue: number; // Net equity gain vs depreciated value + RAB
  netGainVsOriginalHandover: number; // Net value vs original handover value + RAB
  roiPercentage: number;

  fiveYearProjection: FiveYearProjectionPoint[];
  phases: PhaseRABResult[];
  financingOptions: FinancingSimulation[];
  savingOptions: SavingPlanSimulation[];
}

export interface ScenarioPreset {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  targetModules: { id: string; volume: number; phase: PhaseId }[];
}

export type FurnitureStyle =
  | 'bed-double'
  | 'bed-single'
  | 'living'
  | 'bath'
  | 'kitchen'
  | 'carport'
  | 'stairs'
  | 'custom';

export type WallSide = 'top' | 'right' | 'bottom' | 'left';
export type DoorType = 'single' | 'double' | 'sliding' | 'none';

export interface FloorRoom {
  id: string;
  label: string;
  kind: 'existing' | 'module';
  moduleId?: string;
  floor: 'lt1' | 'lt2';
  x: number;
  y: number;
  w: number;
  h: number;
  furniture?: FurnitureStyle;
  doorWall?: WallSide;
  doorType?: DoorType;
  windowWalls?: WallSide[];
  elevation?: string;
}

export interface HouseTemplate {
  id: string;
  name: string;
  shortLabel: string;
  subtitle: string;
  lotLength: number;
  lotWidth: number;
  luasTanah: number;
  luasBangunanEksisting: number;
  nilaiAwalProperti: number;
  rooms: FloorRoom[];
}

// =========================================================================
// AUTH, LAYER 1 (ARISAN RUMAH BTN), & NFC SMART KEY CARD TYPES
// =========================================================================

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  roleLabel: string;
  arisanGroupName: string;
  arisanSlotNumber: number;
  paidMonths: number;
  totalCycleMonths: number;
  monthlyContribution: number;
  hasReceivedUnit: boolean;
  assignedNfcUid: string | null;
}

export interface NfcPropertyRecord {
  uid: string; // e.g., BTN-NFC-3672-0014
  certificateNo: string; // e.g., SHGB-BTN-2022-014
  clusterName: string;
  unitBlock: string;
  ownerName: string;
  lokasiKota: string;
  templateId: string;
  houseTypeLabel: string;
  luasTanah: number;
  luasBangunanEksisting: number;
  nilaiSerahTerimaAwal: number;
  tahunDibangun: number;
  usiaBangunanTahun: number;
  umurEkonomisTahun: number;
  porsiNilaiTanah: number;
  kondisiBangunan: BuildingCondition;
  arisanBatchLabel: string;
  handoverDate: string;
}

export interface ArisanMemberSlot {
  slotNo: number;
  memberName: string;
  periodeBulan: string;
  status: 'unit-diserahkan' | 'undian-aktif' | 'terjadwal';
  unitBlock?: string;
  nfcUid?: string;
  isCurrentUser?: boolean;
}

export interface ArisanSimulationResult {
  unitPrice: number;
  memberCount: number;
  cycleMonths: number;
  monthlyContributionPerMember: number;
  monthlyGroupPool: number;
  monthsPerUnitHandover: number;
  unitsHandedOverPerYear: number;
  btnEscrowBufferNeeded: number;
}

export interface ArisanLocationZone {
  id: string;
  regionName: string;
  shortLabel: string;
  sampleCities: string;
  clusterName: string;
  officialFlppPrice: number; // Kepmen PUPR No. 689/KPTS/M/2023 (berlaku 2024-2026)
  regulationNote: string;
  defaultQuota: number;
  registeredMembers: number; // Current Gen-Z members joined in this cluster
  defaultDailyContribution: number;
  defaultInflationRate: number;
  developerPartner: string;
}

export interface DailyArisanYearlyPoint {
  year: number;
  yearLabel: string;
  housePriceInYear: number;
  unitsHandedOver: number;
  unitsPerDay: number;
  cumulativeUnits: number;
  cumulativePercent: number;
  annualCashInBtn: number;
  escrowReserveEnd: number;
}

export interface DailyArisanSimulationInput {
  baseHousePrice: number;
  quotaMembers: number;
  dailyContribution: number;
  annualInflationRate: number;
  markupRate: number;
}

export interface DailyArisanSimulationResult {
  baseHousePrice: number;
  projectedContractPrice: number;
  markupRate: number;
  recommendedMarkupRate: number;
  quotaMembers: number;
  dailyContribution: number;
  monthlyContribution: number;
  totalDays: number;
  cycleYears: number;
  dailyCashflowBtn: number;
  monthlyCashflowBtn: number;
  annualCashflowBtn: number;
  totalCashflowBtn: number;
  year1UnitsPerDay: number;
  avgUnitsPerDay: number;
  finalYearHousePrice: number;
  totalUnitsFunded: number;
  shortfallMembers: number;
  coveragePercent: number;
  isBalanced: boolean;
  endingEscrowSurplus: number;
  kprFlpp20YrTotalPayment: number;
  kprFlppMonthlyInstallment: number;
  yearlySchedule: DailyArisanYearlyPoint[];
}
