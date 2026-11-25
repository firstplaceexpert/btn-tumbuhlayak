'use client';

import React, { useRef, useState } from 'react';
import {
  DoorType,
  ExpansionModule,
  FloorRoom,
  HousingProfile,
  PhaseId,
  ValuationSummary,
  WallSide,
} from '../types';
import { HOUSE_TEMPLATES } from '../data/floorplanPresets';
import { formatArea, formatPercent, formatRupiah } from '../lib/formatters';
import {
  FlipHorizontal2,
  RotateCw,
  RotateCcw,
  Move,
  Minus,
  Plus,
  Check,
  Power,
  DoorOpen,
} from 'lucide-react';

interface HouseBlueprintProps {
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
  onToggleModule: (moduleId: string) => void;
  onChangeModulePhase?: (moduleId: string, phase: PhaseId) => void;
  compact?: boolean;
}

type DragState = {
  mode: 'move' | 'resize';
  roomId: string;
  startClientX: number;
  startClientY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  moved: boolean;
};

const snapHalf = (val: number) => Math.round(val * 2) / 2;

const WALL_ROTATE_CW: Record<WallSide, WallSide> = {
  top: 'right',
  right: 'bottom',
  bottom: 'left',
  left: 'top',
};

export const HouseBlueprint: React.FC<HouseBlueprintProps> = ({
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
  onChangeModulePhase,
  compact = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  // Live architectural door swing simulation: true = 90° open (shows full swing clearance), false = 20° ajar
  const [doorsOpen, setDoorsOpen] = useState<boolean>(true);

  const getMod = (id?: string) => (id ? modules.find((m) => m.id === id) : undefined);
  const modDak = getMod('modul-dak-lantai2');
  const hasKanopiActive = Boolean(getMod('modul-kanopi-carport')?.isSelected);
  const activeTemplate = HOUSE_TEMPLATES.find((t) => t.id === templateId) || HOUSE_TEMPLATES[0];

  const categoryPillClass = (cat: typeof activeTemplate.programCategory) => {
    if (cat === 'subsidi-flpp') return 'bg-positive-soft text-positive border-positive-border';
    if (cat === 'kpr-komersial') return 'bg-ochre-soft text-ochre border-ochre-border';
    return 'bg-brand-soft text-brand border-brand-border';
  };

  const visibleRooms = rooms.filter((r) => {
    if (r.floor !== floorView) return false;
    if (r.kind === 'module') {
      return Boolean(getMod(r.moduleId)?.isSelected);
    }
    // Saat modul Kanopi Carport aktif, gantikan carport terbuka bawaan agar tidak tumpang tindih
    if (r.id === 'room-carport-base' && hasKanopiActive) {
      return false;
    }
    return true;
  });
  const selectedRoom = visibleRooms.find((r) => r.id === selectedRoomId) || null;
  const selectedMod = selectedRoom?.moduleId ? getMod(selectedRoom.moduleId) : undefined;

  // Dynamic true-scale layout math inside 700 x 415 viewBox (room for axis bubbles & compass)
  const VB_W = 700;
  const VB_H = 415;
  const PAD_L = 62;
  const PAD_R = 42;
  const PAD_T = 56;
  const PAD_B = 38;

  const availW = VB_W - PAD_L - PAD_R;
  const availH = VB_H - PAD_T - PAD_B;
  const pxPerMeter = Math.min(availW / lotLength, availH / lotWidth);

  const lotPxW = lotLength * pxPerMeter;
  const lotPxH = lotWidth * pxPerMeter;
  const originX = PAD_L + (availW - lotPxW) / 2;
  const originY = PAD_T + (availH - lotPxH) / 2;

  const groundOccupied = Math.round(profile.luasTanah * valuation.kdbRatio);
  const openLandArea = Math.max(0, profile.luasTanah - groundOccupied);

  const clientDeltaToMeters = (dxPx: number, dyPx: number) => {
    const svg = svgRef.current;
    if (!svg) return { dxM: 0, dyM: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = VB_W / Math.max(rect.width, 1);
    const scaleY = VB_H / Math.max(rect.height, 1);
    return {
      dxM: (dxPx * scaleX) / pxPerMeter,
      dyM: (dyPx * scaleY) / pxPerMeter,
    };
  };

  const handleRoomPointerDown = (
    e: React.PointerEvent,
    room: FloorRoom,
    mode: 'move' | 'resize'
  ) => {
    if (compact) return;
    e.stopPropagation();
    setSelectedRoomId(room.id);
    setDragState({
      mode,
      roomId: room.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: room.x,
      origY: room.y,
      origW: room.w,
      origH: room.h,
      moved: false,
    });
    try {
      if (e.pointerId) {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      }
    } catch {
      // Synthetic pointer events
    }
  };

  const handleSvgPointerMove = (e: React.PointerEvent) => {
    if (!dragState || compact) return;
    const dxPx = e.clientX - dragState.startClientX;
    const dyPx = e.clientY - dragState.startClientY;

    if (!dragState.moved && Math.hypot(dxPx, dyPx) < 5) return;

    const { dxM, dyM } = clientDeltaToMeters(dxPx, dyPx);
    const room = rooms.find((r) => r.id === dragState.roomId);
    if (!room) return;

    if (!dragState.moved) {
      setDragState((prev) => (prev ? { ...prev, moved: true } : null));
    }

    if (dragState.mode === 'move') {
      const nextX = Math.max(0, Math.min(lotLength - dragState.origW, snapHalf(dragState.origX + dxM)));
      const nextY = Math.max(0, Math.min(lotWidth - dragState.origH, snapHalf(dragState.origY + dyM)));
      if (nextX !== room.x || nextY !== room.y) {
        onUpdateRoom(room.id, { x: nextX, y: nextY });
      }
    } else {
      const maxW = lotLength - dragState.origX;
      const maxH = lotWidth - dragState.origY;
      const nextW = Math.max(1.5, Math.min(maxW, snapHalf(dragState.origW + dxM)));
      const nextH = Math.max(1.5, Math.min(maxH, snapHalf(dragState.origH + dyM)));
      if (nextW !== room.w || nextH !== room.h) {
        const computedArea = Math.max(1, Math.round(nextW * nextH));
        onUpdateRoom(room.id, { w: nextW, h: nextH }, room.moduleId ? computedArea : undefined);
      }
    }
  };

  const handleSvgPointerUp = () => {
    if (!dragState) return;
    if (!dragState.moved && dragState.mode === 'move') {
      const room = rooms.find((r) => r.id === dragState.roomId);
      if (room?.moduleId) {
        const mod = getMod(room.moduleId);
        if (mod && !mod.isSelected) {
          onToggleModule(mod.id);
        }
      }
    }
    setDragState(null);
  };

  // Visual palette per room status & phase
  const getRoomTheme = (room: FloorRoom) => {
    if (room.kind === 'existing' && room.isOutdoor) {
      if (room.furniture === 'carport') {
        return {
          fill: '#EEF2F6',
          wallFill: 'transparent',
          stroke: '#94A3B8',
          strokeWidth: 1.4,
          dash: '4 3',
          textColor: '#334155',
          subColor: '#64748B',
          furnitureColor: '#94A3B8',
          doorColor: '#475569',
          doorFanColor: '#64748B',
          badgeColor: '#64748B',
        };
      }
      if (room.furniture === 'terrace') {
        return {
          fill: '#F4EFE6',
          wallFill: 'transparent',
          stroke: '#94A3B8',
          strokeWidth: 1.3,
          dash: undefined,
          textColor: '#334155',
          subColor: '#64748B',
          furnitureColor: '#CBD5E1',
          doorColor: '#475569',
          doorFanColor: '#64748B',
          badgeColor: '#64748B',
        };
      }
      // Semi-outdoor kitchen slab (e.g. Tipe 21/60 FLPP)
      return {
        fill: '#F6F3EC',
        wallFill: 'transparent',
        stroke: '#64748B',
        strokeWidth: 1.5,
        dash: '5 3',
        textColor: '#1E293B',
        subColor: '#475569',
        furnitureColor: '#94A3B8',
        doorColor: '#334155',
        doorFanColor: '#64748B',
        badgeColor: '#475569',
      };
    }

    if (room.kind === 'existing') {
      return {
        fill: '#FAF8F4',
        wallFill: '#E2E6EC',
        stroke: '#1E293B',
        strokeWidth: 2.2,
        dash: undefined,
        textColor: '#111827',
        subColor: '#4B5565',
        furnitureColor: '#94A3B8',
        doorColor: '#1E293B',
        doorFanColor: '#475569',
        badgeColor: '#334155',
      };
    }

    const mod = getMod(room.moduleId);
    if (!mod || !mod.isSelected) {
      return {
        fill: 'rgba(255, 255, 255, 0.78)',
        wallFill: 'transparent',
        stroke: '#64748B',
        strokeWidth: 1.4,
        dash: '5 4',
        textColor: '#334155',
        subColor: '#4B5565',
        furnitureColor: '#CBD5E1',
        doorColor: '#64748B',
        doorFanColor: '#94A3B8',
        badgeColor: '#64748B',
      };
    }

    if (mod.selectedPhase === 'tahap-1') {
      return {
        fill: '#EDF3FF',
        wallFill: '#C3D7FE',
        stroke: '#125EFA',
        strokeWidth: 2.2,
        dash: undefined,
        textColor: '#082D7F',
        subColor: '#0B46C4',
        furnitureColor: '#699BFA',
        doorColor: '#125EFA',
        doorFanColor: '#125EFA',
        badgeColor: '#125EFA',
      };
    }

    if (mod.selectedPhase === 'tahap-2') {
      return {
        fill: '#FEF4DC',
        wallFill: '#F7DFAC',
        stroke: '#B46909',
        strokeWidth: 2.2,
        dash: undefined,
        textColor: '#7C4305',
        subColor: '#9A5B08',
        furnitureColor: '#D49A3A',
        doorColor: '#B46909',
        doorFanColor: '#B46909',
        badgeColor: '#B46909',
      };
    }

    return {
      fill: '#E4F7F4',
      wallFill: '#B9E8E1',
      stroke: '#0F766E',
      strokeWidth: 2.2,
      dash: undefined,
      textColor: '#115E59',
      subColor: '#0F766E',
      furnitureColor: '#5EB3A9',
      doorColor: '#0F766E',
      doorFanColor: '#0F766E',
      badgeColor: '#0F766E',
    };
  };

  // =========================================================================
  // AUTHENTIC ARCHITECTURAL DOOR RENDERER (Single Swing, Double Swing, Sliding)
  // =========================================================================
  const renderArchitecturalDoor = (
    room: FloorRoom,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    theme: ReturnType<typeof getRoomTheme>,
    isActive: boolean
  ) => {
    const doorType = room.doorType || 'none';
    const wall = room.doorWall;
    if (!isActive || doorType === 'none' || !wall) return null;

    // Realistic architectural door widths in px
    const isBath = room.furniture === 'bath';
    const singleSpan = Math.min(
      (isBath ? 0.68 : 0.85) * pxPerMeter,
      (wall === 'top' || wall === 'bottom' ? rw : rh) * 0.48
    );
    const doubleHalf = Math.min(
      0.62 * pxPerMeter,
      (wall === 'top' || wall === 'bottom' ? rw : rh) * 0.28
    );
    const slideSpan = Math.min(
      1.35 * pxPerMeter,
      (wall === 'top' || wall === 'bottom' ? rw : rh) * 0.56
    );

    // Angle for open/ajar door simulation (90° open vs 22° ajar)
    const swingRad = doorsOpen ? Math.PI / 2 : (22 * Math.PI) / 180;
    const cosA = Math.cos(swingRad);
    const sinA = Math.sin(swingRad);

    // Helper for positioning opening along each wall so door leaf swings cleanly beside perimeter wall
    const getSingleGeometry = () => {
      const r = singleSpan;
      if (wall === 'bottom') {
        if (room.doorAlign === 'start') {
          // Hinge near left edge so open 90° leaf hugs left wall (ideal for KT 2 opening to Ruang Keluarga)
          const hx = rx + Math.min(rw * 0.14, 10);
          const hy = ry + rh;
          const leafX = hx + r * cosA;
          const leafY = hy - r * sinA;
          const openX = hx;
          const openY = hy - r;
          return {
            cut: { x1: hx, y1: hy, x2: hx + r, y2: hy },
            hinge: { x: hx, y: hy },
            leafEnd: { x: leafX, y: leafY },
            arcPath: `M ${hx + r} ${hy} A ${r} ${r} 0 0 0 ${leafX} ${leafY}`,
            fanPath: `M ${hx} ${hy} L ${hx + r} ${hy} A ${r} ${r} 0 0 0 ${openX} ${openY} Z`,
          };
        }
        // Default ('end'): hinge near right edge so open 90° leaf hugs right wall
        const hx = rx + rw - Math.min(rw * 0.14, 10);
        const hy = ry + rh;
        const leafX = hx - r * cosA;
        const leafY = hy - r * sinA;
        const openX = hx;
        const openY = hy - r;
        return {
          cut: { x1: hx - r, y1: hy, x2: hx, y2: hy },
          hinge: { x: hx, y: hy },
          leafEnd: { x: leafX, y: leafY },
          arcPath: `M ${hx - r} ${hy} A ${r} ${r} 0 0 1 ${leafX} ${leafY}`,
          fanPath: `M ${hx} ${hy} L ${hx - r} ${hy} A ${r} ${r} 0 0 1 ${openX} ${openY} Z`,
        };
      }
      if (wall === 'top') {
        if (room.doorAlign === 'end') {
          const hx = rx + rw - Math.min(rw * 0.14, 10);
          const hy = ry;
          const leafX = hx - r * cosA;
          const leafY = hy + r * sinA;
          const openX = hx;
          const openY = hy + r;
          return {
            cut: { x1: hx - r, y1: hy, x2: hx, y2: hy },
            hinge: { x: hx, y: hy },
            leafEnd: { x: leafX, y: leafY },
            arcPath: `M ${hx - r} ${hy} A ${r} ${r} 0 0 0 ${leafX} ${leafY}`,
            fanPath: `M ${hx} ${hy} L ${hx - r} ${hy} A ${r} ${r} 0 0 0 ${openX} ${openY} Z`,
          };
        }
        const hx = rx + Math.min(rw * 0.14, 10);
        const hy = ry;
        const leafX = hx + r * cosA;
        const leafY = hy + r * sinA;
        const openX = hx;
        const openY = hy + r;
        return {
          cut: { x1: hx, y1: hy, x2: hx + r, y2: hy },
          hinge: { x: hx, y: hy },
          leafEnd: { x: leafX, y: leafY },
          arcPath: `M ${hx + r} ${hy} A ${r} ${r} 0 0 1 ${leafX} ${leafY}`,
          fanPath: `M ${hx} ${hy} L ${hx + r} ${hy} A ${r} ${r} 0 0 1 ${openX} ${openY} Z`,
        };
      }
      if (wall === 'left') {
        const hx = rx;
        const hy = ry + Math.min(rh * 0.16, 12);
        // Closed vector: (0, +r), Open inward (right): (+r, 0)
        const leafX = hx + r * sinA;
        const leafY = hy + r * cosA;
        const openX = hx + r;
        const openY = hy;
        return {
          cut: { x1: hx, y1: hy, x2: hx, y2: hy + r },
          hinge: { x: hx, y: hy },
          leafEnd: { x: leafX, y: leafY },
          arcPath: `M ${hx} ${hy + r} A ${r} ${r} 0 0 0 ${leafX} ${leafY}`,
          fanPath: `M ${hx} ${hy} L ${hx} ${hy + r} A ${r} ${r} 0 0 0 ${openX} ${openY} Z`,
        };
      }
      // right wall
      const hx = rx + rw;
      const hy = ry + Math.min(rh * 0.16, 12);
      // Closed vector: (0, +r), Open inward (left): (-r, 0)
      const leafX = hx - r * sinA;
      const leafY = hy + r * cosA;
      const openX = hx - r;
      const openY = hy;
      return {
        cut: { x1: hx, y1: hy, x2: hx, y2: hy + r },
        hinge: { x: hx, y: hy },
        leafEnd: { x: leafX, y: leafY },
        arcPath: `M ${hx} ${hy + r} A ${r} ${r} 0 0 1 ${leafX} ${leafY}`,
        fanPath: `M ${hx} ${hy} L ${hx} ${hy + r} A ${r} ${r} 0 0 1 ${openX} ${openY} Z`,
      };
    };

    if (doorType === 'single') {
      const g = getSingleGeometry();
      return (
        <g pointerEvents="none">
          {/* Wall break (opening) */}
          <line x1={g.cut.x1} y1={g.cut.y1} x2={g.cut.x2} y2={g.cut.y2} stroke={theme.fill} strokeWidth="4.6" />
          {/* Full 90° clearance zone tint */}
          <path d={g.fanPath} fill={theme.doorFanColor} fillOpacity="0.09" />
          {/* Architectural swing trajectory arc */}
          <path d={g.arcPath} fill="none" stroke={theme.doorColor} strokeWidth="1" strokeDasharray="3 2.5" strokeOpacity="0.75" />
          {/* Door jamb ticks */}
          <circle cx={g.hinge.x} cy={g.hinge.y} r="1.8" fill={theme.doorColor} />
          {/* Solid door leaf panel */}
          <line
            x1={g.hinge.x}
            y1={g.hinge.y}
            x2={g.leafEnd.x}
            y2={g.leafEnd.y}
            stroke={theme.doorColor}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (doorType === 'double') {
      const r = doubleHalf;
      const isHoriz = wall === 'top' || wall === 'bottom';
      if (isHoriz) {
        const y = wall === 'top' ? ry : ry + rh;
        const dir = wall === 'top' ? 1 : -1;
        const midX = rx + rw / 2;
        const h1x = midX - r;
        const h2x = midX + r;
        const l1x = h1x + r * cosA;
        const l1y = y + dir * r * sinA;
        const l2x = h2x - r * cosA;
        const l2y = y + dir * r * sinA;
        return (
          <g pointerEvents="none">
            <line x1={h1x} y1={y} x2={h2x} y2={y} stroke={theme.fill} strokeWidth="4.8" />
            <path d={`M ${h1x} ${y} L ${midX} ${y} A ${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${h1x} ${y + dir * r} Z`} fill={theme.doorFanColor} fillOpacity="0.09" />
            <path d={`M ${h2x} ${y} L ${midX} ${y} A ${r} ${r} 0 0 ${dir > 0 ? 0 : 1} ${h2x} ${y + dir * r} Z`} fill={theme.doorFanColor} fillOpacity="0.09" />
            <path d={`M ${midX} ${y} A ${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${l1x} ${l1y}`} fill="none" stroke={theme.doorColor} strokeWidth="1" strokeDasharray="3 2.5" strokeOpacity="0.75" />
            <path d={`M ${midX} ${y} A ${r} ${r} 0 0 ${dir > 0 ? 0 : 1} ${l2x} ${l2y}`} fill="none" stroke={theme.doorColor} strokeWidth="1" strokeDasharray="3 2.5" strokeOpacity="0.75" />
            <line x1={h1x} y1={y} x2={l1x} y2={l1y} stroke={theme.doorColor} strokeWidth="2.4" strokeLinecap="round" />
            <line x1={h2x} y1={y} x2={l2x} y2={l2y} stroke={theme.doorColor} strokeWidth="2.4" strokeLinecap="round" />
          </g>
        );
      } else {
        const x = wall === 'left' ? rx : rx + rw;
        const dir = wall === 'left' ? 1 : -1;
        const midY = ry + Math.min(rh * 0.42, rh - r - 12);
        const h1y = Math.max(ry + 8, midY - r);
        const h2y = h1y + r * 2;
        const centerY = h1y + r;
        const l1x = x + dir * r * sinA;
        const l1y = h1y + r * cosA;
        const l2x = x + dir * r * sinA;
        const l2y = h2y - r * cosA;
        return (
          <g pointerEvents="none">
            <line x1={x} y1={h1y} x2={x} y2={h2y} stroke={theme.fill} strokeWidth="4.8" />
            <path d={`M ${x} ${h1y} L ${x} ${centerY} A ${r} ${r} 0 0 ${dir > 0 ? 0 : 1} ${x + dir * r} ${h1y} Z`} fill={theme.doorFanColor} fillOpacity="0.09" />
            <path d={`M ${x} ${h2y} L ${x} ${centerY} A ${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${x + dir * r} ${h2y} Z`} fill={theme.doorFanColor} fillOpacity="0.09" />
            <path d={`M ${x} ${centerY} A ${r} ${r} 0 0 ${dir > 0 ? 0 : 1} ${l1x} ${l1y}`} fill="none" stroke={theme.doorColor} strokeWidth="1" strokeDasharray="3 2.5" strokeOpacity="0.75" />
            <path d={`M ${x} ${centerY} A ${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${l2x} ${l2y}`} fill="none" stroke={theme.doorColor} strokeWidth="1" strokeDasharray="3 2.5" strokeOpacity="0.75" />
            <line x1={x} y1={h1y} x2={l1x} y2={l1y} stroke={theme.doorColor} strokeWidth="2.4" strokeLinecap="round" />
            <line x1={x} y1={h2y} x2={l2x} y2={l2y} stroke={theme.doorColor} strokeWidth="2.4" strokeLinecap="round" />
          </g>
        );
      }
    }

    // Sliding Door (Pintu Geser Kaca / Aluminium)
    const s = slideSpan;
    const shift = doorsOpen ? s * 0.28 : 0;
    if (wall === 'top' || wall === 'bottom') {
      const y = wall === 'top' ? ry : ry + rh;
      const sx = rx + (rw - s) / 2;
      return (
        <g pointerEvents="none">
          <line x1={sx} y1={y} x2={sx + s} y2={y} stroke={theme.fill} strokeWidth="5" />
          <line x1={sx} y1={y - 2} x2={sx + s * 0.56} y2={y - 2} stroke={theme.doorColor} strokeWidth="1.8" />
          <line x1={sx + s * 0.44 - shift} y1={y + 2} x2={sx + s - shift} y2={y + 2} stroke={theme.doorColor} strokeWidth="1.8" />
        </g>
      );
    } else {
      const x = wall === 'left' ? rx : rx + rw;
      const sy = ry + (rh - s) / 2;
      return (
        <g pointerEvents="none">
          <line x1={x} y1={sy} x2={x} y2={sy + s} stroke={theme.fill} strokeWidth="5" />
          <line x1={x - 2} y1={sy} x2={x - 2} y2={sy + s * 0.56} stroke={theme.doorColor} strokeWidth="1.8" />
          <line x1={x + 2} y1={sy + s * 0.44 - shift} x2={x + 2} y2={sy + s - shift} stroke={theme.doorColor} strokeWidth="1.8" />
        </g>
      );
    }
  };

  // =========================================================================
  // AUTHENTIC ARCHITECTURAL WINDOW GLAZING RENDERER (Jendela & Bovenlicht)
  // =========================================================================
  const renderArchitecturalWindows = (
    room: FloorRoom,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    theme: ReturnType<typeof getRoomTheme>,
    isActive: boolean
  ) => {
    if (!isActive || !room.windowWalls?.length) return null;
    const isBath = room.furniture === 'bath';

    return (
      <g pointerEvents="none">
        {room.windowWalls.map((side) => {
          // Don't draw window directly on top of door on narrow walls
          const hasDoorSameWall = room.doorWall === side && room.doorType !== 'none';
          const isHoriz = side === 'top' || side === 'bottom';
          const wallSpan = isHoriz ? rw : rh;
          if (hasDoorSameWall && wallSpan < 110) return null;

          const winLen = Math.min(
            (isBath ? 0.6 : 1.35) * pxPerMeter,
            wallSpan * (hasDoorSameWall ? 0.34 : 0.48)
          );

          if (isHoriz) {
            const y = side === 'top' ? ry : ry + rh;
            const wx = hasDoorSameWall ? rx + rw - winLen - 10 : rx + (rw - winLen) / 2;
            return (
              <g key={side}>
                <rect x={wx} y={y - 2.6} width={winLen} height="5.2" fill="#FFFFFF" stroke={theme.stroke} strokeWidth="0.9" />
                <line x1={wx} y1={y - 0.8} x2={wx + winLen} y2={y - 0.8} stroke="#2563EB" strokeWidth="0.85" />
                <line x1={wx} y1={y + 0.8} x2={wx + winLen} y2={y + 0.8} stroke="#2563EB" strokeWidth="0.85" />
              </g>
            );
          } else {
            const x = side === 'left' ? rx : rx + rw;
            const wy = hasDoorSameWall ? ry + rh - winLen - 10 : ry + (rh - winLen) / 2;
            return (
              <g key={side}>
                <rect x={x - 2.6} y={wy} width="5.2" height={winLen} fill="#FFFFFF" stroke={theme.stroke} strokeWidth="0.9" />
                <line x1={x - 0.8} y1={wy} x2={x - 0.8} y2={wy + winLen} stroke="#2563EB" strokeWidth="0.85" />
                <line x1={x + 0.8} y1={wy} x2={x + 0.8} y2={wy + winLen} stroke="#2563EB" strokeWidth="0.85" />
              </g>
            );
          }
        })}
      </g>
    );
  };

  // Adaptive minimalist furniture SVG positioned neatly to respect door clearance
  const renderFurniture = (
    room: FloorRoom,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    strokeColor: string,
    isActive: boolean
  ) => {
    if (!isActive || (room.furniture !== 'terrace' && (rw < 52 || rh < 48))) return null;
    const pad = 8;

    switch (room.furniture) {
      case 'terrace': {
        const stepCount = Math.max(3, Math.floor(rh / 24));
        return (
          <g fill="none" stroke={strokeColor} strokeWidth="0.9" opacity="0.55" pointerEvents="none">
            {Array.from({ length: stepCount - 1 }).map((_, i) => {
              const ly = ry + ((i + 1) * rh) / stepCount;
              return <line key={i} x1={rx + 4} y1={ly} x2={rx + rw - 4} y2={ly} />;
            })}
            <line x1={rx + rw * 0.5} y1={ry + 4} x2={rx + rw * 0.5} y2={ry + rh - 4} strokeOpacity="0.45" />
            {/* Front porch step edge */}
            <line x1={rx + 4} y1={ry + 6} x2={rx + 4} y2={ry + rh - 6} stroke="#94A3B8" strokeWidth="1.2" />
          </g>
        );
      }
      case 'bed-double': {
        const bw = Math.min(rw - pad * 2, 54);
        const bh = Math.min(rh * 0.38, 40);
        return (
          <g fill="none" stroke={strokeColor} strokeWidth="1.1" opacity="0.85" pointerEvents="none">
            <rect x={rx + pad} y={ry + pad} width={bw} height={bh} rx="2" />
            <rect x={rx + pad + 4} y={ry + pad + 3} width={bw / 2 - 6} height={9} rx="2" />
            <rect x={rx + pad + bw / 2 + 2} y={ry + pad + 3} width={bw / 2 - 6} height={9} rx="2" />
            <line x1={rx + pad} y1={ry + pad + 17} x2={rx + pad + bw} y2={ry + pad + 17} />
          </g>
        );
      }
      case 'bed-single': {
        const bw = Math.min(rw * 0.46, 46);
        const bh = Math.min(rh * 0.34, 34);
        return (
          <g fill="none" stroke={strokeColor} strokeWidth="1.1" opacity="0.85" pointerEvents="none">
            <rect x={rx + rw - pad - bw} y={ry + pad} width={bw} height={bh} rx="2" />
            <rect x={rx + rw - pad - 13} y={ry + pad + 4} width={9} height={bh - 8} rx="2" />
          </g>
        );
      }
      case 'bath': {
        // Place toilet + floor drain opposite the left door so fixtures never collide with door swing or centered label
        const tx = room.doorWall === 'left' ? rx + rw - pad - 14 : rx + pad;
        return (
          <g fill="none" stroke={strokeColor} strokeWidth="1.05" opacity="0.85" pointerEvents="none">
            <rect x={tx} y={ry + pad} width={13} height={7} rx="1.8" />
            <ellipse cx={tx + 6.5} cy={ry + pad + 13} rx="5" ry="5.8" />
            {rh >= 68 && (
              <g>
                <rect x={tx + 2} y={ry + rh - pad - 11} width={11} height={11} rx="2" />
                <circle cx={tx + 7.5} cy={ry + rh - pad - 5.5} r="2.2" />
              </g>
            )}
          </g>
        );
      }
      case 'living': {
        const sw = Math.min(rw * 0.36, 72);
        const sh = Math.min(rh * 0.26, 30);
        return (
          <g fill="none" stroke={strokeColor} strokeWidth="1.1" opacity="0.85" pointerEvents="none">
            <path
              d={`M ${rx + rw * 0.24} ${ry + rh - pad - sh} H ${rx + rw * 0.24 + sw} V ${ry + rh - pad} H ${rx + rw * 0.24 + sw - 14} V ${ry + rh - pad - sh + 12} H ${rx + rw * 0.24} Z`}
            />
            <rect
              x={rx + rw * 0.24 + 12}
              y={ry + rh - pad - sh - 15}
              width={Math.min(36, sw * 0.52)}
              height={10}
              rx="2"
            />
            {rw > 180 && (
              <rect
                x={rx + rw - pad - 44}
                y={ry + rh - pad - 28}
                width={38}
                height={20}
                rx="2"
              />
            )}
          </g>
        );
      }
      case 'kitchen': {
        // Neat countertop along top wall with sink + 2-burner stove (clear of rear door and centered label)
        const counterW = Math.min(rw - pad * 2 - 6, 74);
        const counterX = rx + pad + 2;
        const counterY = ry + 6;
        return (
          <g fill="none" stroke={strokeColor} strokeWidth="1.05" opacity="0.9" pointerEvents="none">
            <rect x={counterX} y={counterY} width={counterW} height={14} rx="1.5" />
            {/* Sink basin */}
            <rect x={counterX + 4} y={counterY + 2.5} width={Math.min(18, counterW * 0.3)} height={9} rx="1.5" />
            {/* 2-burner stove */}
            <circle cx={counterX + counterW - 15} cy={counterY + 7} r="3" />
            <circle cx={counterX + counterW - 7} cy={counterY + 7} r="3" />
          </g>
        );
      }
      case 'carport': {
        const cw = Math.min(rw - 24, 88);
        const ch = Math.min(rh * 0.36, 42);
        const cx = rx + (rw - cw) / 2;
        const cy = ry + 14;
        return (
          <g fill="none" stroke={strokeColor} strokeWidth="1.15" opacity="0.85" pointerEvents="none">
            {/* Concrete carport groove lines */}
            <line x1={rx + 8} y1={ry + rh * 0.56} x2={rx + rw - 8} y2={ry + rh * 0.56} strokeOpacity="0.35" strokeDasharray="4 4" />
            <rect x={cx} y={cy} width={cw} height={ch} rx="10" />
            <line x1={cx + cw * 0.22} y1={cy + 4} x2={cx + cw * 0.28} y2={cy + ch - 4} strokeOpacity="0.65" />
            <line x1={cx + cw * 0.78} y1={cy + 4} x2={cx + cw * 0.72} y2={cy + ch - 4} strokeOpacity="0.65" />
          </g>
        );
      }
      case 'stairs': {
        const sw = Math.min(rw * 0.34, 76);
        const sh = Math.min(rh * 0.28, 46);
        const sx = rx + pad + 6;
        const sy = ry + rh - pad - sh;
        return (
          <g stroke={strokeColor} strokeWidth="1.15" opacity="0.9" pointerEvents="none">
            <rect x={sx} y={sy} width={sw} height={sh} fill="#FFFFFF" fillOpacity="0.7" />
            {[1, 2, 3, 4, 5].map((n) => (
              <line key={n} x1={sx + (sw / 6) * n} y1={sy} x2={sx + (sw / 6) * n} y2={sy + sh} />
            ))}
            <line x1={sx + 6} y1={sy + sh / 2} x2={sx + sw - 8} y2={sy + sh / 2} strokeWidth="1.4" />
            <polyline
              points={`${sx + sw - 14},${sy + sh / 2 - 5} ${sx + sw - 6},${sy + sh / 2} ${sx + sw - 14},${sy + sh / 2 + 5}`}
              fill="none"
              strokeWidth="1.4"
            />
          </g>
        );
      }
      default:
        return null;
    }
  };

  const handleAdjustSelectedDim = (axis: 'w' | 'h', delta: number) => {
    if (!selectedRoom) return;
    if (axis === 'w') {
      const nextW = Math.max(1.5, Math.min(lotLength - selectedRoom.x, snapHalf(selectedRoom.w + delta)));
      const area = Math.max(1, Math.round(nextW * selectedRoom.h));
      onUpdateRoom(selectedRoom.id, { w: nextW }, selectedRoom.moduleId ? area : undefined);
    } else {
      const nextH = Math.max(1.5, Math.min(lotWidth - selectedRoom.y, snapHalf(selectedRoom.h + delta)));
      const area = Math.max(1, Math.round(selectedRoom.w * nextH));
      onUpdateRoom(selectedRoom.id, { h: nextH }, selectedRoom.moduleId ? area : undefined);
    }
  };

  const handleRotateSelected = () => {
    if (!selectedRoom) return;
    const nextW = Math.min(lotLength, selectedRoom.h);
    const nextH = Math.min(lotWidth, selectedRoom.w);
    const nextX = Math.max(0, Math.min(lotLength - nextW, selectedRoom.x));
    const nextY = Math.max(0, Math.min(lotWidth - nextH, selectedRoom.y));
    const nextDoorWall = selectedRoom.doorWall ? WALL_ROTATE_CW[selectedRoom.doorWall] : undefined;
    const nextWindows = selectedRoom.windowWalls?.map((w) => WALL_ROTATE_CW[w]);
    onUpdateRoom(selectedRoom.id, {
      x: nextX,
      y: nextY,
      w: nextW,
      h: nextH,
      doorWall: nextDoorWall,
      windowWalls: nextWindows,
    });
  };

  // Architectural Grid Axis Markers (1, 2, 3, 4 along length; A, B, C along width)
  const xGridStops = [0, 3, Math.round(lotLength * 0.75), lotLength];
  const yGridStops = [0, Number((lotWidth / 2).toFixed(1)), lotWidth];
  const yAxisLabels = ['A', 'B', 'C'];

  return (
    <div className="border border-hairline rounded-card bg-sheet overflow-hidden interactive-surface">
      {/* Studio Header: Title + Architectural Actions + Floor Toggle */}
      <div className="px-4 py-3 border-b border-rule flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[15px] font-semibold text-ink">
              {compact ? 'Denah arsitektural rumah tumbuh' : 'Editor denah arsitektural'}
            </h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${categoryPillClass(
                activeTemplate.programCategory
              )}`}
            >
              {activeTemplate.programBadge}
            </span>
          </div>
          <p className="text-[13px] text-ink-secondary mt-0.5">
            Kavling {lotWidth} × {lotLength} m ({formatArea(profile.luasTanah)}) ·{' '}
            {valuation.addedBuildingArea > 0
              ? `Bangunan ${formatArea(profile.luasBangunanEksisting)} menjadi ${formatArea(valuation.totalBuildingArea)}`
              : `Bangunan eksisting ${formatArea(profile.luasBangunanEksisting)} (belum ada renovasi)`}
          </p>
        </div>

        {!compact && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Interactive Door Open/Close Swing Simulator */}
            <button
              type="button"
              onClick={() => setDoorsOpen((prev) => !prev)}
              aria-pressed={doorsOpen}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-control border text-[13px] font-medium transition-colors ${doorsOpen
                ? 'bg-brand-soft border-brand-border text-brand'
                : 'bg-sheet border-control text-ink-secondary hover:text-ink'
                }`}
              title="Simulasi bukaan daun pintu 90 derajat untuk cek ruang sirkulasi"
            >
              <DoorOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{doorsOpen ? 'Pintu 90°' : 'Pintu 20°'}</span>
            </button>

            <button
              type="button"
              onClick={onMirrorRooms}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-control border border-control bg-sheet hover:bg-brand-soft hover:border-brand-border hover:text-brand text-[13px] font-medium text-ink transition-colors"
              title="Balik orientasi denah kiri-kanan"
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cermin</span>
            </button>

            <button
              type="button"
              onClick={onResetLayout}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-control border border-control bg-sheet hover:bg-well text-[13px] font-medium text-ink-secondary hover:text-ink transition-colors"
              title="Kembalikan posisi ruang ke bawaan tipe rumah"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>

            <div
              className="inline-flex bg-well p-0.5 rounded-control border border-hairline"
              role="tablist"
              aria-label="Pilih lantai denah"
            >
              <button
                type="button"
                role="tab"
                aria-selected={floorView === 'lt1'}
                onClick={() => {
                  onFloorViewChange('lt1');
                  setSelectedRoomId(null);
                }}
                className={`px-2.5 py-1 rounded-[6px] text-[13px] font-medium transition-colors ${floorView === 'lt1'
                  ? 'bg-brand text-white'
                  : 'text-ink-secondary hover:text-ink'
                  }`}
              >
                Lt. 1
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={floorView === 'lt2'}
                onClick={() => {
                  onFloorViewChange('lt2');
                  setSelectedRoomId(null);
                }}
                className={`px-2.5 py-1 rounded-[6px] text-[13px] font-medium transition-colors flex items-center gap-1.5 ${floorView === 'lt2'
                  ? 'bg-tealarch text-white'
                  : 'text-ink-secondary hover:text-ink'
                  }`}
              >
                <span>Lt. 2</span>
                {modDak?.isSelected && floorView !== 'lt2' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-tealarch" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Template Selector Strip */}
      {!compact && (
        <div className="px-4 py-2.5 bg-well/80 border-b border-rule space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-medium text-ink-secondary mr-0.5">
                Tipe kavling:
              </span>
              {HOUSE_TEMPLATES.map((tpl) => {
                const active = tpl.id === templateId;
                const tagShort =
                  tpl.programCategory === 'subsidi-flpp'
                    ? 'FLPP'
                    : tpl.programCategory === 'kpr-komersial'
                      ? 'Komersial'
                      : 'FLPP/Kom';
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      onSelectTemplate(tpl.id);
                      setSelectedRoomId(null);
                    }}
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-control text-xs font-medium border transition-colors ${active
                      ? 'bg-brand-soft text-brand border-brand-border'
                      : 'bg-sheet text-ink-secondary border-hairline hover:border-control hover:text-ink'
                      }`}
                  >
                    <span>{tpl.shortLabel}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-semibold ${tpl.programCategory === 'subsidi-flpp'
                        ? 'bg-positive-soft text-positive'
                        : tpl.programCategory === 'kpr-komersial'
                          ? 'bg-ochre-soft text-ochre'
                          : 'bg-well text-ink-secondary'
                        }`}
                    >
                      {tagShort}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary">
            <span>{activeTemplate.regulationBasis}</span>
            <span className="inline-flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
              <span>Klik ruang untuk ubah pintu & ukuran, atau seret langsung</span>
            </span>
          </div>
        </div>
      )}

      {/* Interactive Architectural CAD Canvas */}
      <div className="p-3 sm:p-4 bg-well">
        <div className="bg-sheet border border-hairline rounded-[10px] p-2 sm:p-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full h-auto block select-none touch-none"
            role="img"
            aria-label="Kanvas denah arsitektural rumah tumbuh lengkap dengan simulasi pintu, jendela, dan elevasi"
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerCancel={handleSvgPointerUp}
            onClick={() => {
              if (!dragState) setSelectedRoomId(null);
            }}
          >
            <defs>
              <pattern
                id="lotSnapGrid"
                width={pxPerMeter / 2}
                height={pxPerMeter / 2}
                patternUnits="userSpaceOnUse"
                x={originX}
                y={originY}
              >
                <path
                  d={`M ${pxPerMeter / 2} 0 L 0 0 0 ${pxPerMeter / 2}`}
                  fill="none"
                  stroke="#DCEADF"
                  strokeWidth="0.7"
                />
              </pattern>

              <pattern id="outerPaperGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#F1F4F8" strokeWidth="0.75" />
              </pattern>

              <filter id="selectedRoomLift" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0D4A8C" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Drafting Paper Background */}
            <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#outerPaperGrid)" />

            {/* Architectural Grid Axis Bubbles (1, 2, 3, 4 along Top) */}
            {xGridStops.map((mPos, idx) => {
              const gx = originX + mPos * pxPerMeter;
              return (
                <g key={`ax-x-${idx}`} pointerEvents="none">
                  <line
                    x1={gx}
                    y1={originY - 26}
                    x2={gx}
                    y2={originY + lotPxH + 6}
                    stroke="#CBD5E1"
                    strokeWidth="0.7"
                    strokeDasharray="3 4"
                  />
                  <circle cx={gx} cy={originY - 36} r="9" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
                  <text
                    x={gx}
                    y={originY - 32.5}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}

            {/* Architectural Grid Axis Bubbles (A, B, C along Left) */}
            {yGridStops.map((mPos, idx) => {
              const gy = originY + mPos * pxPerMeter;
              return (
                <g key={`ax-y-${idx}`} pointerEvents="none">
                  <line
                    x1={originX - 24}
                    y1={gy}
                    x2={originX + lotPxW + 6}
                    y2={gy}
                    stroke="#CBD5E1"
                    strokeWidth="0.7"
                    strokeDasharray="3 4"
                  />
                  <circle cx={originX - 36} cy={gy} r="9" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
                  <text
                    x={originX - 36}
                    y={gy + 3.5}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {yAxisLabels[idx]}
                  </text>
                </g>
              );
            })}

            {/* Minimalist Architectural North Compass Rose (Top-Right) */}
            <g transform={`translate(${VB_W - 24}, 26)`} pointerEvents="none">
              <circle cx="0" cy="0" r="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
              <polygon points="0,-8 3.2,2 0,0 -3.2,2" fill="#DC0714" />
              <polygon points="0,8 3.2,2 0,0 -3.2,2" fill="#CBD5E1" />
              <text x="0" y="-14" textAnchor="middle" fill="#475569" fontSize="8.5" fontWeight="700" fontFamily="Poppins, sans-serif">
                U
              </text>
            </g>

            {/* Top Overall Dimension Line (Lot Length) */}
            <g stroke="#64748B" strokeWidth="1" pointerEvents="none">
              <line x1={originX} y1={originY - 14} x2={originX + lotPxW} y2={originY - 14} />
              <line x1={originX} y1={originY - 18} x2={originX} y2={originY - 10} />
              <line x1={originX + lotPxW} y1={originY - 18} x2={originX + lotPxW} y2={originY - 10} />
            </g>
            <text
              x={originX + lotPxW / 2}
              y={originY - 18}
              textAnchor="middle"
              fill="#111827"
              fontSize="11"
              fontWeight="500"
              fontFamily="IBM Plex Mono, monospace"
            >
              {lotLength.toFixed(1)} m (Skala 1:100)
            </text>

            {/* Left Side Dimension Line (Lot Width) */}
            <g stroke="#64748B" strokeWidth="1" pointerEvents="none">
              <line x1={originX - 14} y1={originY} x2={originX - 14} y2={originY + lotPxH} />
              <line x1={originX - 18} y1={originY} x2={originX - 10} y2={originY} />
              <line x1={originX - 18} y1={originY + lotPxH} x2={originX - 10} y2={originY + lotPxH} />
            </g>
            <text
              x={originX - 19}
              y={originY + lotPxH / 2}
              textAnchor="middle"
              fill="#4B5565"
              fontSize="10.5"
              fontFamily="IBM Plex Mono, monospace"
              transform={`rotate(-90 ${originX - 19} ${originY + lotPxH / 2})`}
            >
              {lotWidth.toFixed(1)} m
            </text>

            {/* Bottom Road & Orientation Captions */}
            <g pointerEvents="none">
              <text
                x={originX + 4}
                y={originY + lotPxH + 22}
                textAnchor="start"
                fill="#0D4A8C"
                fontSize="11"
                fontWeight="600"
                fontFamily="IBM Plex Sans, sans-serif"
              >
                ▸ Akses masuk / Jalan depan
              </text>
              <text
                x={originX + lotPxW / 2}
                y={originY + lotPxH + 22}
                textAnchor="middle"
                fill="#4B5565"
                fontSize="10.5"
                fontFamily="IBM Plex Mono, monospace"
              >
                Elevasi Taman -0.25 · Interior ±0.00
              </text>
              <text
                x={originX + lotPxW - 4}
                y={originY + lotPxH + 22}
                textAnchor="end"
                fill="#4B5565"
                fontSize="11"
                fontFamily="IBM Plex Sans, sans-serif"
              >
                Batas belakang
              </text>
            </g>

            {/* Kavling Lot Boundary + Botanical Open Lawn */}
            <rect
              x={originX}
              y={originY}
              width={lotPxW}
              height={lotPxH}
              fill={floorView === 'lt1' ? '#EEF7F1' : '#F4F7FA'}
              stroke="#94A3B8"
              strokeWidth="1.75"
              rx="2"
            />
            <rect
              x={originX}
              y={originY}
              width={lotPxW}
              height={lotPxH}
              fill="url(#lotSnapGrid)"
            />

            {/* Subtle Botanical Foliage, Stepping Stones & Open Yard Labels on Ground Floor Lawn */}
            {floorView === 'lt1' && (() => {
              const existingEnclosed = rooms.filter((r) => r.floor === 'lt1' && r.kind === 'existing' && !r.isOutdoor);
              const coreMaxX = existingEnclosed.reduce((mx, r) => Math.max(mx, r.x + r.w), 8);
              const coreMaxY = existingEnclosed.reduce((my, r) => Math.max(my, r.y + r.h), 6);
              const terasRoom = rooms.find((r) => r.id === 'room-teras');
              const frontLawnW = terasRoom ? terasRoom.x : 2.2;
              const frontLawnY = terasRoom ? terasRoom.y : lotWidth / 2;
              const frontLawnH = terasRoom ? terasRoom.h : lotWidth / 2;
              const hasRearModules = visibleRooms.some((r) => r.kind === 'module' && r.x >= coreMaxX - 0.5);
              const hasSideModule = visibleRooms.some((r) => r.kind === 'module' && r.y >= coreMaxY - 0.5);

              return (
                <g pointerEvents="none">
                  {/* Front Garden foliage & stepping stones */}
                  <g opacity="0.78">
                    <circle cx={originX + 20} cy={originY + lotPxH - 24} r="12" fill="#DDF0E3" stroke="#8CC3A0" strokeWidth="1.1" />
                    <circle cx={originX + 20} cy={originY + lotPxH - 24} r="2.2" fill="#4E9468" />
                    <circle cx={originX + lotPxW - 22} cy={originY + lotPxH - 22} r="10" fill="#DDF0E3" stroke="#8CC3A0" strokeWidth="1" />
                    <rect x={originX + 42} y={originY + (frontLawnY + frontLawnH * 0.58) * pxPerMeter} width="22" height="7" rx="1.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.9" />
                    <rect x={originX + 70} y={originY + (frontLawnY + frontLawnH * 0.58) * pxPerMeter} width="22" height="7" rx="1.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.9" />
                  </g>

                  {/* Taman Depan Label */}
                  {frontLawnW >= 1.4 && (
                    <text
                      x={originX + (frontLawnW / 2) * pxPerMeter}
                      y={originY + (frontLawnY + frontLawnH * 0.34) * pxPerMeter}
                      textAnchor="middle"
                      fill="#2F6F4E"
                      fontSize={frontLawnW < 1.8 ? '9' : '10'}
                      fontWeight="600"
                      fontFamily="IBM Plex Sans, sans-serif"
                      opacity="0.88"
                    >
                      Taman Depan
                    </text>
                  )}

                  {/* Halaman Belakang / Sisa Lahan Label */}
                  {!hasRearModules && lotLength - coreMaxX >= 1.2 && (
                    <g>
                      <text
                        x={originX + ((coreMaxX + lotLength) / 2) * pxPerMeter}
                        y={originY + (coreMaxY / 2) * pxPerMeter - 5}
                        textAnchor="middle"
                        fill="#2F6F4E"
                        fontSize={lotLength - coreMaxX < 1.8 ? '9.5' : '10.5'}
                        fontWeight="600"
                        fontFamily="IBM Plex Sans, sans-serif"
                        opacity="0.9"
                      >
                        {lotLength - coreMaxX < 1.8 ? 'Hal. Belakang' : 'Halaman Belakang'}
                      </text>
                      <text
                        x={originX + ((coreMaxX + lotLength) / 2) * pxPerMeter}
                        y={originY + (coreMaxY / 2) * pxPerMeter + 9}
                        textAnchor="middle"
                        fill="#4E8A6A"
                        fontSize="9"
                        fontFamily="IBM Plex Mono, monospace"
                        opacity="0.85"
                      >
                        Sisa {(lotLength - coreMaxX).toFixed(1)}×{coreMaxY.toFixed(0)} m
                      </text>
                    </g>
                  )}

                  {/* Taman Samping Label (Kavling Hook) */}
                  {!hasSideModule && lotWidth - coreMaxY >= 1.5 && (
                    <text
                      x={originX + (lotLength * 0.5) * pxPerMeter}
                      y={originY + ((coreMaxY + lotWidth) / 2) * pxPerMeter + 4}
                      textAnchor="middle"
                      fill="#2F6F4E"
                      fontSize="10.5"
                      fontWeight="600"
                      fontFamily="IBM Plex Sans, sans-serif"
                      opacity="0.9"
                    >
                      Taman Samping (Lahan Hook {(lotWidth - coreMaxY).toFixed(0)} m)
                    </text>
                  )}
                </g>
              );
            })()}

            {/* Lantai 2 Ghosted Reference of Ground Floor Enclosed Core */}
            {floorView === 'lt2' &&
              rooms
                .filter((r) => r.floor === 'lt1' && r.kind === 'existing' && !r.isOutdoor)
                .map((r) => (
                  <rect
                    key={`ghost-${r.id}`}
                    x={originX + r.x * pxPerMeter}
                    y={originY + r.y * pxPerMeter}
                    width={r.w * pxPerMeter}
                    height={r.h * pxPerMeter}
                    fill="#E2E8F0"
                    fillOpacity="0.4"
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    pointerEvents="none"
                  />
                ))}

            {floorView === 'lt2' && visibleRooms.length === 0 && (
              <g pointerEvents="none">
                <rect
                  x={originX + lotPxW * 0.18}
                  y={originY + lotPxH * 0.36}
                  width={lotPxW * 0.64}
                  height={66}
                  rx="8"
                  fill="#FFFFFF"
                  fillOpacity="0.92"
                  stroke="#CBD5E1"
                  strokeWidth="1"
                />
                <text
                  x={originX + lotPxW / 2}
                  y={originY + lotPxH * 0.36 + 27}
                  textAnchor="middle"
                  fill="#1E293B"
                  fontSize="11.5"
                  fontWeight="600"
                  fontFamily="IBM Plex Sans, sans-serif"
                >
                  Belum ada modul Lantai 2 yang aktif
                </text>
                <text
                  x={originX + lotPxW / 2}
                  y={originY + lotPxH * 0.36 + 46}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="IBM Plex Sans, sans-serif"
                >
                  Centang &quot;Pengembangan Lantai 2 / Dak Beton Cor&quot; di panel kanan
                </text>
              </g>
            )}

            {/* Render Interactive Draggable & Resizable Architectural Rooms */}
            {visibleRooms.map((room) => {
              const rx = originX + room.x * pxPerMeter;
              const ry = originY + room.y * pxPerMeter;
              const rw = room.w * pxPerMeter;
              const rh = room.h * pxPerMeter;
              const mod = getMod(room.moduleId);
              const isActive = room.kind === 'existing' || Boolean(mod?.isSelected);
              const isSelected = selectedRoomId === room.id && !compact;
              const theme = getRoomTheme(room);
              const areaSqm = Number((room.w * room.h).toFixed(1));
              const displayArea = mod?.isSelected ? mod.customVolume || mod.defaultVolume : areaSqm;
              const isEnclosedRoom = isActive && !room.isOutdoor && room.furniture !== 'carport';

              const labelY =
                room.furniture === 'carport' && isActive
                  ? ry + rh - 28
                  : room.furniture === 'terrace'
                    ? ry + rh / 2 - 4
                    : room.furniture === 'bed-double' && isActive
                      ? ry + rh * 0.58
                      : room.furniture === 'bed-single' && isActive
                        ? ry + rh * 0.56
                        : room.furniture === 'living' && isActive && rh >= 100
                          ? ry + 28
                          : room.furniture === 'kitchen' && isActive
                            ? ry + Math.max(38, rh * 0.56)
                            : room.furniture === 'bath' && isActive
                              ? ry + rh * 0.54
                              : ry + rh / 2 - 6;

              const labelX =
                room.furniture === 'bath' && isActive && room.doorWall === 'left'
                  ? rx + rw * 0.44
                  : room.furniture === 'bed-double' && isActive && room.doorWall === 'bottom'
                    ? rx + rw * 0.45
                    : rx + rw / 2;

              return (
                <g
                  key={room.id}
                  filter={isSelected ? 'url(#selectedRoomLift)' : undefined}
                  onPointerDown={(e) => handleRoomPointerDown(e, room, 'move')}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!compact) setSelectedRoomId(room.id);
                  }}
                  className={compact ? '' : 'cursor-grab active:cursor-grabbing'}
                  role="button"
                  tabIndex={compact ? -1 : 0}
                  aria-label={`${room.label}, ukuran ${room.w} kali ${room.h} meter`}
                  onKeyDown={(e) => {
                    if (compact) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedRoomId(room.id);
                      if (room.moduleId) onToggleModule(room.moduleId);
                    }
                  }}
                >
                  {/* Main Room Floor Fill & Outer Structural Wall */}
                  <rect
                    x={rx}
                    y={ry}
                    width={rw}
                    height={rh}
                    fill={theme.fill}
                    stroke={isSelected ? '#0D4A8C' : theme.stroke}
                    strokeWidth={isSelected ? 2.8 : theme.strokeWidth}
                    strokeDasharray={theme.dash}
                    rx="1.5"
                  />

                  {/* Subtle Double-Line Inner Wall for Enclosed Active Rooms (15cm brickwork look) */}
                  {isEnclosedRoom && rw > 36 && rh > 36 && (
                    <rect
                      x={rx + 3}
                      y={ry + 3}
                      width={rw - 6}
                      height={rh - 6}
                      fill="none"
                      stroke={theme.stroke}
                      strokeWidth="0.6"
                      strokeOpacity="0.28"
                      pointerEvents="none"
                    />
                  )}

                  {/* Adaptive Architectural Furniture Vector */}
                  {renderFurniture(room, rx, ry, rw, rh, theme.furnitureColor, isActive)}

                  {/* Authentic Architectural Window Symbols (Jendela) */}
                  {renderArchitecturalWindows(room, rx, ry, rw, rh, theme, isActive)}

                  {/* Authentic Architectural Door Swing / Sliding Simulation */}
                  {renderArchitecturalDoor(room, rx, ry, rw, rh, theme, isActive)}

                  {/* Structural Concrete Columns (Kolom Praktis 15x15cm) at corners of enclosed rooms */}
                  {isEnclosedRoom && (
                    <g fill={isSelected ? '#0D4A8C' : theme.stroke} pointerEvents="none">
                      <rect x={rx - 2.5} y={ry - 2.5} width="5" height="5" />
                      <rect x={rx + rw - 2.5} y={ry - 2.5} width="5" height="5" />
                      <rect x={rx - 2.5} y={ry + rh - 2.5} width="5" height="5" />
                      <rect x={rx + rw - 2.5} y={ry + rh - 2.5} width="5" height="5" />
                    </g>
                  )}

                  {/* Readable Room Title, Area & Architectural Floor Elevation */}
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    fill={theme.textColor}
                    fontSize={rw < 58 ? '9.5' : rw < 88 ? '10.5' : '11.5'}
                    fontWeight="600"
                    fontFamily="IBM Plex Sans, sans-serif"
                    pointerEvents="none"
                  >
                    {room.label}
                  </text>

                  {rh >= 54 && (
                    <text
                      x={labelX}
                      y={labelY + 12.5}
                      textAnchor="middle"
                      fill={theme.subColor}
                      fontSize={rw < 58 ? '8.5' : '9.5'}
                      fontFamily="IBM Plex Mono, monospace"
                      pointerEvents="none"
                    >
                      {rw < 105
                        ? `${displayArea} m²`
                        : `${room.w}×${room.h}m · ${displayArea} m²`}
                    </text>
                  )}

                  {/* Authentic Floor Elevation Tag (±0.00 / -0.05 / -0.15 / +3.40) */}
                  {isActive && room.elevation && rh >= 94 && rw >= 88 && (
                    <text
                      x={labelX}
                      y={labelY + 24}
                      textAnchor="middle"
                      fill={theme.subColor}
                      fontSize="9"
                      opacity="0.8"
                      fontFamily="IBM Plex Mono, monospace"
                      pointerEvents="none"
                    >
                      {room.elevation}
                    </text>
                  )}

                  {/* Bottom-Right Resize Handle when Selected */}
                  {isSelected && (
                    <g
                      onPointerDown={(e) => handleRoomPointerDown(e, room, 'resize')}
                      className="cursor-nwse-resize"
                    >
                      <rect
                        x={rx + rw - 13}
                        y={ry + rh - 13}
                        width="13"
                        height="13"
                        rx="2"
                        fill="#0D4A8C"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <line
                        x1={rx + rw - 9}
                        y1={ry + rh - 4}
                        x2={rx + rw - 4}
                        y2={ry + rh - 9}
                        stroke="#FFFFFF"
                        strokeWidth="1.3"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Room Quick-Edit Bar (Includes Door Position & Door Type!) OR Legend */}
        {!compact && selectedRoom ? (
          <div className="mt-3 p-3 rounded-[10px] bg-brand-soft/80 border border-brand-border space-y-2.5">
            {/* Row 1: Room Name + Dimensions + Rotate + Activate/Deactivate */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${selectedRoom.kind === 'existing'
                    ? 'bg-ink'
                    : !selectedMod?.isSelected
                      ? 'bg-control'
                      : selectedMod.selectedPhase === 'tahap-1'
                        ? 'bg-brand'
                        : selectedMod.selectedPhase === 'tahap-2'
                          ? 'bg-ochre-mid'
                          : 'bg-tealarch'
                    }`}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label="Ubah nama ruang"
                  value={selectedRoom.label}
                  onChange={(e) =>
                    onUpdateRoom(selectedRoom.id, {
                      label: e.target.value.replace(/[<>'"`;]/g, '').slice(0, 36),
                    })
                  }
                  className="h-8 px-2.5 rounded-control border border-brand-border bg-sheet text-[13px] font-semibold text-ink w-40 sm:w-44 focus:outline-none focus:border-brand"
                />
                <span className="text-xs font-mono text-brand font-medium tabular-nums">
                  {selectedRoom.w} × {selectedRoom.h} m ({Math.round(selectedRoom.w * selectedRoom.h)} m²)
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Panjang Stepper */}
                <div className="inline-flex items-center bg-sheet border border-brand-border rounded-control h-8 text-xs">
                  <span className="px-2 text-ink-secondary border-r border-rule">P</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustSelectedDim('w', -0.5)}
                    className="w-6 h-full flex items-center justify-center text-ink hover:bg-well"
                    aria-label="Kurangi panjang ruang 0.5 meter"
                  >
                    <Minus className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <span className="px-1.5 font-mono font-medium text-ink tabular-nums">
                    {selectedRoom.w}m
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustSelectedDim('w', 0.5)}
                    className="w-6 h-full flex items-center justify-center text-ink hover:bg-well"
                    aria-label="Tambah panjang ruang 0.5 meter"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>

                {/* Lebar Stepper */}
                <div className="inline-flex items-center bg-sheet border border-brand-border rounded-control h-8 text-xs">
                  <span className="px-2 text-ink-secondary border-r border-rule">L</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustSelectedDim('h', -0.5)}
                    className="w-6 h-full flex items-center justify-center text-ink hover:bg-well"
                    aria-label="Kurangi lebar ruang 0.5 meter"
                  >
                    <Minus className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <span className="px-1.5 font-mono font-medium text-ink tabular-nums">
                    {selectedRoom.h}m
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustSelectedDim('h', 0.5)}
                    className="w-6 h-full flex items-center justify-center text-ink hover:bg-well"
                    aria-label="Tambah lebar ruang 0.5 meter"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRotateSelected}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-control border border-brand-border bg-sheet hover:bg-well text-xs font-medium text-ink"
                  title="Putar ruang dan arah pintu 90 derajat"
                >
                  <RotateCw className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                  <span>Putar</span>
                </button>
              </div>
            </div>

            {/* Row 2: Architectural Door Controls (Wall Side + Door Type) + Module Status */}
            <div className="pt-2 border-t border-brand-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-brand inline-flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  Pintu:
                </span>

                <select
                  aria-label="Pilih tipe pintu"
                  value={selectedRoom.doorType || 'none'}
                  onChange={(e) => {
                    const nextType = e.target.value as DoorType;
                    onUpdateRoom(selectedRoom.id, {
                      doorType: nextType,
                      doorWall: nextType === 'none' ? undefined : selectedRoom.doorWall || 'bottom',
                    });
                  }}
                  className="h-7 px-2 rounded-control border border-brand-border bg-sheet text-xs font-medium text-ink"
                >
                  <option value="single">Ayun 1 daun</option>
                  <option value="double">Ganda (utama)</option>
                  <option value="sliding">Geser kaca</option>
                  <option value="none">Tanpa pintu</option>
                </select>

                {(selectedRoom.doorType || 'none') !== 'none' && (
                  <div className="inline-flex bg-sheet border border-brand-border rounded-control p-0.5">
                    {(
                      [
                        { id: 'left', label: 'Depan' },
                        { id: 'right', label: 'Belakang' },
                        { id: 'top', label: 'Atas' },
                        { id: 'bottom', label: 'Bawah' },
                      ] as const
                    ).map((side) => {
                      const active = selectedRoom.doorWall === side.id;
                      return (
                        <button
                          key={side.id}
                          type="button"
                          onClick={() => onUpdateRoom(selectedRoom.id, { doorWall: side.id })}
                          className={`px-2 py-0.5 rounded-[5px] text-xs font-medium transition-colors ${active
                            ? 'bg-brand text-white'
                            : 'text-ink-secondary hover:text-ink'
                            }`}
                        >
                          {side.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedRoom.moduleId && selectedMod && (
                <div className="flex items-center gap-1.5">
                  {selectedMod.isSelected && onChangeModulePhase && (
                    <select
                      aria-label="Ubah tahap modul"
                      value={selectedMod.selectedPhase}
                      onChange={(e) =>
                        onChangeModulePhase(selectedMod.id, e.target.value as PhaseId)
                      }
                      className="h-7 px-2 rounded-control border border-brand-border bg-sheet text-xs font-medium text-ink"
                    >
                      <option value="tahap-1">Tahap 1</option>
                      <option value="tahap-2">Tahap 2</option>
                      <option value="tahap-3">Tahap 3</option>
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleModule(selectedMod.id)}
                    className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-control text-xs font-medium transition-colors ${selectedMod.isSelected
                      ? 'bg-sheet border border-negative-border text-negative hover:bg-negative-soft'
                      : 'bg-brand text-white hover:bg-brand-hover'
                      }`}
                  >
                    {selectedMod.isSelected ? (
                      <>
                        <Power className="w-3 h-3" aria-hidden="true" />
                        <span>Nonaktifkan</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" aria-hidden="true" />
                        <span>Aktifkan</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Color-Coded Architectural Symbol Legend */
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px] bg-[#FAF8F4] border-2 border-[#1E293B]" aria-hidden="true" />
                Eksisting
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px] bg-[#E8F2FD] border-2 border-brand" aria-hidden="true" />
                Tahap 1
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px] bg-[#FEF4DC] border-2 border-ochre-mid" aria-hidden="true" />
                Tahap 2
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px] bg-[#E4F7F4] border-2 border-tealarch" aria-hidden="true" />
                Tahap 3
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-white border border-brand inline-block" aria-hidden="true" />
                Jendela & pintu ayun
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px] bg-[#EEF7F1] border border-[#8CC3A0]" aria-hidden="true" />
                Resapan ({formatArea(openLandArea)})
              </span>
            </div>

            <span className="font-medium text-ink tabular-nums">
              KDB {formatPercent(valuation.kdbRatio)} · RAB {formatRupiah(valuation.totalDevelopmentCost, true)}
            </span>
          </div>
        )}

        {!compact && (
          <p className="mt-2.5 pt-2 border-t border-rule text-[11px] text-ink-secondary">
            Catatan: Bank BTN adalah bank penyalur KPR; tata letak persis tiap perumahan mengikuti site plan pengembang mitra BTN sehingga seluruh ruang pada denah dapat digeser, diubah ukurannya, atau dicerminkan.
          </p>
        )}
      </div>
    </div>
  );
};
