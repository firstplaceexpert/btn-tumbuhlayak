'use client';

import React, { useState } from 'react';
import { BtnHousingProject } from '../types';
import { calculateDailyOneHouseModel } from '../lib/dailyArisanEngine';
import { formatRupiah } from '../lib/formatters';
import {
  ArrowRight,
  BedDouble,
  Bath,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Heart,
  Maximize2,
  Users,
} from 'lucide-react';

interface PropertyArisanCardProps {
  project: BtnHousingProject;
  /** Override current registered count (e.g., after user joins or simulates 100% quota) */
  registeredOverride?: number;
  isSelected?: boolean;
  isJoined?: boolean;
  actionLabel?: string;
  onAction?: (project: BtnHousingProject) => void;
  onSimulateFull?: (project: BtnHousingProject) => void;
}

export const PropertyArisanCard: React.FC<PropertyArisanCardProps> = ({
  project,
  registeredOverride,
  isSelected = false,
  isJoined = false,
  actionLabel = 'Ikut Arisan Unit Ini',
  onAction,
  onSimulateFull,
}) => {
  const [favorited, setFavorited] = useState(false);

  const currentRegistered = registeredOverride ?? project.registeredMembers;
  const model = calculateDailyOneHouseModel(
    project.price,
    project.dailyContribution,
    currentRegistered
  );

  const formattedPrice = `Rp${project.price.toLocaleString('id-ID')}`;
  const yearsText = model.cycleYears.toFixed(1).replace('.', ',');

  return (
    <article
      className={`group rounded-[18px] bg-sheet border overflow-hidden flex flex-col transition-all ${
        isSelected
          ? 'border-brand ring-2 ring-brand/15 shadow-[0_14px_30px_-14px_rgba(27,86,198,0.28)]'
          : 'border-hairline shadow-[0_8px_22px_-14px_rgba(31,36,43,0.14)] hover:border-brand-border hover:shadow-[0_14px_28px_-14px_rgba(27,86,198,0.2)]'
      }`}
    >
      {/* Top House Photo Frame (Inspired by BTN Properti Listing Card) */}
      <div className="relative aspect-[16/10] w-full bg-[#ECEAE4] overflow-hidden">
        <img
          src={project.imageUrl}
          alt={`Foto rumah ${project.name} (${project.houseType}) di ${project.city}`}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 block"
        />

        {/* Top-Left Badge Row */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-[8px] bg-brand text-white text-[11px] font-display font-bold tracking-wide shadow-sm">
            RUMAH
          </span>
          <span className="px-2 py-1 rounded-[8px] bg-sheet/95 backdrop-blur-sm text-ink text-[11px] font-semibold border border-white/60 shadow-sm">
            {project.houseType}
          </span>
        </div>

        {/* Top-Right Favorite Toggle */}
        <button
          type="button"
          onClick={() => setFavorited((prev) => !prev)}
          aria-label={favorited ? `Hapus ${project.name} dari favorit` : `Simpan ${project.name} ke favorit`}
          aria-pressed={favorited}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-sheet/92 backdrop-blur-sm border border-white/70 flex items-center justify-center text-ink-secondary hover:text-btnred shadow-sm transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${favorited ? 'fill-btnred text-btnred' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* Bottom-Left Status Tag */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
          {model.isReadyToStart ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-positive text-white text-[11px] font-semibold shadow-sm">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              Kuota Penuh · Undian Harian Aktif
            </span>
          ) : project.highlightTag ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-ochre text-white text-[11px] font-semibold shadow-sm">
              {project.highlightTag}
            </span>
          ) : (
            <span />
          )}

          <span className="px-2 py-0.5 rounded-full bg-ink/75 text-white text-[10px] font-medium backdrop-blur-sm">
            1 rumah / hari
          </span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          {/* City + Project Name + Price */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs text-ink-secondary">
              <span className="truncate">{project.city}</span>
              <span className="text-[11px] font-semibold text-positive whitespace-nowrap">
                {project.categoryLabel}
              </span>
            </div>

            <h3 className="font-display text-[17px] font-extrabold text-ink tracking-[-0.01em] leading-snug uppercase">
              {project.name}
            </h3>

            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-xs text-ink-secondary">Mulai dari</span>
              <span className="font-display text-lg font-extrabold text-brand tabular-nums">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* Quick Spec Pills */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11.5px] text-ink-secondary">
            <span className="inline-flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-ink-subtle" aria-hidden="true" />
              LB {project.luasBangunan} / LT {project.luasTanah} m²
            </span>
            <span className="inline-flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-ink-subtle" aria-hidden="true" />
              {project.bedrooms} KT
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-ink-subtle" aria-hidden="true" />
              {project.bathrooms} KM
            </span>
          </div>

          {/* Arisan Harian Formula Highlight Box */}
          <div className="p-3.5 rounded-[12px] bg-brand-soft/65 border border-brand-border/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                <CalendarClock className="w-3.5 h-3.5 text-brand flex-shrink-0" aria-hidden="true" />
                Iuran Arisan Harian
              </span>
              <span className="font-display text-sm font-bold text-brand tabular-nums">
                {formatRupiah(project.dailyContribution)} / hari
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-ink-secondary">Lama siklus lunas</span>
              <strong className="font-mono text-ink tabular-nums">
                {yearsText} tahun ({model.cycleDays.toLocaleString('id-ID')} hari)
              </strong>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs pt-1.5 border-t border-brand-border/50">
              <span className="text-ink-secondary">Target kuota (1 rumah/hr)</span>
              <strong className="font-mono text-ink tabular-nums">
                {model.requiredQuota.toLocaleString('id-ID')} peserta
              </strong>
            </div>
          </div>

          {/* Remaining Quota Progress Bar (Core User Requirement #5) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
              <span className="inline-flex items-center gap-1 font-medium text-ink">
                <Users className="w-3.5 h-3.5 text-brand flex-shrink-0" aria-hidden="true" />
                {model.registeredMembers.toLocaleString('id-ID')} /{' '}
                {model.requiredQuota.toLocaleString('id-ID')} orang
              </span>
              <span
                className={`font-mono font-bold ${
                  model.isReadyToStart ? 'text-positive' : 'text-btnred'
                }`}
              >
                {model.quotaProgressPercent}%
              </span>
            </div>

            <div className="h-2 w-full bg-well rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${
                  model.isReadyToStart ? 'bg-positive' : 'bg-brand'
                }`}
                style={{ width: `${model.quotaProgressPercent}%` }}
              />
            </div>

            <div className="text-xs leading-snug">
              {model.isReadyToStart ? (
                <span className="font-semibold text-positive">
                  Kuota terpenuhi 100% — undian 1 rumah setiap hari sudah berjalan!
                </span>
              ) : (
                <span className="text-ink-secondary">
                  Masih butuh{' '}
                  <strong className="text-btnred font-semibold tabular-nums">
                    sisa {model.remainingSlots.toLocaleString('id-ID')} orang lagi
                  </strong>{' '}
                  agar undian harian berjalan.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Developer Signature Row & Action Buttons */}
        <div className="pt-3 border-t border-rule space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-well border border-hairline text-[10px] font-display font-bold text-brand flex items-center justify-center flex-shrink-0">
                {project.developerInitials}
              </span>
              <span className="text-xs font-bold text-ink tracking-wide truncate uppercase">
                {project.developer}
              </span>
            </div>
            {project.sourceUrl && (
              <a
                href={project.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-brand hover:underline inline-flex items-center gap-1 flex-shrink-0"
              >
                <span>Info Proyek</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
          </div>

          {(onAction || onSimulateFull) && (
            <div className="flex flex-wrap items-center gap-2">
              {onAction && (
                <button
                  type="button"
                  onClick={() => onAction(project)}
                  className={`flex-1 h-9 px-3.5 rounded-control text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    isJoined
                      ? 'bg-positive text-white hover:bg-positive/90'
                      : isSelected
                      ? 'bg-brand text-white hover:bg-brand-hover'
                      : 'bg-brand hover:bg-brand-hover text-white'
                  }`}
                >
                  <span>{isJoined ? 'Terdaftar di Unit Ini' : actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}

              {onSimulateFull && !model.isReadyToStart && (
                <button
                  type="button"
                  onClick={() => onSimulateFull(project)}
                  className="h-9 px-3 rounded-control border border-control bg-sheet hover:bg-well text-ink text-xs font-medium transition-colors whitespace-nowrap"
                >
                  Simulasi Penuh
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
