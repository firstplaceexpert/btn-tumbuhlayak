'use client';

import React from 'react';
import { ValuationSummary } from '../types';
import { formatRupiah, formatPercent } from '../lib/formatters';

interface VisualChartsProps {
  valuation: ValuationSummary;
}

export const VisualCharts: React.FC<VisualChartsProps> = ({ valuation }) => {
  const {
    initialPropertyValue,
    depreciationAmount,
    depreciatedPropertyValue,
    totalDevelopmentCost,
    netAddedValue,
    projectedNewPropertyValue,
    fiveYearProjection,
    phases,
  } = valuation;

  const maxCompare = Math.max(
    initialPropertyValue,
    depreciatedPropertyValue,
    projectedNewPropertyValue,
    1
  );

  const maxPhaseCost = Math.max(...phases.map((p) => p.totalPhaseCost), 1);

  // 5-Year SVG Line Chart geometry (clean, app-screens.md compliant)
  const W = 480;
  const H = 165;
  const PL = 62;
  const PR = 18;
  const PT = 16;
  const PB = 28;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;

  const allVals = fiveYearProjection.flatMap((p) => [
    p.withoutRenovationValue,
    p.withRenovationValue,
  ]);
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const yMin = Math.max(0, Math.floor((rawMin * 0.88) / 25000000) * 25000000);
  const yMax = Math.max(yMin + 50000000, Math.ceil((rawMax * 1.08) / 25000000) * 25000000);

  const xPos = (idx: number) =>
    PL + (idx / Math.max(1, fiveYearProjection.length - 1)) * plotW;
  const yPos = (val: number) =>
    PT + plotH - ((val - yMin) / Math.max(1, yMax - yMin)) * plotH;

  const withoutLine = fiveYearProjection
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(p.withoutRenovationValue).toFixed(1)}`)
    .join(' ');
  const withLine = fiveYearProjection
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(p.withRenovationValue).toFixed(1)}`)
    .join(' ');

  const yTicks = [0, 0.33, 0.66, 1].map((t) => Math.round(yMin + (yMax - yMin) * t));

  return (
    <div className="space-y-6">
      {/* 1. Perbandingan Nilai Properti: Awal vs Setelah Penyusutan vs Setelah Renovasi */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold text-ink">
            Perbandingan nilai properti (susut vs renovasi)
          </h3>
          <span className="text-sm font-semibold text-brand tabular-nums">
            {formatRupiah(projectedNewPropertyValue)}
          </span>
        </div>

        <div className="space-y-2.5 text-[13px]">
          {/* Bar 1: Initial Handover Value */}
          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-ink-secondary">Nilai awal serah terima (baru)</span>
              <span className="font-medium text-ink tabular-nums">
                {formatRupiah(initialPropertyValue)}
              </span>
            </div>
            <div className="h-2.5 w-full bg-well rounded-full overflow-hidden">
              <div
                className="h-full bg-[#475569] rounded-full transition-[width] duration-500"
                style={{ width: `${(initialPropertyValue / maxCompare) * 100}%` }}
              />
            </div>
          </div>

          {/* Bar 2: Current Depreciated Value */}
          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-btnred font-medium">
                Nilai saat ini setelah penyusutan (-{formatPercent(valuation.depreciationRate)})
              </span>
              <span className="font-semibold text-btnred tabular-nums">
                {formatRupiah(depreciatedPropertyValue)}
              </span>
            </div>
            <div className="h-2.5 w-full bg-well rounded-full overflow-hidden">
              <div
                className="h-full bg-btnred rounded-full transition-[width] duration-500"
                style={{ width: `${(depreciatedPropertyValue / maxCompare) * 100}%` }}
              />
            </div>
          </div>

          {/* Bar 3: Projected Value After Renovation */}
          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-brand font-semibold">
                Proyeksi nilai setelah renovasi (rumah tumbuh)
              </span>
              <span className="font-semibold text-brand tabular-nums">
                {formatRupiah(projectedNewPropertyValue)}
              </span>
            </div>
            <div className="h-3 w-full bg-well rounded-full overflow-hidden flex gap-[2px]">
              <div
                className="h-full bg-brand transition-[width] duration-500"
                style={{
                  width: `${((depreciatedPropertyValue + totalDevelopmentCost) / maxCompare) * 100}%`,
                }}
              />
              {netAddedValue > 0 && (
                <div
                  className="h-full bg-positive transition-[width] duration-500"
                  style={{
                    width: `${Math.max(3, (netAddedValue / maxCompare) * 100)}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Crisp Valuation Reconciliation Ledger */}
        <div className="divide-y divide-rule text-xs pt-1">
          <div className="py-1.5 flex justify-between gap-2">
            <span className="text-ink-secondary">
              Akumulasi penyusutan fisik bangunan (tanah tidak menyusut)
            </span>
            <span className="font-mono font-semibold text-btnred tabular-nums">
              -{formatRupiah(depreciationAmount)}
            </span>
          </div>
          <div className="py-1.5 flex justify-between gap-2">
            <span className="text-ink-secondary">
              Pemulihan penyusutan akibat peremajaan + sinergi {valuation.synergyFactor.toFixed(2)}x
            </span>
            <span className="font-mono font-semibold text-positive tabular-nums">
              +{formatRupiah(valuation.depreciationRecovery)}
            </span>
          </div>
          <div className="py-1.5 flex items-baseline justify-between gap-2">
            <span className="text-ink font-medium">
              Nilai tambah bersih (ekuitas pasca renovasi)
            </span>
            <span
              className={`font-mono font-semibold tabular-nums whitespace-nowrap flex-shrink-0 ${
                netAddedValue >= 0 ? 'text-positive' : 'text-btnred'
              }`}
            >
              {netAddedValue >= 0 ? '+' : ''}
              {formatRupiah(netAddedValue)} ({valuation.roiPercentage.toFixed(1).replace('.', ',')}% ROI)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Kurva Proyeksi 5 Tahun: Tanpa Renovasi vs Dengan Rumah Tumbuh */}
      <div className="pt-4 border-t border-rule space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-[14px] font-semibold text-ink">
            Proyeksi nilai 5 tahun (apresiasi tanah vs penyusutan)
          </h3>
          <div className="flex items-center gap-3 text-xs text-ink-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-[2.5px] bg-brand inline-block" aria-hidden="true" />
              Dengan renovasi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0 border-t-2 border-dashed border-btnred inline-block" aria-hidden="true" />
              Tanpa renovasi
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block"
          role="img"
          aria-label="Grafik proyeksi nilai properti 5 tahun dengan renovasi dibandingkan tanpa renovasi"
        >
          {/* Horizontal gridlines + Y ticks */}
          {yTicks.map((val, idx) => {
            const y = yPos(val);
            return (
              <g key={idx}>
                <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#E5EAF2" strokeWidth="1" />
                <text
                  x={PL - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="10.5"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {formatRupiah(val, true).replace('Rp ', '')}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line x1={PL} y1={PT + plotH} x2={W - PR} y2={PT + plotH} stroke="#CBD5E6" strokeWidth="1.2" />

          {/* X-axis year labels */}
          {fiveYearProjection.map((p, i) => (
            <text
              key={p.yearOffset}
              x={xPos(i)}
              y={H - 8}
              textAnchor="middle"
              fill="#64748B"
              fontSize="10.5"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {p.yearLabel}
            </text>
          ))}

          {/* Unrenovated Depreciating Line (BTN Red dashed) */}
          <path
            d={withoutLine}
            fill="none"
            stroke="#DC0714"
            strokeWidth="2"
            strokeDasharray="5 4"
          />

          {/* Renovated Growth Line (BTN Blue solid) */}
          <path d={withLine} fill="none" stroke="#125EFA" strokeWidth="2.5" />

          {/* End-point dots */}
          {fiveYearProjection.length > 0 && (
            <>
              <circle
                cx={xPos(fiveYearProjection.length - 1)}
                cy={yPos(fiveYearProjection[fiveYearProjection.length - 1].withRenovationValue)}
                r="4"
                fill="#125EFA"
              />
              <circle
                cx={xPos(fiveYearProjection.length - 1)}
                cy={yPos(fiveYearProjection[fiveYearProjection.length - 1].withoutRenovationValue)}
                r="3.5"
                fill="#DC0714"
              />
            </>
          )}
        </svg>
      </div>

      {/* 3. Distribusi Biaya per Tahap */}
      <div className="pt-4 border-t border-rule space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-[14px] font-semibold text-ink">
            Distribusi biaya RAB per tahap
          </h3>
          <div className="flex items-center gap-3 text-xs text-ink-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-brand" aria-hidden="true" />
              Material
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-ochre-mid" aria-hidden="true" />
              Upah
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-tealarch" aria-hidden="true" />
              Kontingensi
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {phases.map((phase) => {
            const hasItems = phase.modules.length > 0;
            const matW = hasItems ? (phase.subtotalMaterial / maxPhaseCost) * 100 : 0;
            const labW = hasItems ? (phase.subtotalLabor / maxPhaseCost) * 100 : 0;
            const contW = hasItems ? (phase.contingencyCost / maxPhaseCost) * 100 : 0;

            return (
              <div key={phase.phaseId} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <div className="min-w-0">
                    <span className="font-medium text-ink">
                      {phase.phaseName.split(':')[0]}
                    </span>
                    <span className="text-xs text-ink-secondary ml-2">
                      {phase.targetTimeline} · {phase.modules.length} modul
                    </span>
                  </div>
                  <span
                    className={`tabular-nums text-right ${
                      hasItems ? 'font-semibold text-ink' : 'text-ink-subtle'
                    }`}
                  >
                    {formatRupiah(phase.totalPhaseCost)}
                  </span>
                </div>

                <div className="h-2 w-full bg-well rounded-full overflow-hidden flex gap-[1px]">
                  {hasItems && (
                    <>
                      <div
                        className="h-full bg-brand transition-[width] duration-500"
                        style={{ width: `${matW}%` }}
                      />
                      <div
                        className="h-full bg-ochre-mid transition-[width] duration-500"
                        style={{ width: `${labW}%` }}
                      />
                      <div
                        className="h-full bg-tealarch transition-[width] duration-500"
                        style={{ width: `${contW}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
