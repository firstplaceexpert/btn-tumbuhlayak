'use client';

import React, { useRef } from 'react';
import { DailyArisanSimulationResult } from '../types';
import { formatRupiah } from '../lib/formatters';
import { AnimatedNumber, useInViewOnce } from './AnimatedNumber';

interface ArisanChartsProps {
  sim: DailyArisanSimulationResult;
  regionShortLabel: string;
}

export const ArisanCharts: React.FC<ArisanChartsProps> = ({ sim, regionShortLabel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(containerRef, 0.12);
  const data = sim.yearlySchedule;
  if (data.length === 0) return null;

  // =========================================================================
  // CHART 1: Laju Serah Terima Rumah/Hari (Bar) vs Harga Rumah Proyeksi (Line)
  // =========================================================================
  const W1 = 560;
  const H1 = 220;
  const PL1 = 44;
  const PR1 = 54;
  const PT1 = 22;
  const PB1 = 30;
  const plotW1 = W1 - PL1 - PR1;
  const plotH1 = H1 - PT1 - PB1;

  const maxUnitsDay = Math.max(2.0, ...data.map((d) => d.unitsPerDay)) * 1.15;
  const minPrice = Math.min(...data.map((d) => d.housePriceInYear)) * 0.9;
  const maxPrice = Math.max(...data.map((d) => d.housePriceInYear)) * 1.08;

  const barStep = plotW1 / data.length;
  const barW = Math.max(8, Math.min(26, barStep * 0.56));

  const xCenter1 = (i: number) => PL1 + i * barStep + barStep / 2;
  const yBar1 = (u: number) => PT1 + plotH1 - (u / maxUnitsDay) * plotH1;
  const yPrice1 = (p: number) =>
    PT1 + plotH1 - ((p - minPrice) / Math.max(1, maxPrice - minPrice)) * plotH1;

  const priceLinePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xCenter1(i).toFixed(1)} ${yPrice1(d.housePriceInYear).toFixed(1)}`)
    .join(' ');

  const yUnitTicks = [0, 0.5, 1, 1.5, 2].filter((t) => t <= maxUnitsDay);
  const maxTickVal = Number(maxUnitsDay.toFixed(1));
  if (yUnitTicks[yUnitTicks.length - 1] < maxTickVal - 0.35) {
    yUnitTicks.push(Math.ceil(maxUnitsDay * 2) / 2);
  }

  // Decide label stride so X-axis stays super clean even for 20-year simulations
  const xLabelStride = data.length > 14 ? 3 : data.length > 9 ? 2 : 1;

  // =========================================================================
  // CHART 2: Akumulasi Gen-Z Punya Rumah Menuju 100% Kuota
  // =========================================================================
  const W2 = 520;
  const H2 = 220;
  const PL2 = 48;
  const PR2 = 20;
  const PT2 = 22;
  const PB2 = 30;
  const plotW2 = W2 - PL2 - PR2;
  const plotH2 = H2 - PT2 - PB2;

  const xPos2 = (i: number) =>
    PL2 + (i / Math.max(1, data.length - 1)) * plotW2;
  const yPct2 = (pct: number) => PT2 + plotH2 - (Math.min(100, pct) / 100) * plotH2;

  const cumLinePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos2(i).toFixed(1)} ${yPct2(d.cumulativePercent).toFixed(1)}`)
    .join(' ');

  const cumAreaPath = `${cumLinePath} L ${xPos2(data.length - 1).toFixed(1)} ${(PT2 + plotH2).toFixed(1)} L ${xPos2(0).toFixed(1)} ${(PT2 + plotH2).toFixed(1)} Z`;

  const savingVsKpr = sim.kprFlpp20YrTotalPayment - sim.projectedContractPrice;

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CHART 1: Units/Day Acceleration vs Property Inflation */}
      <section
        aria-label="Grafik laju penyerahan rumah per hari dibanding kenaikan harga properti"
        className="border border-hairline rounded-card bg-sheet p-5 flex flex-col justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-[15px] font-semibold text-ink">
              Laju jual rumah/hari vs kenaikan harga ({regionShortLabel})
            </h3>
          </div>
          <p className="text-xs text-ink-secondary">
            Tahun awal menghasilkan hingga{' '}
            <strong className="text-brand tabular-nums">
              {sim.year1UnitsPerDay.toFixed(2).replace('.', ',')} rumah/hari
            </strong>{' '}
            karena harga properti masih di level awal ({formatRupiah(sim.baseHousePrice, true)}) sementara arus kas harian sudah penuh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-[2px] bg-brand inline-block" aria-hidden="true" />
            Penyerahan rumah / hari (sumbu kiri)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-[2.5px] bg-btnred inline-block" aria-hidden="true" />
            Proyeksi harga rumah (sumbu kanan)
          </span>
        </div>

        <svg
          viewBox={`0 0 ${W1} ${H1}`}
          className="w-full h-auto block"
          role="img"
          aria-label="Grafik batang penyerahan rumah per hari dan garis kenaikan harga rumah subsidi per tahun"
        >
          {/* Horizontal Gridlines & Left Y-Axis (Units/Day) */}
          {yUnitTicks.map((val) => {
            const y = yBar1(val);
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
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Right Y-Axis Price Labels (Start & End) */}
          <text
            x={W1 - PR1 + 6}
            y={yPrice1(sim.baseHousePrice) + 3.5}
            textAnchor="start"
            fill="#DC0714"
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
          >
            {formatRupiah(sim.baseHousePrice, true).replace('Rp ', '')}
          </text>
          {sim.finalYearHousePrice > sim.baseHousePrice && (
            <text
              x={W1 - PR1 + 6}
              y={Math.max(PT1 + 6, yPrice1(sim.finalYearHousePrice) + 3.5)}
              textAnchor="start"
              fill="#DC0714"
              fontSize="9.5"
              fontWeight="600"
              fontFamily="IBM Plex Mono, monospace"
            >
              {formatRupiah(sim.finalYearHousePrice, true).replace('Rp ', '')}
            </text>
          )}

          {/* Baseline */}
          <line x1={PL1} y1={PT1 + plotH1} x2={W1 - PR1} y2={PT1 + plotH1} stroke="#CBD5E6" strokeWidth="1.2" />

          {/* Bars: Units Handed Over / Day */}
          {data.map((d, i) => {
            const cx = xCenter1(i);
            const yTop = yBar1(d.unitsPerDay);
            const h = Math.max(2, PT1 + plotH1 - yTop);
            const isAccelerated = d.unitsPerDay >= 1.25;
            return (
              <g key={d.year}>
                <rect
                  x={cx - barW / 2}
                  y={yTop}
                  width={barW}
                  height={h}
                  rx="3"
                  fill={isAccelerated ? '#125EFA' : '#7AA8FD'}
                  className={inView ? 'chart-bar-y' : 'opacity-0'}
                  style={{ animationDelay: `${Math.min(i * 35, 420)}ms` }}
                />
                {i === 0 && (
                  <text
                    x={cx}
                    y={Math.max(12, yTop - 5)}
                    textAnchor="middle"
                    fill="#082D7F"
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {d.unitsPerDay.toFixed(2)}
                  </text>
                )}
                {(i % xLabelStride === 0 || i === data.length - 1) && (
                  <text
                    x={cx}
                    y={H1 - 8}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    T{d.year}
                  </text>
                )}
              </g>
            );
          })}

          {/* Overlay Line: House Price Rising with Inflation */}
          <g className={inView ? 'chart-reveal-x-delayed' : 'opacity-0'}>
            <path d={priceLinePath} fill="none" stroke="#DC0714" strokeWidth="2.2" />
            {data.map((d, i) => (
              <circle
                key={`dot-${d.year}`}
                cx={xCenter1(i)}
                cy={yPrice1(d.housePriceInYear)}
                r={i === 0 || i === data.length - 1 ? 3.5 : 2.2}
                fill="#DC0714"
              />
            ))}
          </g>
        </svg>

        <div className="pt-3 border-t border-rule grid grid-cols-3 gap-2 text-xs tabular-nums">
          <div>
            <span className="text-ink-secondary block">Tahun ke-1</span>
            <strong className="text-brand">
              <AnimatedNumber
                value={sim.year1UnitsPerDay}
                format={(n) => `${n.toFixed(2).replace('.', ',')} unit/hari`}
              />
            </strong>
          </div>
          <div>
            <span className="text-ink-secondary block">Rata-rata siklus</span>
            <strong className="text-ink">
              <AnimatedNumber
                value={sim.avgUnitsPerDay}
                format={(n) => `${n.toFixed(2).replace('.', ',')} unit/hari`}
              />
            </strong>
          </div>
          <div>
            <span className="text-ink-secondary block">Harga akhir Thn {data.length}</span>
            <strong className="text-btnred">
              <AnimatedNumber value={sim.finalYearHousePrice} format={(n) => formatRupiah(n, true)} />
            </strong>
          </div>
        </div>
      </section>

      {/* CHART 2: Cumulative Ownership Curve & Gen-Z Cost Advantage */}
      <section
        aria-label="Kurva akumulasi kepemilikan rumah peserta menuju 100 persen kuota"
        className="border border-hairline rounded-card bg-sheet p-5 flex flex-col justify-between gap-4"
      >
        <div className="space-y-1">
          <h3 className="font-display text-[15px] font-semibold text-ink">
            Progres kepemilikan rumah peserta (menuju 100% kuota)
          </h3>
          <p className="text-xs text-ink-secondary">
            Total{' '}
            <strong className="text-positive tabular-nums">
              {sim.totalUnitsFunded.toLocaleString('id-ID')} dari{' '}
              {sim.quotaMembers.toLocaleString('id-ID')} peserta ({sim.coveragePercent.toFixed(1).replace('.', ',')}%)
            </strong>{' '}
            menerima rumah dalam {sim.cycleYears.toFixed(1).replace('.', ',')} tahun (total setor{' '}
            <strong className="text-ink tabular-nums">
              {formatRupiah(sim.projectedContractPrice, true)}
            </strong>{' '}
            vs KPR FLPP 20 thn{' '}
            <strong className="text-ink tabular-nums">
              {formatRupiah(sim.kprFlpp20YrTotalPayment, true)}
            </strong>
            ).
          </p>
        </div>

        <svg
          viewBox={`0 0 ${W2} ${H2}`}
          className="w-full h-auto block"
          role="img"
          aria-label="Grafik area akumulasi persentase peserta arisan yang sudah menerima rumah"
        >
          {/* Horizontal Percent Ticks */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = yPct2(pct);
            return (
              <g key={pct}>
                <line
                  x1={PL2}
                  y1={y}
                  x2={W2 - PR2}
                  y2={y}
                  stroke={pct === 100 ? '#B7E6CA' : '#E8EEF7'}
                  strokeDasharray={pct === 100 ? '4 3' : undefined}
                  strokeWidth="1"
                />
                <text
                  x={PL2 - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fill={pct === 100 ? '#0E8345' : '#64748B'}
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line x1={PL2} y1={PT2 + plotH2} x2={W2 - PR2} y2={PT2 + plotH2} stroke="#CBD5E6" strokeWidth="1.2" />

          {/* Area Fill & Curve */}
          <g className={inView ? 'chart-reveal-x-delayed' : 'opacity-0'}>
            <path d={cumAreaPath} fill="#125EFA" fillOpacity="0.11" />
            <path d={cumLinePath} fill="none" stroke="#125EFA" strokeWidth="2.5" />
            {data.map((d, i) =>
              i === data.length - 1 || i === Math.floor(data.length / 2) ? (
                <circle
                  key={`cum-pt-${d.year}`}
                  cx={xPos2(i)}
                  cy={yPct2(d.cumulativePercent)}
                  r={i === data.length - 1 ? 4.2 : 3}
                  fill={i === data.length - 1 && sim.isBalanced ? '#0E8345' : '#125EFA'}
                />
              ) : null
            )}
          </g>

          {/* Year Ticks */}
          {data.map((d, i) =>
            i % xLabelStride === 0 || i === data.length - 1 ? (
              <text
                key={`cum-lbl-${d.year}`}
                x={xPos2(i)}
                y={H2 - 8}
                textAnchor="middle"
                fill="#64748B"
                fontSize="10"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                T{d.year}
              </text>
            ) : null
          )}
        </svg>

        {/* Crisp Gen-Z Comparison: Arisan Harian vs KPR FLPP 20 Tahun */}
        <div className="pt-3 border-t border-rule grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs tabular-nums">
          <div className="p-2.5 rounded-control bg-brand-soft/60 border border-brand-border">
            <span className="text-ink-secondary block">Total setor arisan murni</span>
            <strong className="text-brand text-[13px]">
              {formatRupiah(sim.projectedContractPrice, true)}
            </strong>
            <span className="text-ink-secondary block">
              {sim.cycleYears.toFixed(1).replace('.', ',')} thn · termasuk markup +{Math.round(sim.markupRate * 100)}%
            </span>
          </div>
          <div className="p-2.5 rounded-control bg-well border border-hairline">
            <span className="text-ink-secondary block">Pembanding KPR 20 thn</span>
            <strong className="text-ink text-[13px]">
              {formatRupiah(sim.kprFlpp20YrTotalPayment, true)}
            </strong>
            <span className="text-ink-secondary block">
              FLPP 5% ({formatRupiah(sim.kprFlppMonthlyInstallment)}/bln)
            </span>
          </div>
          <div className="p-2.5 rounded-control bg-positive-soft/70 border border-positive-border">
            <span className="text-ink-secondary block">Selisih biaya & waktu</span>
            <strong className={savingVsKpr >= 0 ? 'text-positive text-[13px]' : 'text-ochre text-[13px]'}>
              {savingVsKpr >= 0
                ? `Hemat ${formatRupiah(savingVsKpr, true)}`
                : `+${formatRupiah(Math.abs(savingVsKpr), true)}`}
            </strong>
            <span className="text-positive block font-medium">
              {sim.cycleYears < 20
                ? `${(20 - sim.cycleYears).toFixed(1).replace('.', ',')} thn lebih cepat`
                : 'Sesuaikan iuran harian'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
