'use client';

import React from 'react';
import {
  ExpansionModule,
  FloorRoom,
  HousingProfile,
  NfcPropertyRecord,
  ValuationSummary,
} from '../types';
import { formatRupiah, formatArea, formatPercent } from '../lib/formatters';
import { HouseBlueprint } from './HouseBlueprint';
import { BtnLogo } from './BtnLogo';
import { Printer, ArrowLeft } from 'lucide-react';

interface ProposalPrintViewProps {
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
  onSelectTemplate: (id: string) => void;
  onUpdateRoom: (roomId: string, patch: Partial<FloorRoom>, syncModuleVolume?: number) => void;
  onMirrorRooms: () => void;
  onResetLayout: () => void;
  onToggleModule: (id: string) => void;
  onBackToPlanner: () => void;
}

export const ProposalPrintView: React.FC<ProposalPrintViewProps> = ({
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
  onToggleModule,
  onBackToPlanner,
}) => {
  const currentDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-panel-enter">
      {/* Screen Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 no-print">
        <div>
          <h1 className="font-display text-[22px] font-bold text-ink tracking-[-0.015em] leading-snug">
            Ringkasan rencana siap cetak
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Pratinjau dokumen proposal A4 terverifikasi Kartu Kunci NFC lengkap dengan analisis penyusutan dan proyeksi renovasi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onBackToPlanner}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control border border-control bg-sheet hover:bg-well text-sm font-medium text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Kembali</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-control bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Printable A4 Executive Sheet */}
      <article className="border border-hairline rounded-card bg-sheet p-6 sm:p-8 space-y-7 print-sheet">
        <header className="pb-5 border-b-2 border-brand flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <BtnLogo size="md" showTagline />
            <p className="text-xs text-ink-secondary">
              Proposal Rencana Rumah Tumbuh, Valuasi Penyusutan Bangunan, RAB Bertahap, & Simulasi KPR BTN
            </p>
          </div>

          <div className="text-xs text-ink-secondary sm:text-right space-y-0.5">
            <div className="font-mono font-semibold text-brand">
              NFC UID: {activeNfcRecord.uid}
            </div>
            <div className="font-mono text-ink">
              Sertifikat: {activeNfcRecord.certificateNo}
            </div>
            <div>Tanggal: {currentDate}</div>
          </div>
        </header>

        {/* Section 1: Profil Hunian & Identitas Unit NFC */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-ink">
            1. Identitas unit rumah BTN & kondisi eksisting
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-control border border-hairline bg-well/60 text-sm">
            <div>
              <div className="text-xs text-ink-secondary">Pemilik & Klaster</div>
              <div className="font-medium text-ink mt-0.5">{profile.namaPemilik || '-'}</div>
              <div className="text-xs text-ink-secondary">{activeNfcRecord.unitBlock}</div>
            </div>
            <div>
              <div className="text-xs text-ink-secondary">Lokasi & Serah Terima</div>
              <div className="font-medium text-ink mt-0.5">{profile.lokasiKota || '-'}</div>
              <div className="text-xs text-ink-secondary">
                Bangun {profile.tahunDibangun} ({profile.usiaBangunanTahun} thn)
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-secondary">Luas tanah & eksisting</div>
              <div className="font-medium text-ink mt-0.5 tabular-nums">
                {formatArea(profile.luasTanah)} / {formatArea(profile.luasBangunanEksisting)}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-secondary">Luas pasca renovasi</div>
              <div className="font-medium text-ink mt-0.5 tabular-nums">
                {formatArea(valuation.totalBuildingArea)} (KDB {formatPercent(valuation.kdbRatio)})
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Rekapitulasi Valuasi (Awal, Setelah Penyusutan, & Setelah Renovasi) */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-ink">
            2. Valuasi properti: nilai awal, setelah penyusutan, & setelah renovasi
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-hairline rounded-control divide-y lg:divide-y-0 lg:divide-x divide-rule">
            <div className="p-3.5">
              <div className="text-xs text-ink-secondary">Nilai awal serah terima</div>
              <div className="mt-1 text-base font-semibold text-ink tabular-nums">
                {formatRupiah(valuation.initialPropertyValue)}
              </div>
              <div className="text-xs text-ink-secondary tabular-nums">
                Tanah {Math.round(profile.porsiNilaiTanah * 100)}% · Bangunan {Math.round((1 - profile.porsiNilaiTanah) * 100)}%
              </div>
            </div>
            <div className="p-3.5">
              <div className="text-xs text-ink-secondary">Nilai setelah penyusutan</div>
              <div className="mt-1 text-base font-semibold text-btnred tabular-nums">
                {formatRupiah(valuation.depreciatedPropertyValue)}
              </div>
              <div className="text-xs text-btnred tabular-nums">
                Susut -{formatRupiah(valuation.depreciationAmount, true)} (-{formatPercent(valuation.depreciationRate)})
              </div>
            </div>
            <div className="p-3.5">
              <div className="text-xs text-ink-secondary">Total biaya RAB bertahap</div>
              <div className="mt-1 text-base font-semibold text-brand tabular-nums">
                {formatRupiah(valuation.totalDevelopmentCost)}
              </div>
              <div className="text-xs text-ink-secondary tabular-nums">
                Termasuk kontingensi {formatPercent(profile.contingencyRate, 0)}
              </div>
            </div>
            <div className="p-3.5">
              <div className="text-xs text-ink-secondary">Nilai setelah renovasi</div>
              <div className="mt-1 text-base font-semibold text-positive tabular-nums">
                {formatRupiah(valuation.projectedNewPropertyValue)}
              </div>
              <div className="text-xs text-positive tabular-nums">
                Ekuitas {valuation.netAddedValue >= 0 ? '+' : ''}{formatRupiah(valuation.netAddedValue, true)} (ROI {valuation.roiPercentage.toFixed(1).replace('.', ',')}%)
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Compact Customized Architectural Plan */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-ink">
            3. Denah rumah tumbuh yang direncanakan ({floorView === 'lt1' ? 'Lantai 1' : 'Lantai 2'})
          </h3>
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
            compact
          />
        </section>

        {/* Section 4: Rincian Modul per Tahap */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-ink">
            4. Daftar modul & rincian RAB bertahap
          </h3>
          <div className="overflow-x-auto border border-hairline rounded-control">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-hairline bg-well text-ink-secondary">
                  <th className="py-2.5 px-3 font-medium">Tahap & modul</th>
                  <th className="py-2.5 px-3 font-medium text-right">Volume</th>
                  <th className="py-2.5 px-3 font-medium text-right">Material</th>
                  <th className="py-2.5 px-3 font-medium text-right">Upah</th>
                  <th className="py-2.5 px-3 font-medium text-right">Kontingensi</th>
                  <th className="py-2.5 px-3 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {valuation.phases.every((p) => p.modules.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-4 px-3 text-center text-ink-secondary">
                      Belum ada modul pengembangan yang dipilih (menampilkan kondisi rumah eksisting BTN).
                    </td>
                  </tr>
                ) : (
                  valuation.phases.map((phase) =>
                    phase.modules.map((mod) => (
                      <tr key={mod.moduleId}>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-ink">{mod.name}</span>
                          <span className="text-ink-secondary ml-1.5">
                            ({phase.phaseName.split(':')[0]})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-ink-secondary">
                          {mod.volume} {mod.unitLabel}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-ink-secondary">
                          {formatRupiah(mod.materialCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-ink-secondary">
                          {formatRupiah(mod.laborCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-ink-secondary">
                          {formatRupiah(mod.contingencyCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-ink tabular-nums">
                          {formatRupiah(mod.totalCost)}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-hairline bg-well/60 font-semibold text-ink">
                  <td colSpan={2} className="py-2.5 px-3">
                    Total biaya pengembangan
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatRupiah(valuation.totalMaterialCost)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatRupiah(valuation.totalLaborCost)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatRupiah(valuation.totalContingencyCost)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-brand tabular-nums">
                    {formatRupiah(valuation.totalDevelopmentCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Section 5: Simulasi Cicilan & Tabungan */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-ink">
            5. Opsi pembiayaan renovasi (asumsi bunga pasar) & tabungan bertahap
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-hairline rounded-control overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-well text-ink-secondary">
                    <th className="py-2 px-3 font-medium">Tenor simulasi</th>
                    <th className="py-2 px-3 font-medium text-right">Asumsi bunga p.a.</th>
                    <th className="py-2 px-3 font-medium text-right">Cicilan / bln</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {valuation.financingOptions.map((f) => (
                    <tr key={f.tenorMonths}>
                      <td className="py-2 px-3 font-medium text-ink">{f.tenorMonths} bulan</td>
                      <td className="py-2 px-3 text-right text-ink-secondary tabular-nums">
                        {(f.annualInterestRate * 100).toFixed(2).replace('.', ',')}%
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-ink tabular-nums">
                        {formatRupiah(f.monthlyInstallment)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-hairline rounded-control overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-well text-ink-secondary">
                    <th className="py-2 px-3 font-medium">Target menabung</th>
                    <th className="py-2 px-3 font-medium text-right">Setoran / bln</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {valuation.savingOptions.map((s) => (
                    <tr key={s.targetMonths}>
                      <td className="py-2 px-3 font-medium text-ink">{s.targetMonths} bulan mandiri</td>
                      <td className="py-2 px-3 text-right font-medium text-ink tabular-nums">
                        {formatRupiah(s.monthlySavingsNeeded)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <footer className="pt-4 border-t border-rule text-xs text-ink-secondary leading-relaxed">
          Dokumen ini dihasilkan secara deterministik oleh btn TumbuhLayak berbasis asumsi simulasi heuristik (porsi tanah, pengali kondisi, sinergi ruang, dan asumsi suku bunga pasar) yang terhubung dengan Kartu Kunci NFC ({activeNfcRecord.uid}). Estimasi penyusutan & proyeksi nilai merupakan simulasi perencanaan mandiri dan bukan laporan resmi KJPP maupun penawaran resmi suku bunga Bank BTN.
        </footer>
      </article>
    </div>
  );
};
