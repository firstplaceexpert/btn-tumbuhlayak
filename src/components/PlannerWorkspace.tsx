'use client';

import React, { useState } from 'react';
import {
  BuildingCondition,
  ExpansionModule,
  FloorRoom,
  HousingProfile,
  NfcPropertyRecord,
  PhaseId,
  ValuationSummary,
} from '../types';
import { BASELINE_PHASES } from '../data/housingConfig';
import { formatRupiah, formatArea, formatPercent } from '../lib/formatters';
import { parseSafeNumber, housingProfileSchema } from '../lib/validation';
import { HouseBlueprint } from './HouseBlueprint';
import { AnimatedNumber } from './AnimatedNumber';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  SlidersHorizontal,
  AlertCircle,
  Minus,
  Wifi,
} from 'lucide-react';

interface PlannerWorkspaceProps {
  activeNfcRecord: NfcPropertyRecord;
  profile: HousingProfile;
  modules: ExpansionModule[];
  valuation: ValuationSummary;
  templateId: string;
  lotLength: number;
  lotWidth: number;
  rooms: FloorRoom[];
  floorView: 'lt1' | 'lt2';
  onFloorViewChange: (view: 'lt1' | 'lt2') => void;
  onSelectTemplate: (templateId: string) => void;
  onUpdateRoom: (roomId: string, patch: Partial<FloorRoom>, syncModuleVolume?: number) => void;
  onMirrorRooms: () => void;
  onResetLayout: () => void;
  onProfileChange: (profile: HousingProfile) => void;
  onModulesChange: (modules: ExpansionModule[]) => void;
  onAddCustomModule: (mod: ExpansionModule) => void;
  onDeleteCustomModule: (id: string) => void;
  onToggleModule: (id: string) => void;
  onChangeModulePhase: (id: string, phase: PhaseId) => void;
  onGoToAnalytics: () => void;
  onSwitchNfcCard: () => void;
}

