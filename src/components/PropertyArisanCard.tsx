'use client';

import React, { useState } from 'react';
import { BtnHousingProject } from '../types';
import { calculateDailyOneHouseModel } from '../lib/dailyArisanEngine';
import { formatRupiah } from '../lib/formatters';
import {
  ArrowRight,
  BedDouble,
  Bath,
  CheckCircle2,
  ExternalLink,
  Heart,
  Maximize2,
  Users,
} from 'lucide-react';

interface PropertyArisanCardProps {
  project: BtnHousingProject;
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
  actionLabel = 'Ikut Arisan',
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
      className={`group rounded-[20px] bg-sheet border overflow-hidden flex flex-col transition-all duration-200 ${
        isSelected
          ? 'border-brand ring-2 ring-brand/15 shadow-[0_14px_30px_-14px_rgba(27,86,198,0.28)]'
          : 'border-hairline shadow-[0_8px_22px_-14px_rgba(31,36,43,0.14)] hover:-translate-y-0.5 hover:border-brand-border hover:shadow-[0_16px_32px_-14px_rgba(27,86,198,0.22)]'
      }`}
    >
      {/* Top House Photo Frame */}
      <div className="relative aspect-[16/10] w-full bg-[#ECEAE4] overflow-hidden">
        <img
          src={project.imageUrl}
          alt={`Foto rumah ${project.name} (${project.houseType}) di ${project.city}`}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 block"
        />

        {/* Top-Left Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-[8px] bg-brand text-white text-[11px] font-display font-bold tracking-wide shadow-sm">
            RUMAH
          </span>
          <span className="px-2 py-1 rounded-[8px] bg-sheet/95 backdrop-blur-sm text-ink text-[11px] font-semibold shadow-sm">
            {project.houseType}
          </span>
        </div>

        {/* Top-Right Favorite Toggle */}
        <button
          type="button"
          onClick={() => setFavorited((prev) => !prev)}
          aria-label={favorited ? `Hapus ${project.name} dari favorit` : `Simpan ${project.name} ke favorit`}
          aria-pressed={favorited}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-sheet/92 backdrop-blur-sm flex items-center justify-center text-ink-secondary hover:text-btnred shadow-sm transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${favorited ? 'fill-btnred text-btnred' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* Bottom Status Chips */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
          {model.isReadyToStart ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-positive text-white text-[11px] font-semibold shadow-sm">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              Undian Harian Aktif
            </span>
          ) : project.highlightTag ? (
            <span className="px-2.5 py-0.5 rounded-full bg-ochre text-white text-[11px] font-semibold shadow-sm">
              {project.highlightTag}
            </span>
          ) : (
            <span />
          )}

          <span className="px-2.5 py-0.5 rounded-full bg-ink/80 text-white text-[10.5px] font-semibold backdrop-blur-sm">
            1 rumah / hari
          </span>
        </div>
      </div>

      {/* Concise Visual Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3.5">
          {/* City + Title + Price */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs text-ink-secondary">
              <span className="truncate">{project.city}</span>
              <span className="text-[10.5px] font-bold text-positive whitespace-nowrap">
                {project.categoryLabel}
              </span>
            </div>

            <h3 className="font-display text-[17px] font-extrabold text-ink tracking-[-0.01em] leading-snug uppercase">
              {project.name}
            </h3>

            {/* HERO HIGHLIGHT: Daily Arisan Contribution (Most Attractive Hook!) */}
            <div className="flex items-baseline flex-wrap gap-1 pt-0.5">
              <span className="text-xs font-medium text-ink-secondary">Hanya</span>
              <span className="font-display text-[21px] font-extrabold text-brand tabular-nums leading-none">
                {formatRupiah(project.dailyContribution)}
              </span>
              <span className="text-xs font-bold text-brand">/hari</span>
              <span className="text-[11px] font-mono text-ink-secondary ml-0.5">
                · {yearsText} thn
              </span>
            </div>
          </div>

          {/* Mini Spec Row */}
          <div className="flex items-center gap-3.5 text-[11.5px] text-ink-secondary">
            <span className="inline-flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-ink-subtle" aria-hidden="true" />
              {project.luasBangunan}/{project.luasTanah} m²
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

          {/* Compact 2-Column Secondary Strip (Unit Price & Quota) */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[12px] bg-well border border-hairline tabular-nums">
            <div className="px-1.5">
              <div className="text-[10.5px] text-ink-secondary">Harga Unit</div>
              <div className="font-display text-[13px] font-bold text-ink">
                {formattedPrice}
              </div>
              <div className="text-[10.5px] text-ink-secondary">Siklus {yearsText} tahun</div>
            </div>
            <div className="px-2 border-l border-rule">
              <div className="text-[10.5px] text-ink-secondary">Target Kuota</div>
              <div className="font-display text-[13px] font-bold text-ink">
                {model.requiredQuota.toLocaleString('id-ID')} org
              </div>
              <div className="text-[10.5px] text-positive font-semibold">1 rumah / hari</div>
            </div>
          </div>

          {/* Clean Quota Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold text-ink">
                <Users className="w-3.5 h-3.5 text-brand flex-shrink-0" aria-hidden="true" />
                {model.isReadyToStart ? (
                  <span className="text-positive">Kuota penuh 100%</span>
                ) : (
                  <span className="text-btnred">
                    Sisa {model.remainingSlots.toLocaleString('id-ID')} orang lagi
                  </span>
                )}
              </span>
              <span className="font-mono text-[11px] font-bold text-ink-secondary">
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
          </div>
        </div>

        {/* Footer Developer & Action */}
        <div className="pt-3 border-t border-rule space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-full bg-well border border-hairline text-[10px] font-display font-bold text-brand flex items-center justify-center flex-shrink-0">
                {project.developerInitials}
              </span>
              <span className="text-[11.5px] font-bold text-ink tracking-wide truncate uppercase">
                {project.developer}
              </span>
            </div>
            {project.sourceUrl && (
              <a
                href={project.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-brand hover:underline inline-flex items-center gap-0.5 flex-shrink-0"
              >
                <span>Detail</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
          </div>

          {(onAction || onSimulateFull) && (
            <div className="flex items-center gap-2">
              {onAction && (
                <button
                  type="button"
                  onClick={() => onAction(project)}
                  className={`flex-1 h-9 px-3.5 rounded-control text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    isJoined
                      ? 'bg-positive text-white hover:bg-positive/90'
                      : 'bg-brand hover:bg-brand-hover text-white'
                  }`}
                >
                  <span>{isJoined ? 'Terdaftar' : actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}

              {onSimulateFull && !model.isReadyToStart && (
                <button
                  type="button"
                  onClick={() => onSimulateFull(project)}
                  className="h-9 px-3 rounded-control border border-control bg-sheet hover:bg-well text-ink text-xs font-medium transition-colors whitespace-nowrap"
                >
                  Penuhkan
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
