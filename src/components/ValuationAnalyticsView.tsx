'use client';

import React, { useState } from 'react';
import { HousingProfile, ValuationSummary } from '../types';
import { formatRupiah, formatPercent } from '../lib/formatters';
import { parseSafeNumber } from '../lib/validation';
import { VisualCharts } from './VisualCharts';
import { AnimatedNumber } from './AnimatedNumber';

interface ValuationAnalyticsViewProps {
  profile: HousingProfile;
  valuation: ValuationSummary;
  onGoToPlanner: () => void;
  onGoToProposal: () => void;
}

export const ValuationAnalyticsView: React.FC<ValuationAnalyticsViewProps> = ({
  profile,
  valuation,
  onGoToPlanner,
  onGoToProposal,
}) => {
  const [financeMode, setFinanceMode] = useState<'btn-kpr' | 'nabung'>('btn-kpr');
  const [selectedTenor, setSelectedTenor] = useState<number>(36);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(8500000);

  const activeLoan =
    valuation.financingOptions.find((f) => f.tenorMonths === selectedTenor) ||
    valuation.financingOptions[2] ||
    valuation.financingOptions[0];

  const dsrRatio =
    monthlyIncome > 0 && activeLoan.monthlyInstallment > 0
      ? activeLoan.monthlyInstallment / monthlyIncome
      : 0;

  let dsrStatus = {
    label: 'Layak & aman (di bawah 30% penghasilan)',
    detail: 'Cicilan masih memberi ruang arus kas keluarga yang sehat sesuai standar BTN.',
    classes: 'bg-positive-soft text-positive border-positive-border',
    barColor: 'bg-positive',
  };

  if (dsrRatio > 0.35) {
    dsrStatus = {
      label: 'Melebihi batas aman 35% (DSR ketat)',
      detail: 'Pertimbangkan memperpanjang tenor ke 60 bulan atau memecah pembangunan ke tahap berikutnya.',
      classes: 'bg-negative-soft text-negative border-negative-border',
      barColor: 'bg-negative',
    };
  } else if (dsrRatio >= 0.3) {
    dsrStatus = {
      label: 'Mendekati batas maksimal BTN (30%-35%)',
      detail: 'Masih dapat disetujui bersyarat jika tidak ada cicilan konsumtif lain.',
      classes: 'bg-ochre-soft text-ochre border-ochre-border',
      barColor: 'bg-ochre-mid',
    };
  }

  const totalActiveModules = valuation.phases.reduce((sum, p) => sum + p.modules.length, 0);

  return (
    <div className="space-y-6 animate-panel-enter">
      {/* Warm Illustrated Header Banner */}
      <section className="rounded-[18px] border border-hairline bg-gradient-to-r from-[#EEF4FD] via-[#FCFBF8] to-[#FEF7EA] p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 space-y-3">
          <div className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-soft text-brand border border-brand-border">
              Valuasi & Simulasi KPR Renovasi
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-ochre-soft text-ochre border border-ochre-border">
              Asumsi simulasi · bukan laporan KJPP
            </span>
          </div>
          <h1 className="font-display text-[22px] font-bold text-ink tracking-[-0.015em] leading-snug">
            Valuasi properti, penyusutan & simulasi KPR BTN
          </h1>
          <p className="text-sm text-ink-secondary leading-relaxed">
            Nilai aset saat ini pasca penyusutan{' '}
            <span className="font-semibold text-btnred tabular-nums">
              {formatRupiah(valuation.depreciatedPropertyValue)}
            </span>{' '}
            → setelah RAB{' '}
            <span className="font-semibold text-brand tabular-nums">
              {formatRupiah(valuation.totalDevelopmentCost)}
            </span>{' '}
            diproyeksikan menjadi{' '}
            <span className="font-semibold text-ink tabular-nums">
              {formatRupiah(valuation.projectedNewPropertyValue)}
            </span>{' '}
            (cicilan BTN {formatRupiah(activeLoan.monthlyInstallment)}/bln).
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onGoToPlanner}
              className="h-9 px-4 rounded-control border border-control bg-sheet hover:bg-well text-sm font-medium text-ink transition-colors whitespace-nowrap"
            >
              Ubah denah
            </button>
            <button
              type="button"
              onClick={onGoToProposal}
              className="h-9 px-4 rounded-control bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Ringkasan cetak
            </button>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-[14px] bg-[#F6F4EF] border border-hairline p-2 shadow-[0_10px_24px_-16px_rgba(31,36,43,0.18)]">
            <img
              src="/illustrations/valuation-kpr-growth.jpg"
              alt="Ilustrasi pertumbuhan nilai rumah tumbuh dan simulasi KPR BTN"
              className="w-full aspect-[4/3] object-cover rounded-[10px] block"
            />
          </div>
        </div>
      </section>

      {/* Row 1: Two Balanced Cards — Property Valuation Chart & BTN Financing Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Valuation & Staged Cost Charts */}
        <section
          aria-label="Visualisasi proyeksi nilai properti dan biaya tahap"
          className="border border-hairline rounded-card bg-sheet p-5 flex flex-col justify-between gap-5"
        >
          <VisualCharts valuation={valuation} />

          {/* Transparent Valuation + Depreciation Formula Box (Explicitly Marked as Heuristic Assumptions) */}
          <div className="p-3.5 rounded-control bg-well border border-hairline text-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-ink">
                Model simulasi penyusutan & proyeksi nilai renovasi
              </span>
              <span className="px-1.5 py-0.5 rounded bg-ochre-soft text-ochre border border-ochre-border text-[11px] font-semibold">
                Asumsi heuristik · bukan KJPP
              </span>
            </div>
            <div className="font-mono text-ink-secondary">
              Nilai_Pasca_Susut = Tanah ({Math.round(profile.porsiNilaiTanah * 100)}%) + Bangunan × (1 - Usia/{profile.umurEkonomisTahun} × k_kondisi)
            </div>
            <div className="font-mono text-brand">
              Nilai_Renovasi = Nilai_Pasca_Susut + [ ∑(Biaya × α) × {valuation.synergyFactor.toFixed(2)} ] + Pemulihan
            </div>
            <p className="text-[11px] text-ink-secondary leading-relaxed">
              Parameter pengali kondisi (0,75/1,0/1,35), porsi tanah ({Math.round(profile.porsiNilaiTanah * 100)}%), bonus sinergi (+4%/+2%/+2%), dan batas pemulihan penyusutan min(40% × susut, 10% × nilai tambah) adalah asumsi simulasi awal — dapat dikalibrasi dengan data transaksi lokal atau regresi hedonik.
            </p>
          </div>
        </section>

        {/* Right: Bank BTN Financing & DSR Stress Test */}
        <section
          aria-label="Simulasi pembiayaan Bank BTN dan uji DSR"
          className="border border-hairline rounded-card bg-sheet p-5 flex flex-col justify-between gap-5"
        >
          <div className="space-y-5">
            {/* Header & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rule">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Simulasi pembiayaan renovasi
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Asumsi suku bunga pasar (8,25%–9,75% p.a.) vs target tabungan mandiri
                </p>
              </div>

              <div
                className="inline-flex bg-well p-0.5 rounded-control border border-hairline"
                role="tablist"
                aria-label="Pilih metode pembiayaan"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={financeMode === 'btn-kpr'}
                  onClick={() => setFinanceMode('btn-kpr')}
                  className={`px-3 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                    financeMode === 'btn-kpr'
                      ? 'bg-sheet text-ink border border-hairline'
                      : 'text-ink-secondary hover:text-ink border border-transparent'
                  }`}
                >
                  KPR BTN
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={financeMode === 'nabung'}
                  onClick={() => setFinanceMode('nabung')}
                  className={`px-3 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                    financeMode === 'nabung'
                      ? 'bg-sheet text-ink border border-hairline'
                      : 'text-ink-secondary hover:text-ink border border-transparent'
                  }`}
                >
                  Nabung mandiri
                </button>
              </div>
            </div>

            {financeMode === 'btn-kpr' ? (
              <div className="space-y-5">
                {/* Tenor Selector */}
                <div>
                  <div className="text-xs font-medium text-ink-secondary mb-2">
                    Pilih jangka waktu pinjaman (tenor)
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {valuation.financingOptions.map((opt) => {
                      const active = selectedTenor === opt.tenorMonths;
                      return (
                        <button
                          key={opt.tenorMonths}
                          type="button"
                          onClick={() => setSelectedTenor(opt.tenorMonths)}
                          className={`h-9 rounded-control border text-xs font-mono font-medium transition-colors tabular-nums ${
                            active
                              ? 'bg-brand border-brand text-white'
                              : 'bg-sheet border-control text-ink hover:bg-well'
                          }`}
                        >
                          {opt.tenorMonths} bln
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prominent Monthly Installment Readout */}
                <div className="p-4 rounded-control btn-kpi-surface text-white flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <div className="text-[13px] text-blue-100">
                      Estimasi angsuran per bulan
                    </div>
                    <div className="mt-1 text-[28px] leading-tight font-semibold text-white tabular-nums">
                      <AnimatedNumber
                        value={activeLoan.monthlyInstallment}
                        format={(n) => formatRupiah(Math.round(n))}
                      />
                    </div>
                  </div>
                  <div className="text-[13px] text-blue-100 sm:text-right space-y-0.5 tabular-nums">
                    <div>
                      Asumsi bunga pasar {(activeLoan.annualInterestRate * 100).toFixed(2).replace('.', ',')}% p.a. anuitas
                    </div>
                    <div>
                      Total bunga:{' '}
                      <span className="font-semibold text-white">
                        <AnimatedNumber
                          value={activeLoan.totalInterest}
                          format={(n) => formatRupiah(Math.round(n))}
                        />
                      </span>
                    </div>
                  </div>
                </div>

                {/* DSR Stress Test */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="field-income" className="text-xs font-medium text-ink">
                      Uji rasio cicilan terhadap penghasilan (DSR)
                    </label>
                    <span className="text-xs font-mono font-semibold text-ink tabular-nums">
                      <AnimatedNumber
                        value={dsrRatio * 100}
                        format={(n) => `DSR ${n.toFixed(1).replace('.', ',')}%`}
                      />
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-secondary">
                        Rp
                      </span>
                      <input
                        id="field-income"
                        type="number"
                        step={500000}
                        min={1000000}
                        value={monthlyIncome || ''}
                        onChange={(e) =>
                          setMonthlyIncome(parseSafeNumber(e.target.value, 0, 0, 500000000))
                        }
                        className="w-full h-[38px] pl-9 pr-3 rounded-control border border-control bg-sheet text-sm font-mono tabular-nums text-ink focus:border-brand focus:outline-none"
                        placeholder="Penghasilan bulanan"
                      />
                    </div>
                    <div className="text-xs text-ink-secondary whitespace-nowrap">
                      Min. disarankan:{' '}
                      <span className="font-mono font-medium text-ink tabular-nums">
                        {formatRupiah(activeLoan.recommendedMinIncome, true)}
                      </span>
                    </div>
                  </div>

                  {/* Clean DSR Gauge with High-Contrast Tick Labels */}
                  <div className="space-y-1.5">
                    <div className="relative h-2 w-full bg-well rounded-full overflow-hidden border border-hairline">
                      <div
                        className={`h-full transition-[width] duration-300 ${dsrStatus.barColor}`}
                        style={{ width: `${Math.min(100, (dsrRatio / 0.5) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-ink-secondary font-mono tabular-nums">
                      <span>0%</span>
                      <span>Aman 30%</span>
                      <span>Batas 35%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-control border text-xs space-y-0.5 ${dsrStatus.classes}`}>
                    <div className="font-semibold">{dsrStatus.label}</div>
                    <div className="opacity-90">{dsrStatus.detail}</div>
                  </div>

                  {/* BTN Collateral & Loan Summary Strip */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-control bg-well border border-hairline">
                      <div className="text-xs text-ink-secondary">Pokok KPR</div>
                      <div className="mt-0.5 text-sm font-mono font-semibold text-ink tabular-nums">
                        {formatRupiah(valuation.totalDevelopmentCost, true)}
                      </div>
                    </div>
                    <div className="p-3 rounded-control bg-well border border-hairline">
                      <div className="text-xs text-ink-secondary">Total bayar</div>
                      <div className="mt-0.5 text-sm font-mono font-semibold text-ink tabular-nums">
                        {formatRupiah(activeLoan.totalPayment, true)}
                      </div>
                    </div>
                    <div className="p-3 rounded-control bg-well border border-hairline">
                      <div className="text-xs text-ink-secondary">Rasio LTV</div>
                      <div className="mt-0.5 text-sm font-mono font-semibold text-brand tabular-nums">
                        {valuation.projectedNewPropertyValue > 0
                          ? formatPercent(
                              valuation.totalDevelopmentCost / valuation.projectedNewPropertyValue
                            )
                          : '0%'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-ink-secondary">
                  Alokasi tabungan bulanan tanpa bunga jika pembangunan didanai dari kas pribadi secara bertahap:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {valuation.savingOptions.map((opt) => (
                    <div
                      key={opt.targetMonths}
                      className="p-4 rounded-control border border-hairline bg-well space-y-1"
                    >
                      <div className="text-xs text-ink-secondary">
                        Target {opt.targetMonths} bulan
                      </div>
                      <div className="text-lg font-mono font-semibold text-ink tabular-nums">
                        {formatRupiah(opt.monthlySavingsNeeded)}
                      </div>
                      <div className="text-xs text-ink-secondary">per bulan</div>
                    </div>
                  ))}
                </div>
                <div className="p-3.5 rounded-control border border-hairline bg-sheet text-xs text-ink-secondary">
                  Tips perencanaan: jika memilih menabung mandiri, prioritaskan Tahap 1 sebesar{' '}
                  <span className="font-mono font-medium text-ink tabular-nums">
                    {formatRupiah(valuation.phases[0]?.totalPhaseCost || 0)}
                  </span>{' '}
                  terlebih dahulu agar ruangan cepat fungsional.
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-rule flex items-center justify-between text-xs text-ink-secondary">
            <span>Plafon rencana: {formatRupiah(valuation.totalDevelopmentCost)}</span>
            <button
              type="button"
              onClick={onGoToProposal}
              className="font-medium text-brand hover:underline"
            >
              Lanjut ke dokumen cetak
            </button>
          </div>
        </section>
      </div>

      {/* Row 2: Full-Width Clean Financial Ledger Table (No Zebra Striping, Right-Aligned Numbers) */}
      <section
        aria-label="Tabel rincian anggaran biaya bertahap"
        className="border border-hairline rounded-card bg-sheet overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-rule flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Rincian anggaran biaya (RAB) per tahap
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Rincian porsi material, upah tukang, dan cadangan kontingensi {formatPercent(profile.contingencyRate, 0)} sesuai standar SNI.
            </p>
          </div>
          <span className="text-xs font-mono text-ink-secondary tabular-nums">
            {totalActiveModules} modul terpilih
          </span>
        </div>

        {totalActiveModules === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-ink">
              Belum ada modul pengembangan yang dipilih
            </p>
            <p className="text-xs text-ink-secondary max-w-md mx-auto">
              Aktifkan minimal satu modul di halaman Perencanaan & Denah untuk menghitung RAB bertahap dan proyeksi nilai properti.
            </p>
            <button
              type="button"
              onClick={onGoToPlanner}
              className="h-9 px-4 rounded-control bg-ink text-white text-xs font-medium"
            >
              Kembali ke perencanaan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-hairline text-xs text-ink-secondary">
                  <th className="py-3 px-5 font-medium">Modul pengembangan</th>
                  <th className="py-3 px-3 font-medium text-right">Volume</th>
                  <th className="py-3 px-3 font-medium text-right">Harga satuan</th>
                  <th className="py-3 px-3 font-medium text-right">Material</th>
                  <th className="py-3 px-3 font-medium text-right">Upah tukang</th>
                  <th className="py-3 px-3 font-medium text-right">Kontingensi</th>
                  <th className="py-3 px-5 font-medium text-right">Total biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule text-sm">
                {valuation.phases.map((phase) => {
                  if (phase.modules.length === 0) return null;
                  return (
                    <React.Fragment key={phase.phaseId}>
                      {/* Phase Group Subheader */}
                      <tr className="bg-well/70">
                        <td colSpan={6} className="py-2.5 px-5 text-xs font-semibold text-ink">
                          {phase.phaseName}{' '}
                          <span className="font-normal text-ink-secondary ml-1.5">
                            ({phase.targetTimeline})
                          </span>
                        </td>
                        <td className="py-2.5 px-5 text-xs font-mono font-semibold text-brand text-right tabular-nums">
                          {formatRupiah(phase.totalPhaseCost)}
                        </td>
                      </tr>

                      {phase.modules.map((mod) => (
                        <tr key={mod.moduleId} className="hover:bg-well/40 transition-colors">
                          <td className="py-3 px-5 font-medium text-ink">{mod.name}</td>
                          <td className="py-3 px-3 text-right font-mono text-ink-secondary tabular-nums whitespace-nowrap">
                            {mod.volume} {mod.unitLabel}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-ink-secondary tabular-nums whitespace-nowrap">
                            {formatRupiah(mod.unitPrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-ink-secondary tabular-nums whitespace-nowrap">
                            {formatRupiah(mod.materialCost)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-ink-secondary tabular-nums whitespace-nowrap">
                            {formatRupiah(mod.laborCost)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-ink-secondary tabular-nums whitespace-nowrap">
                            {formatRupiah(mod.contingencyCost)}
                          </td>
                          <td className="py-3 px-5 text-right font-mono font-medium text-ink tabular-nums whitespace-nowrap">
                            {formatRupiah(mod.totalCost)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-hairline bg-well/50 text-sm font-semibold text-ink">
                  <td colSpan={3} className="py-3.5 px-5">
                    Total keseluruhan RAB pengembangan
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    {formatRupiah(valuation.totalMaterialCost)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    {formatRupiah(valuation.totalLaborCost)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    {formatRupiah(valuation.totalContingencyCost)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-brand tabular-nums whitespace-nowrap">
                    {formatRupiah(valuation.totalDevelopmentCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
