'use client';

import React, { useRef } from 'react';
import { ClusterSchemeResult } from '../lib/clusterScheme';
import { formatRupiah } from '../lib/formatters';
import { AnimatedNumber, useInViewOnce } from './AnimatedNumber';

interface ClusterSchemeChartsProps {
  result: ClusterSchemeResult;
  members: number;
  dailyContribution: number;
  regionShortLabel: string;
}

export const ClusterSchemeCharts: React.FC<ClusterSchemeChartsProps> = ({
  result,
  members,
  dailyContribution,
  regionShortLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(containerRef, 0.12);
  const pts = result.points;
  if (pts.length === 0) return null;

  // =========================================================================
  // CHART 1: Rumah Terwujud Kumulatif (Klaster + KPR FLPP vs Arisan Murni)
  // =========================================================================
  const W1 = 540;
  const H1 = 225;
  const PL1 = 52;
  const PR1 = 22;
  const PT1 = 22;
  const PB1 = 30;
  const plotW1 = W1 - PL1 - PR1;
  const plotH1 = H1 - PT1 - PB1;

  const maxYear = pts[pts.length - 1]?.year || 6;
  const xPos1 = (y: number) => PL1 + (y / Math.max(0.5, maxYear)) * plotW1;
  const yHouses1 = (h: number) => PT1 + plotH1 - (Math.min(members, h) / Math.max(1, members)) * plotH1;

  const clusterPath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos1(p.year).toFixed(1)} ${yHouses1(p.clusterKprHouses).toFixed(1)}`)
    .join(' ');
  const purePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos1(p.year).toFixed(1)} ${yHouses1(p.pureArisanHouses).toFixed(1)}`)
    .join(' ');
  const clusterArea = `${clusterPath} L ${xPos1(maxYear).toFixed(1)} ${(PT1 + plotH1).toFixed(1)} L ${xPos1(0).toFixed(1)} ${(PT1 + plotH1).toFixed(1)} Z`;

  const houseTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(members * f));

  // =========================================================================
  // CHART 2: Saldo Tabungan Klaster di Rekening BTN (Skema B)
  // =========================================================================
  const W2 = 540;
  const H2 = 225;
  const PL2 = 64;
  const PR2 = 20;
  const PT2 = 22;
  const PB2 = 30;
  const plotW2 = W2 - PL2 - PR2;
  const plotH2 = H2 - PT2 - PB2;

  const maxBalance = Math.max(1, ...pts.map((p) => p.savingsBalance)) * 1.12;
  const peakBalance = Math.max(...pts.map((p) => p.savingsBalance));
  const endBalance = pts[pts.length - 1]?.savingsBalance ?? 0;

  const xPos2 = (y: number) => PL2 + (y / Math.max(0.5, maxYear)) * plotW2;
  const yBal2 = (b: number) => PT2 + plotH2 - (b / maxBalance) * plotH2;

  const balPath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos2(p.year).toFixed(1)} ${yBal2(p.savingsBalance).toFixed(1)}`)
    .join(' ');
  const balArea = `${balPath} L ${xPos2(maxYear).toFixed(1)} ${(PT2 + plotH2).toFixed(1)} L ${xPos2(0).toFixed(1)} ${(PT2 + plotH2).toFixed(1)} Z`;

  const balTicks = [0, 0.33, 0.66, 1].map((f) => Math.round(maxBalance * f));

  // =========================================================================
  // CHART 3: Waktu Tunggu & Pembagian Iuran Harian Pasca Akad
  // =========================================================================
  const maxWait = Math.max(result.pure.lastWaitYears, result.cluster.lastWaitYears, 1);
  const installmentPct = Math.min(100, (result.installmentPerDay / Math.max(1, dailyContribution)) * 100);
  const renoPct = Math.max(0, 100 - installmentPct);

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Cumulative Houses Delivered */}
        <section
          aria-label="Grafik perbandingan rumah terwujud antara klaster KPR FLPP dan arisan murni"
          className="border border-hairline rounded-card bg-sheet p-5 flex flex-col justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                1. Rumah terwujud: Klaster + KPR FLPP vs Arisan murni
              </h3>
              <span className="px-2 py-0.5 rounded bg-well border border-hairline text-[11px] font-medium text-ink-secondary whitespace-nowrap">
                Simulasi {regionShortLabel}
              </span>
            </div>
            <p className="text-xs text-ink-secondary">
              Dengan tabungan kesiapan akad + KPR FLPP, seluruh{' '}
              <strong className="text-brand tabular-nums">
                {members.toLocaleString('id-ID')} peserta
              </strong>{' '}
              selesai dalam{' '}
              <strong className="text-brand tabular-nums">
                {result.cluster.lastWaitYears.toFixed(1).replace('.', ',')} thn
              </strong>{' '}
              dibanding{' '}
              <strong className="text-btnred tabular-nums">
                {result.pure.lastWaitYears.toFixed(1).replace('.', ',')} thn
              </strong>{' '}
              pada arisan murni.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-[2.5px] bg-brand inline-block" aria-hidden="true" />
              Arisan klaster + KPR FLPP
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0 border-t-2 border-dashed border-btnred inline-block" aria-hidden="true" />
              Arisan murni (beli tunai)
            </span>
          </div>

          <svg
            viewBox={`0 0 ${W1} ${H1}`}
            className="w-full h-auto block"
            role="img"
            aria-label="Grafik garis perbandingan jumlah rumah terwujud kumulatif per 0,5 tahun"
          >
            {houseTicks.map((val) => {
              const y = yHouses1(val);
              return (
                <g key={val}>
                  <line x1={PL1} y1={y} x2={W1 - PR1} y2={y} stroke="#E8EEF7" strokeWidth="1" />
                  <text
                    x={PL1 - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {val.toLocaleString('id-ID')}
                  </text>
                </g>
              );
            })}

            <line x1={PL1} y1={PT1 + plotH1} x2={W1 - PR1} y2={PT1 + plotH1} stroke="#CBD5E6" strokeWidth="1.2" />

            <g className={inView ? 'chart-reveal-x' : 'opacity-0'}>
              <path d={clusterArea} fill="#125EFA" fillOpacity="0.1" />
              <path d={purePath} fill="none" stroke="#DC0714" strokeWidth="2.2" strokeDasharray="5 4" />
              <path d={clusterPath} fill="none" stroke="#125EFA" strokeWidth="2.6" />
              {pts
                .filter((p) => Number.isInteger(p.year))
                .map((p) => (
                  <g key={`pt1-${p.year}`}>
                    <circle cx={xPos1(p.year)} cy={yHouses1(p.clusterKprHouses)} r="3" fill="#125EFA" />
                    <circle cx={xPos1(p.year)} cy={yHouses1(p.pureArisanHouses)} r="2.6" fill="#DC0714" />
                  </g>
                ))}
            </g>

            {pts
              .filter((p) => Number.isInteger(p.year))
              .map((p) => (
                <text
                  key={`x1-${p.year}`}
                  x={xPos1(p.year)}
                  y={H1 - 8}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  Thn {p.year}
                </text>
              ))}
          </svg>

          <div className="pt-3 border-t border-rule grid grid-cols-2 gap-3 text-xs tabular-nums">
            <div>
              <span className="text-ink-secondary block">Klaster + KPR (Thn {maxYear})</span>
              <strong className="text-brand">
                <AnimatedNumber
                  value={pts[pts.length - 1]?.clusterKprHouses ?? 0}
                  format={(n) => `${Math.round(n).toLocaleString('id-ID')} unit terwujud`}
                />
              </strong>
            </div>
            <div>
              <span className="text-ink-secondary block">Arisan murni (Thn {maxYear})</span>
              <strong className="text-btnred">
                <AnimatedNumber
                  value={pts[pts.length - 1]?.pureArisanHouses ?? 0}
                  format={(n) => `${Math.round(n).toLocaleString('id-ID')} unit terwujud`}
                />
              </strong>
            </div>
          </div>
        </section>

        {/* CHART 2: Savings Balance in BTN (CASA) */}
        <section
          aria-label="Grafik saldo tabungan klaster di rekening Bank BTN"
          className="border border-hairline rounded-card bg-sheet p-5 flex flex-col justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                2. Saldo tabungan peserta di Rekening BTN (CASA)
              </h3>
              <span className="px-2 py-0.5 rounded bg-well border border-hairline text-[11px] font-medium text-ink-secondary whitespace-nowrap">
                Simulasi Skema B
              </span>
            </div>
            <p className="text-xs text-ink-secondary">
              Tabungan tetap milik masing-masing peserta (bukan dana pooling tunai) untuk kesiapan akad lalu berlanjut menjadi saldo tabungan renovasi rumah tumbuh.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-ink-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-[2.5px] bg-positive inline-block" aria-hidden="true" />
              Total saldo tabungan klaster di BTN (Rp)
            </span>
          </div>

          <svg
            viewBox={`0 0 ${W2} ${H2}`}
            className="w-full h-auto block"
            role="img"
            aria-label="Grafik area akumulasi saldo tabungan peserta klaster di Bank BTN"
          >
            {balTicks.map((val, idx) => {
              const y = yBal2(val);
              return (
                <g key={idx}>
                  <line x1={PL2} y1={y} x2={W2 - PR2} y2={y} stroke="#E8EEF7" strokeWidth="1" />
                  <text
                    x={PL2 - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#64748B"
                    fontSize="9.5"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {formatRupiah(val, true).replace('Rp ', '')}
                  </text>
                </g>
              );
            })}

            <line x1={PL2} y1={PT2 + plotH2} x2={W2 - PR2} y2={PT2 + plotH2} stroke="#CBD5E6" strokeWidth="1.2" />

            <g className={inView ? 'chart-reveal-x-delayed' : 'opacity-0'}>
              <path d={balArea} fill="#0E8345" fillOpacity="0.12" />
              <path d={balPath} fill="none" stroke="#0E8345" strokeWidth="2.5" />
              {pts
                .filter((p) => Number.isInteger(p.year))
                .map((p) => (
                  <circle
                    key={`pt2-${p.year}`}
                    cx={xPos2(p.year)}
                    cy={yBal2(p.savingsBalance)}
                    r="3"
                    fill="#0E8345"
                  />
                ))}
            </g>

            {pts
              .filter((p) => Number.isInteger(p.year))
              .map((p) => (
                <text
                  key={`x2-${p.year}`}
                  x={xPos2(p.year)}
                  y={H2 - 8}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  Thn {p.year}
                </text>
              ))}
          </svg>

          <div className="pt-3 border-t border-rule grid grid-cols-2 gap-3 text-xs tabular-nums">
            <div>
              <span className="text-ink-secondary block">Puncak saldo tabungan (CASA)</span>
              <strong className="text-positive">
                <AnimatedNumber value={peakBalance} format={(n) => formatRupiah(n, true)} />
              </strong>
            </div>
            <div>
              <span className="text-ink-secondary block">Saldo di akhir Thn {maxYear}</span>
              <strong className="text-ink">
                <AnimatedNumber value={endBalance} format={(n) => formatRupiah(n, true)} />
              </strong>
            </div>
          </div>
        </section>
      </div>

      {/* CHART 3: Wait Time Comparison & Post-Akad Daily Contribution Split */}
      <section
        aria-label="Perbandingan waktu tunggu dan pembagian iuran harian setelah akad"
        className="border border-hairline rounded-card bg-sheet p-5 grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Left: Wait Time Comparison Bars */}
        <div className="space-y-3.5">
          <div>
            <h3 className="font-display text-[15px] font-semibold text-ink">
              3. Perbandingan waktu tunggu kepemilikan rumah
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              Selisih waktu tunggu rata-rata dan peserta terakhir antara Arisan Klaster + KPR FLPP vs Arisan Murni (simulasi).
            </p>
          </div>

          <div className="space-y-3 text-xs tabular-nums">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="font-medium text-ink">Rata-rata waktu tunggu</span>
                <span>
                  <strong className="text-brand">
                    {result.cluster.avgWaitYears.toFixed(1).replace('.', ',')} thn
                  </strong>{' '}
                  <span className="text-ink-secondary">vs</span>{' '}
                  <strong className="text-btnred">
                    {result.pure.avgWaitYears.toFixed(1).replace('.', ',')} thn
                  </strong>
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-well rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-brand rounded-full transition-[width] duration-500 ${
                      inView ? 'chart-bar-x' : 'scale-x-0'
                    }`}
                    style={{ width: `${Math.max(4, (result.cluster.avgWaitYears / maxWait) * 100)}%` }}
                  />
                </div>
                <div className="h-2.5 w-full bg-well rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-btnred/80 rounded-full transition-[width] duration-500 ${
                      inView ? 'chart-bar-x' : 'scale-x-0'
                    }`}
                    style={{
                      width: `${Math.max(4, (result.pure.avgWaitYears / maxWait) * 100)}%`,
                      animationDelay: '100ms',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="font-medium text-ink">Waktu tunggu peserta terakhir</span>
                <span>
                  <strong className="text-brand">
                    <AnimatedNumber
                      value={result.cluster.lastWaitYears}
                      format={(n) => `${n.toFixed(1).replace('.', ',')} thn`}
                    />
                  </strong>{' '}
                  <span className="text-ink-secondary">vs</span>{' '}
                  <strong className="text-btnred">
                    <AnimatedNumber
                      value={result.pure.lastWaitYears}
                      format={(n) => `${n.toFixed(1).replace('.', ',')} thn`}
                    />
                  </strong>
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-well rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-brand rounded-full transition-[width] duration-500 ${
                      inView ? 'chart-bar-x' : 'scale-x-0'
                    }`}
                    style={{
                      width: `${Math.max(4, (result.cluster.lastWaitYears / maxWait) * 100)}%`,
                      animationDelay: '160ms',
                    }}
                  />
                </div>
                <div className="h-2.5 w-full bg-well rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-btnred/80 rounded-full transition-[width] duration-500 ${
                      inView ? 'chart-bar-x' : 'scale-x-0'
                    }`}
                    style={{ width: '100%', animationDelay: '220ms' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Post-Akad Daily Contribution Allocation Bar */}
        <div className="space-y-3.5 lg:border-l lg:border-rule lg:pl-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-display text-[15px] font-semibold text-ink">
              Alokasi iuran harian setelah akad KPR FLPP
            </h3>
            <p className="text-xs text-ink-secondary">
              Dari iuran <strong className="text-ink">{formatRupiah(dailyContribution)}/hari</strong>, porsi angsuran KPR FLPP langsung terbayar dan sisanya mengalir otomatis ke tabungan renovasi rumah tumbuh.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="h-4 w-full bg-well rounded-full overflow-hidden flex gap-[2px]">
              <div
                className={`h-full transition-[width] duration-500 ${
                  result.contributionCoversInstallment ? 'bg-brand' : 'bg-btnred'
                } ${inView ? 'chart-bar-x' : 'scale-x-0'}`}
                style={{ width: `${installmentPct}%` }}
              />
              {renoPct > 0 && (
                <div
                  className={`h-full bg-positive transition-[width] duration-500 ${
                    inView ? 'chart-bar-x' : 'scale-x-0'
                  }`}
                  style={{ width: `${renoPct}%`, animationDelay: '180ms' }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
              <div className="p-2.5 rounded-control bg-brand-soft/60 border border-brand-border">
                <span className="text-ink-secondary block">Porsi angsuran KPR FLPP</span>
                <strong className={result.contributionCoversInstallment ? 'text-brand' : 'text-btnred'}>
                  <AnimatedNumber
                    value={Math.round(result.installmentPerDay)}
                    format={(n) => `${formatRupiah(Math.round(n))}/hari`}
                  />
                </strong>
                <span className="text-ink-secondary block">
                  (
                  <AnimatedNumber
                    value={result.monthlyInstallment}
                    format={(n) => `${formatRupiah(Math.round(n))}/bln`}
                  />
                  )
                </span>
              </div>
              <div className="p-2.5 rounded-control bg-positive-soft/70 border border-positive-border">
                <span className="text-ink-secondary block">Sisa ke tabungan renovasi</span>
                <strong className="text-positive">
                  <AnimatedNumber
                    value={Math.round(result.renovationSavingsPerDay)}
                    format={(n) => `${formatRupiah(Math.round(n))}/hari`}
                  />
                </strong>
                <span className="text-ink-secondary block">
                  (≈{' '}
                  <AnimatedNumber
                    value={Math.round(result.renovationSavingsPerDay * 30)}
                    format={(n) => `${formatRupiah(Math.round(n))}/bln`}
                  />
                  )
                </span>
              </div>
            </div>

            {!result.contributionCoversInstallment && (
              <p className="text-xs text-btnred font-medium">
                Iuran harian saat ini belum menutup estimasi angsuran KPR FLPP ({formatRupiah(Math.round(result.installmentPerDay))}/hari). Naikkan iuran harian atau perpanjang tenor.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