export const PlannerWorkspace: React.FC<PlannerWorkspaceProps> = ({
  activeNfcRecord,
  profile,
  modules,
  valuation,
  templateId,
  lotLength,
  lotWidth,
  rooms,
  floorView,
  onFloorViewChange,
  onSelectTemplate,
  onUpdateRoom,
  onMirrorRooms,
  onResetLayout,
  onProfileChange,
  onModulesChange,
  onAddCustomModule,
  onDeleteCustomModule,
  onToggleModule,
  onChangeModulePhase,
  onGoToAnalytics,
  onSwitchNfcCard,
}) => {
  const [phaseFilter, setPhaseFilter] = useState<'all' | PhaseId>('all');
  const [expandedModId, setExpandedModId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('2500000');
  const [customVol, setCustomVol] = useState('9');
  const [customError, setCustomError] = useState('');

  const selectedCount = modules.filter((m) => m.isSelected).length;

  const handleProfileUpdate = (field: keyof HousingProfile, value: string | number) => {
    let parsedVal: string | number = value;
    const numericFields: (keyof HousingProfile)[] = [
      'luasTanah',
      'luasBangunanEksisting',
      'nilaiAwalProperti',
      'contingencyRate',
      'tahunDibangun',
      'usiaBangunanTahun',
      'umurEkonomisTahun',
      'porsiNilaiTanah',
    ];
    if (typeof value === 'string' && numericFields.includes(field)) {
      parsedVal = parseSafeNumber(value, 0);
    }

    const updated = { ...profile, [field]: parsedVal } as HousingProfile;
    const result = housingProfileSchema.safeParse(updated);

    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errs[String(issue.path[0])] = issue.message;
        }
      });
      setValidationErrors(errs);
    } else {
      setValidationErrors({});
    }

    onProfileChange(updated);
  };

  const updateModuleField = <K extends keyof ExpansionModule>(
    id: string,
    field: K,
    val: ExpansionModule[K]
  ) => {
    onModulesChange(modules.map((m) => (m.id === id ? { ...m, [field]: val } : m)));
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customName.replace(/[<>'"`;()]/g, '').trim().slice(0, 60);
    if (cleaned.length < 2) {
      setCustomError('Nama modul minimal 2 karakter.');
      return;
    }

    const vol = parseSafeNumber(customVol, 9, 1, 100);
    const price = parseSafeNumber(customPrice, 2500000, 100000, 30000000);

    const newMod: ExpansionModule = {
      id: `kustom-${Date.now()}`,
      name: cleaned,
      category: 'kustom',
      description: 'Modul pengembangan kustom yang dapat digeser langsung pada denah.',
      unitLabel: 'm²',
      defaultVolume: vol,
      minVolume: 1,
      maxVolume: 100,
      defaultUnitPrice: price,
      materialRatio: 0.65,
      laborRatio: 0.35,
      valueContributionFactor: 1.12,
      iconKey: 'plus',
      isSelected: true,
      selectedPhase: phaseFilter === 'all' ? 'tahap-2' : phaseFilter,
      customVolume: vol,
      customUnitPrice: price,
      customMaterialRatio: 0.65,
      customLaborRatio: 0.35,
      customValueFactor: 1.12,
    };

    onAddCustomModule(newMod);
    setCustomName('');
    setCustomError('');
    setShowAddCustom(false);
  };

  const filteredModules =
    phaseFilter === 'all'
      ? modules
      : modules.filter((m) => m.selectedPhase === phaseFilter);

  const phaseLabelShort = (phase: PhaseId) => {
    if (phase === 'tahap-1') return 'Tahap 1';
    if (phase === 'tahap-2') return 'Tahap 2';
    return 'Tahap 3';
  };

  const phasePillStyle = (phase: PhaseId) => {
    if (phase === 'tahap-1') return 'bg-brand-soft text-brand border-brand-border';
    if (phase === 'tahap-2') return 'bg-ochre-soft text-ochre border-ochre-border';
    return 'bg-tealarch-soft text-tealarch border-tealarch-border';
  };

  return (
    <div className="space-y-6 animate-panel-enter">
      {/* Verified NFC Property Context Bar + Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-positive-soft text-positive border border-positive-border font-mono">
              <Wifi className="w-3 h-3" aria-hidden="true" />
              {activeNfcRecord.uid}
            </span>
            <span className="text-ink-secondary font-normal">
              {activeNfcRecord.clusterName} · {activeNfcRecord.unitBlock} · Serah terima {activeNfcRecord.tahunDibangun}
            </span>
          </div>
          <h1 className="font-display text-[22px] font-bold text-ink tracking-[-0.015em] leading-snug">
            Perencanaan rumah tumbuh & valuasi aset
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Nilai aset setelah penyusutan {profile.usiaBangunanTahun} thn:{' '}
            <span className="font-semibold text-btnred tabular-nums">
              {formatRupiah(valuation.depreciatedPropertyValue, true)}
            </span>
            {selectedCount > 0 ? (
              <>
                {' '}→ diproyeksikan tumbuh menjadi{' '}
                <span className="font-semibold text-brand tabular-nums">
                  {formatRupiah(valuation.projectedNewPropertyValue, true)}
                </span>{' '}
                pasca renovasi {selectedCount} modul.
              </>
            ) : (
              ' · Kondisi rumah eksisting BTN (centang modul pengembangan di kanan untuk simulasi renovasi).'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onSwitchNfcCard}
            className="h-9 px-3 rounded-control border border-control bg-sheet hover:bg-well text-xs font-medium text-ink transition-colors whitespace-nowrap"
          >
            Scan kartu lain
          </button>
          <button
            type="button"
            onClick={onGoToAnalytics}
            className="h-9 px-4 rounded-control bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Valuasi, susut & KPR
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip: Renovated Value + Depreciated Value + Staged RAB + Area/KDB */}
      <section
        aria-label="Ringkasan nilai setelah renovasi dan penyusutan"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5"
      >
        {/* Lead Answer KPI: Post-Renovation Value (Official BTN Dynamic Blue #125EFA) */}
        <div className="p-4 sm:p-5 rounded-card btn-kpi-surface text-white flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-blue-100">
              {selectedCount > 0 ? 'Nilai total setelah renovasi' : 'Nilai aset kondisi eksisting'}
            </span>
            <span className="w-2.5 h-1 rounded-full bg-btnred flex-shrink-0" aria-hidden="true" />
          </div>
          <div className="mt-2 font-display text-[26px] leading-tight font-bold text-white tabular-nums tracking-tight">
            <AnimatedNumber
              value={valuation.projectedNewPropertyValue}
              format={(n) => formatRupiah(n, true)}
            />
          </div>
          <div className="mt-2 text-xs tabular-nums flex items-center flex-wrap gap-1.5">
            {selectedCount > 0 ? (
              <>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white text-brand font-semibold">
                  <AnimatedNumber
                    value={valuation.netAddedValue}
                    format={(n) => `${n >= 0 ? '+' : ''}${formatRupiah(n, true)} ekuitas`}
                  />
                </span>
                <span className="text-blue-100">
                  (
                  <AnimatedNumber
                    value={valuation.roiPercentage}
                    format={(n) => `${n >= 0 ? '+' : ''}${n.toFixed(1).replace('.', ',')}% ROI`}
                  />
                  )
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white text-brand font-semibold">
                  Belum ada renovasi
                </span>
                <span className="text-blue-100">(0 modul aktif)</span>
              </>
            )}
          </div>
        </div>

        {/* Sibling 1: Depreciated Property Value (BTN Stable Red #DC0714 Accent) */}
        <div className="p-4 sm:p-5 rounded-card border border-hairline border-t-[3px] border-t-btnred bg-sheet flex flex-col justify-center interactive-surface">
          <div className="text-[13px] font-medium text-ink-secondary">
            Nilai saat ini (setelah susut)
          </div>
          <div className="mt-1.5 font-display text-[20px] leading-tight font-bold text-ink tabular-nums">
            <AnimatedNumber
              value={valuation.depreciatedPropertyValue}
              format={(n) => formatRupiah(n, true)}
            />
          </div>
          <div className="mt-1.5 text-xs text-btnred font-medium tabular-nums">
            Susut -{formatRupiah(valuation.depreciationAmount, true)} (-{formatPercent(valuation.depreciationRate)}) · usia {profile.usiaBangunanTahun} thn
          </div>
        </div>

        {/* Sibling 2: Total Staged RAB */}
        <div className="p-4 sm:p-5 rounded-card border border-hairline border-t-[3px] border-t-brand bg-sheet flex flex-col justify-center interactive-surface">
          <div className="text-[13px] font-medium text-ink-secondary">
            Total biaya RAB bertahap
          </div>
          <div className="mt-1.5 font-display text-[20px] leading-tight font-bold text-ink tabular-nums">
            <AnimatedNumber
              value={valuation.totalDevelopmentCost}
              format={(n) => formatRupiah(Math.round(n))}
            />
          </div>
          <div className="mt-1.5 text-xs text-ink-secondary tabular-nums">
            {selectedCount > 0
              ? `${selectedCount} modul aktif · kontingensi ${formatPercent(profile.contingencyRate, 0)}`
              : 'Belum ada modul renovasi dipilih'}
          </div>
        </div>

        {/* Sibling 3: Area & KDB */}
        <div
          className={`p-4 sm:p-5 rounded-card border border-hairline border-t-[3px] bg-sheet flex flex-col justify-center interactive-surface ${valuation.isKdbOptimal ? 'border-t-positive' : 'border-t-ochre-mid'
            }`}
        >
          <div className="text-[13px] font-medium text-ink-secondary">
            Luas akhir & rasio KDB
          </div>
          <div className="mt-1.5 font-display text-[20px] leading-tight font-bold text-ink tabular-nums">
            <AnimatedNumber
              value={valuation.totalBuildingArea}
              format={(n) => formatArea(Math.round(n))}
            />
            <span className="text-[13px] font-sans font-normal text-ink-secondary ml-1.5">
              (KDB{' '}
              <AnimatedNumber
                value={valuation.kdbRatio}
                format={(n) => formatPercent(n)}
              />
              )
            </span>
          </div>
          <div className="mt-1.5 text-xs">
            {valuation.isKdbOptimal ? (
              <span className="text-positive font-medium">
                Memenuhi batas ideal resapan ≤ 65%
              </span>
            ) : (
              <span className="text-ochre font-medium">
                Melebihi 65% · pertimbangkan lantai 2
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Balanced 2-Column Studio Workbench */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_436px] gap-6 items-stretch">
        {/* LEFT COLUMN: Editable Architectural Floorplan + Property & Depreciation Parameters */}
        <div className="flex flex-col gap-6 min-w-0">
          <HouseBlueprint
            profile={profile}
            modules={modules}
            valuation={valuation}
            templateId={templateId}
            lotLength={lotLength}
            lotWidth={lotWidth}
            rooms={rooms}
            floorView={floorView}
            onFloorViewChange={onFloorViewChange}
            onSelectTemplate={onSelectTemplate}
            onUpdateRoom={onUpdateRoom}
            onMirrorRooms={onMirrorRooms}
            onResetLayout={onResetLayout}
            onToggleModule={onToggleModule}
            onChangeModulePhase={onChangeModulePhase}
          />

          {/* Property Baseline + Depreciation Model Card */}
          <section
            aria-label="Profil aset hunian dan parameter penyusutan"
            className="flex-1 border border-hairline rounded-card bg-sheet p-5 flex flex-col justify-between gap-5 interactive-surface"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-display text-[15px] font-semibold text-ink">
                  Parameter properti & penyusutan bangunan
                </h2>
                <p className="text-[13px] text-ink-secondary mt-0.5">
                  Terisi otomatis dari Kartu Kunci NFC BTN dan dapat disesuaikan untuk uji skenario.
                </p>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-ochre-soft text-ochre border border-ochre-border">
                Asumsi simulasi heuristik
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="field-tanah" className="block text-[13px] font-medium text-ink mb-1.5">
                  Luas tanah (m²)
                </label>
                <input
                  id="field-tanah"
                  type="number"
                  min={20}
                  max={2000}
                  value={profile.luasTanah || ''}
                  onChange={(e) => handleProfileUpdate('luasTanah', e.target.value)}
                  className="w-full h-[38px] px-3 rounded-control border border-control bg-sheet text-sm tabular-nums text-ink focus:border-brand focus:outline-none"
                />
                {validationErrors.luasTanah && (
                  <p className="mt-1 text-xs text-btnred flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    {validationErrors.luasTanah}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="field-bangunan" className="block text-[13px] font-medium text-ink mb-1.5">
                  Bangunan awal (m²)
                </label>
                <input
                  id="field-bangunan"
                  type="number"
                  min={10}
                  max={1500}
                  value={profile.luasBangunanEksisting || ''}
                  onChange={(e) => handleProfileUpdate('luasBangunanEksisting', e.target.value)}
                  className="w-full h-[38px] px-3 rounded-control border border-control bg-sheet text-sm tabular-nums text-ink focus:border-brand focus:outline-none"
                />
                {validationErrors.luasBangunanEksisting && (
                  <p className="mt-1 text-xs text-btnred flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    {validationErrors.luasBangunanEksisting}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="field-nilai-awal" className="block text-[13px] font-medium text-ink mb-1.5">
                  Nilai awal serah terima (Rp)
                </label>
                <input
                  id="field-nilai-awal"
                  type="number"
                  step={5000000}
                  value={profile.nilaiAwalProperti || ''}
                  onChange={(e) => handleProfileUpdate('nilaiAwalProperti', e.target.value)}
                  className="w-full h-[38px] px-3 rounded-control border border-control bg-sheet text-sm tabular-nums text-ink focus:border-brand focus:outline-none"
                />
                <div className="mt-0.5 text-xs text-ink-secondary tabular-nums">
                  {formatRupiah(profile.nilaiAwalProperti)}
                </div>
              </div>

              {/* Depreciation: Building Age */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="field-usia" className="text-[13px] font-medium text-ink">
                    Usia bangunan
                  </label>
                  <span className="text-[13px] font-semibold text-btnred tabular-nums">
                    {profile.usiaBangunanTahun} tahun
                  </span>
                </div>
                <div className="h-[38px] flex items-center">
                  <input
                    id="field-usia"
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={profile.usiaBangunanTahun}
                    onChange={(e) =>
                      handleProfileUpdate('usiaBangunanTahun', parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full studio-range"
                  />
                </div>
                <div className="text-xs text-ink-secondary">
                  Umur ekonomis {profile.umurEkonomisTahun} thn (garis lurus)
                </div>
              </div>

              {/* Depreciation: Physical Condition */}
              <div>
                <label htmlFor="field-kondisi" className="block text-[13px] font-medium text-ink mb-1.5">
                  Kondisi fisik eksisting
                </label>
                <select
                  id="field-kondisi"
                  value={profile.kondisiBangunan}
                  onChange={(e) =>
                    handleProfileUpdate('kondisiBangunan', e.target.value as BuildingCondition)
                  }
                  className="w-full h-[38px] px-3 rounded-control border border-control bg-sheet text-sm font-medium text-ink focus:border-brand focus:outline-none"
                >
                  <option value="prima">Prima (susut 0,75x)</option>
                  <option value="terawat">Terawat normal (1,0x)</option>
                  <option value="perlu-peremajaan">Perlu peremajaan (1,35x)</option>
                </select>
                <div className="mt-0.5 text-xs text-ink-secondary">
                  Tanah {Math.round(profile.porsiNilaiTanah * 100)}% tidak menyusut
                </div>
              </div>

              {/* Contingency Rate */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="field-kontingensi" className="text-[13px] font-medium text-ink">
                    Kontingensi RAB
                  </label>
                  <span className="text-[13px] font-semibold text-brand tabular-nums">
                    {(profile.contingencyRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-[38px] flex items-center">
                  <input
                    id="field-kontingensi"
                    type="range"
                    min={0}
                    max={0.2}
                    step={0.01}
                    value={profile.contingencyRate}
                    onChange={(e) =>
                      handleProfileUpdate('contingencyRate', parseFloat(e.target.value))
                    }
                    className="w-full studio-range"
                  />
                </div>
                <div className="text-xs text-ink-secondary">
                  Cadangan fluktuasi harga material
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Modular Growth Configurator */}
        <section
          aria-label="Katalog modul pengembangan rumah tumbuh"
          className="border border-hairline rounded-card bg-sheet flex flex-col min-w-0 interactive-surface"
        >
          <div className="px-5 py-4 border-b border-rule space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-[15px] font-semibold text-ink">
                  Modul pengembangan
                </h2>
                <p className="text-[13px] text-ink-secondary mt-0.5">
                  {selectedCount === 0
                    ? 'Belum ada modul dipilih · centang untuk mulai simulasi'
                    : `${selectedCount} dari ${modules.length} modul aktif · sinkron dengan denah`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onModulesChange(modules.map((m) => ({ ...m, isSelected: false })))
                    }
                    className="h-8 px-2.5 rounded-control border border-control bg-sheet hover:bg-well text-xs font-medium text-ink-secondary hover:text-ink transition-colors"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddCustom((prev) => !prev)}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-control border border-brand-border bg-brand-soft hover:bg-brand hover:text-white text-[13px] font-medium text-brand transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tambah ruang</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 border-b border-rule -mb-4 pt-1 overflow-x-auto">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'tahap-1', label: 'Tahap 1' },
                  { id: 'tahap-2', label: 'Tahap 2' },
                  { id: 'tahap-3', label: 'Tahap 3' },
                ] as const
              ).map((tab) => {
                const active = phaseFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPhaseFilter(tab.id)}
                    className={`pb-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${active
                      ? 'border-brand text-brand'
                      : 'border-transparent text-ink-secondary hover:text-ink'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {showAddCustom && (
            <form
              onSubmit={handleCreateCustom}
              className="p-4 bg-brand-soft/50 border-b border-brand-border space-y-3"
            >
              <div className="text-[13px] font-semibold text-brand">
                Tambah ruang kustom baru (otomatis muncul di denah)
              </div>
              <div className="space-y-2.5">
                <div>
                  <label htmlFor="custom-mod-name" className="block text-xs text-ink-secondary mb-1">
                    Nama ruang / pekerjaan
                  </label>
                  <input
                    id="custom-mod-name"
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Contoh: Ruang Usaha, Mushola, atau Gazebo"
                    className="w-full h-9 px-3 rounded-control border border-control bg-sheet text-sm text-ink"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="custom-mod-price" className="block text-xs text-ink-secondary mb-1">
                      Harga satuan (Rp/m²)
                    </label>
                    <input
                      id="custom-mod-price"
                      type="number"
                      min={100000}
                      step={100000}
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-control border border-control bg-sheet text-sm tabular-nums text-ink"
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-mod-vol" className="block text-xs text-ink-secondary mb-1">
                      Luas rencana (m²)
                    </label>
                    <input
                      id="custom-mod-vol"
                      type="number"
                      min={1}
                      max={100}
                      value={customVol}
                      onChange={(e) => setCustomVol(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-control border border-control bg-sheet text-sm tabular-nums text-ink"
                    />
                  </div>
                </div>
                {customError && <p className="text-xs text-btnred">{customError}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="h-8 px-3 rounded-control border border-control bg-sheet text-xs font-medium text-ink-secondary hover:text-ink"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-8 px-3.5 rounded-control bg-brand text-white text-xs font-semibold hover:bg-brand-hover"
                >
                  Simpan & tampilkan di denah
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 divide-y divide-rule">
            {filteredModules.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-medium text-ink">Belum ada modul di tahap ini</p>
                <p className="text-xs text-ink-secondary">
                  Pindahkan tahap pada salah satu modul atau tambah ruang kustom baru.
                </p>
              </div>
            ) : (
              filteredModules.map((m) => {
                const isExpanded = expandedModId === m.id;
                const volume = m.customVolume || m.defaultVolume;
                const unitPrice = m.customUnitPrice || m.defaultUnitPrice;
                const subtotal = volume * unitPrice;
                const isCustom = m.id.startsWith('kustom-');
                const isPriceModified = unitPrice !== m.defaultUnitPrice;

                const checkBg =
                  m.selectedPhase === 'tahap-1'
                    ? 'bg-brand border-brand'
                    : m.selectedPhase === 'tahap-2'
                      ? 'bg-ochre-mid border-ochre-mid'
                      : 'bg-tealarch border-tealarch';

                return (
                  <div
                    key={m.id}
                    className={`transition-colors ${m.isSelected ? 'bg-sheet' : 'bg-well/40'}`}
                  >
                    <div className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={m.isSelected}
                            aria-label={`Pilih modul ${m.name}`}
                            onClick={() => onToggleModule(m.id)}
                            className={`mt-0.5 w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors ${m.isSelected
                              ? `${checkBg} text-white`
                              : 'bg-sheet border-control hover:border-brand'
                              }`}
                          >
                            {m.isSelected && (
                              <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleModule(m.id)}
                              className={`text-left text-sm font-medium leading-snug block ${m.isSelected ? 'text-ink' : 'text-ink-secondary'
                                }`}
                            >
                              {m.name}
                            </button>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border whitespace-nowrap flex-none ${phasePillStyle(
                                  m.selectedPhase
                                )}`}
                              >
                                {phaseLabelShort(m.selectedPhase)}
                              </span>
                              <span className="text-[13px] text-ink-secondary truncate tabular-nums">
                                {formatRupiah(unitPrice)}/{m.unitLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5 flex-shrink-0">
                          <div className="text-right">
                            <div
                              className={`text-sm tabular-nums ${m.isSelected ? 'font-semibold text-ink' : 'text-ink-secondary'
                                }`}
                            >
                              {formatRupiah(subtotal, true)}
                            </div>
                            <div className="text-[13px] text-ink-secondary tabular-nums">
                              {volume} {m.unitLabel}
                            </div>
                          </div>

                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => onDeleteCustomModule(m.id)}
                              className="p-1 text-ink-secondary hover:text-btnred rounded"
                              aria-label={`Hapus modul ${m.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      {m.isSelected && (
                        <div className="mt-3 pl-[30px] flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center border border-control rounded-control bg-sheet h-8 overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  updateModuleField(
                                    m.id,
                                    'customVolume',
                                    Math.max(m.minVolume, volume - 1)
                                  )
                                }
                                className="w-7 h-full flex items-center justify-center text-ink-secondary hover:bg-well hover:text-ink"
                                aria-label={`Kurangi volume ${m.name}`}
                              >
                                <Minus className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <input
                                type="number"
                                aria-label={`Volume ${m.name} dalam ${m.unitLabel}`}
                                min={m.minVolume}
                                max={m.maxVolume}
                                value={volume}
                                onChange={(e) =>
                                  updateModuleField(
                                    m.id,
                                    'customVolume',
                                    parseSafeNumber(
                                      e.target.value,
                                      m.minVolume,
                                      m.minVolume,
                                      m.maxVolume
                                    )
                                  )
                                }
                                className="w-10 h-full text-center text-[13px] font-medium tabular-nums text-ink border-x border-rule focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateModuleField(
                                    m.id,
                                    'customVolume',
                                    Math.min(m.maxVolume, volume + 1)
                                  )
                                }
                                className="w-7 h-full flex items-center justify-center text-ink-secondary hover:bg-well hover:text-ink"
                                aria-label={`Tambah volume ${m.name}`}
                              >
                                <Plus className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>

                            <select
                              aria-label={`Pilih tahap pengerjaan untuk ${m.name}`}
                              value={m.selectedPhase}
                              onChange={(e) =>
                                onChangeModulePhase(m.id, e.target.value as PhaseId)
                              }
                              className="h-8 px-2 rounded-control border border-control bg-sheet text-[13px] font-medium text-ink focus:border-brand focus:outline-none"
                            >
                              {BASELINE_PHASES.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name.split(':')[0]}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedModId(isExpanded ? null : m.id)}
                            aria-expanded={isExpanded}
                            className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline whitespace-nowrap"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isPriceModified ? 'Harga diubah' : 'Edit harga'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {m.isSelected && isExpanded && (
                      <div className="px-5 py-3.5 pl-[50px] bg-well border-t border-rule space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor={`price-${m.id}`}
                              className="block text-xs font-medium text-ink mb-1"
                            >
                              Harga satuan (Rp/{m.unitLabel})
                            </label>
                            <input
                              id={`price-${m.id}`}
                              type="number"
                              step={100000}
                              min={100000}
                              max={30000000}
                              value={unitPrice}
                              onChange={(e) =>
                                updateModuleField(
                                  m.id,
                                  'customUnitPrice',
                                  parseSafeNumber(
                                    e.target.value,
                                    m.defaultUnitPrice,
                                    100000,
                                    30000000
                                  )
                                )
                              }
                              className="w-full h-9 px-2.5 rounded-control border border-control bg-sheet text-sm tabular-nums text-ink"
                            />
                            <div className="mt-0.5 text-xs text-ink-secondary">
                              Bawaan SNI: {formatRupiah(m.defaultUnitPrice)}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label
                                htmlFor={`alpha-${m.id}`}
                                className="text-xs font-medium text-ink"
                              >
                                Koefisien nilai (α)
                              </label>
                              <span className="text-xs font-semibold text-brand tabular-nums">
                                {(m.customValueFactor ?? m.valueContributionFactor).toFixed(2)}x
                              </span>
                            </div>
                            <div className="h-9 flex items-center">
                              <input
                                id={`alpha-${m.id}`}
                                type="range"
                                min={0.8}
                                max={1.6}
                                step={0.02}
                                value={m.customValueFactor ?? m.valueContributionFactor}
                                onChange={(e) =>
                                  updateModuleField(
                                    m.id,
                                    'customValueFactor',
                                    parseFloat(e.target.value) || 1.0
                                  )
                                }
                                className="w-full studio-range"
                              />
                            </div>
                            <div className="text-xs text-ink-secondary">
                              Kontribusi terhadap nilai pasar
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <label htmlFor={`mat-${m.id}`} className="font-medium text-ink">
                              Komposisi material vs upah tukang
                            </label>
                            <span className="text-ink-secondary tabular-nums">
                              Mat {Math.round((m.customMaterialRatio ?? m.materialRatio) * 100)}% : Upah{' '}
                              {Math.round((m.customLaborRatio ?? m.laborRatio) * 100)}%
                            </span>
                          </div>
                          <input
                            id={`mat-${m.id}`}
                            type="range"
                            min={0.3}
                            max={0.85}
                            step={0.05}
                            value={m.customMaterialRatio ?? m.materialRatio}
                            onChange={(e) => {
                              const mat = parseFloat(e.target.value) || 0.65;
                              onModulesChange(
                                modules.map((mod) =>
                                  mod.id === m.id
                                    ? {
                                      ...mod,
                                      customMaterialRatio: mat,
                                      customLaborRatio: parseFloat((1 - mat).toFixed(2)),
                                    }
                                    : mod
                                )
                              );
                            }}
                            className="w-full studio-range"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="px-5 py-3.5 border-t border-rule bg-well flex items-center justify-between gap-3 rounded-b-card">
            <div>
              <div className="text-[13px] text-ink-secondary">Total RAB (+kontingensi)</div>
              <div className="text-base font-display font-bold text-brand tabular-nums">
                {formatRupiah(valuation.totalDevelopmentCost)}
              </div>
            </div>
            <button
              type="button"
              onClick={onGoToAnalytics}
              className="h-9 px-4 rounded-control bg-brand hover:bg-brand-hover text-white text-[13px] font-semibold transition-colors whitespace-nowrap"
            >
              Valuasi & KPR BTN
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
