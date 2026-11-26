'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ProgramHomeView } from '../components/ProgramHomeView';
import { LoginScreen } from '../components/LoginScreen';
import { AppShell, WorkspaceTab } from '../components/AppShell';
import { AdminPortalView } from '../components/AdminPortalView';
import { ArisanLayerView } from '../components/ArisanLayerView';
import { NfcScannerView } from '../components/NfcScannerView';
import { PlannerWorkspace } from '../components/PlannerWorkspace';
import { ValuationAnalyticsView } from '../components/ValuationAnalyticsView';
import { ProposalPrintView } from '../components/ProposalPrintView';
import { SecurityBadgeModal } from '../components/SecurityBadgeModal';
import {
  DEFAULT_HOUSING_PROFILE,
  BASELINE_MODULES,
  PITCHING_PRESETS,
} from '../data/housingConfig';
import { HOUSE_TEMPLATES } from '../data/floorplanPresets';
import { ARISAN_LOCATION_ZONES } from '../data/arisanLocations';
import { calculateStagedRABAndValuation } from '../lib/calculator';
import {
  DemoStoreState,
  formatNowIndonesian,
  getInitialDemoStoreState,
  loadDemoStoreState,
  resetDemoStoreState,
  saveDemoStoreState,
} from '../lib/demoStore';
import {
  DemoUser,
  ExpansionModule,
  FloorRoom,
  HousingProfile,
  NfcPropertyRecord,
  OccupancyLegalStatus,
  PhaseId,
} from '../types';

const DEFAULT_TEMPLATE = HOUSE_TEMPLATES[0];

export default function Home() {
  // Shared persistent demo state (synced across Customer Registration, Admin Lottery & NFC Programming)
  const [demoStore, setDemoStore] = useState<DemoStoreState>(() => getInitialDemoStoreState());
  const [storeHydrated, setStoreHydrated] = useState(false);

  useEffect(() => {
    setDemoStore(loadDemoStoreState());
    setStoreHydrated(true);
  }, []);

  useEffect(() => {
    if (storeHydrated) {
      saveDemoStoreState(demoStore);
    }
  }, [demoStore, storeHydrated]);

  // Public Landing & Authentication Gate
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [publicView, setPublicView] = useState<'home' | 'login' | 'register'>('home');
  const [prefillZoneId, setPrefillZoneId] = useState<string | undefined>(undefined);
  const [selectedArisanProjectId, setSelectedArisanProjectId] = useState<string | undefined>(
    undefined
  );

  // Navigation & NFC Gate
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('beranda');
  const [activeNfcRecord, setActiveNfcRecord] = useState<NfcPropertyRecord | null>(null);

  // Layer 2: Editable floorplan template & room geometry
  const [floorView, setFloorView] = useState<'lt1' | 'lt2'>('lt1');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string>(DEFAULT_TEMPLATE.id);
  const [lotLength, setLotLength] = useState<number>(DEFAULT_TEMPLATE.lotLength);
  const [lotWidth, setLotWidth] = useState<number>(DEFAULT_TEMPLATE.lotWidth);
  const [rooms, setRooms] = useState<FloorRoom[]>(() =>
    DEFAULT_TEMPLATE.rooms.map((r) => ({ ...r }))
  );

  const [profile, setProfile] = useState<HousingProfile>(DEFAULT_HOUSING_PROFILE);
  const [modules, setModules] = useState<ExpansionModule[]>(BASELINE_MODULES);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const valuation = useMemo(
    () => calculateStagedRABAndValuation(profile, modules),
    [profile, modules]
  );

  const selectedModuleCount = useMemo(
    () => modules.filter((m) => m.isSelected).length,
    [modules]
  );

  const handleLoginSuccess = (user: DemoUser, isNewRegistration = false) => {
    if (isNewRegistration) {
      setDemoStore((prev) => {
        const exists = prev.users.some(
          (u) => u.email.toLowerCase() === user.email.toLowerCase()
        );
        return exists ? prev : { ...prev, users: [user, ...prev.users] };
      });
    }

    const latestUser =
      demoStore.users.find((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) ||
      user;

    setCurrentUser(latestUser);
    setActiveNfcRecord(null);
    if (latestUser.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab(isNewRegistration ? 'arisan' : 'beranda');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveNfcRecord(null);
    setPublicView('home');
    setActiveTab('beranda');
  };

  // Admin BTN Action 1: Determine lottery winner (random spin or manual assignment)
  const handleAdminSelectWinner = (
    userId: string,
    method: 'undian-acak' | 'penetapan-manual'
  ) => {
    setDemoStore((prev) => {
      const target = prev.users.find((u) => u.id === userId);
      if (!target) return prev;
      const zoneLabel =
        ARISAN_LOCATION_ZONES.find((z) => z.id === target.domicileZoneId)?.shortLabel || 'Jawa';

      const updatedUsers = prev.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              lotteryStatus: 'terpilih-akad' as const,
              roleLabel: 'Terpilih Akad · Menunggu Kartu Kunci NFC',
            }
          : u
      );

      return {
        ...prev,
        users: updatedUsers,
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: formatNowIndonesian(),
            action: method,
            participantName: target.name,
            zoneLabel,
            detail:
              method === 'undian-acak'
                ? `Terpilih melalui undian acak klaster ${zoneLabel} (Giliran #${target.arisanSlotNumber}).`
                : `Ditetapkan langsung untuk jadwal akad klaster ${zoneLabel} oleh Admin BTN.`,
          },
          ...prev.auditLogs,
        ],
      };
    });
  };

  // Admin BTN Action 2: Program & issue NFC Smart Key Card to a participant
  const handleAdminProgramNfcCard = (userId: string, record: NfcPropertyRecord) => {
    setDemoStore((prev) => {
      const target = prev.users.find((u) => u.id === userId);
      const zoneLabel =
        ARISAN_LOCATION_ZONES.find((z) => z.id === target?.domicileZoneId)?.shortLabel || 'Jawa';

      const existsIdx = prev.nfcRegistry.findIndex(
        (r) => r.uid.toUpperCase() === record.uid.toUpperCase()
      );
      const nextRegistry =
        existsIdx >= 0
          ? prev.nfcRegistry.map((r, i) => (i === existsIdx ? record : r))
          : [record, ...prev.nfcRegistry];

      const nextUsers = prev.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              hasReceivedUnit: true,
              assignedNfcUid: record.uid,
              lotteryStatus: 'kartu-aktif' as const,
              roleLabel: 'Penerima Unit BTN · Kartu NFC Aktif',
            }
          : u
      );

      return {
        users: nextUsers,
        nfcRegistry: nextRegistry,
        auditLogs: [
          {
            id: `log-nfc-${Date.now()}`,
            timestamp: formatNowIndonesian(),
            action: 'program-nfc',
            participantName: target?.name || record.ownerName,
            zoneLabel,
            detail: `Kartu ${record.uid} diprogram untuk ${record.clusterName} ${record.unitBlock} (${record.houseTypeLabel} · ${record.certificateNo}).`,
          },
          ...prev.auditLogs,
        ],
      };
    });
  };

  // Admin BTN Action 3: Freeze NFC Card (missed daily payments -> rental conversion), Reactivate, or Release SHM
  const handleAdminUpdateNfcOccupancyStatus = (
    uid: string,
    status: OccupancyLegalStatus,
    reason?: string
  ) => {
    setDemoStore((prev) => {
      const targetRec = prev.nfcRegistry.find((r) => r.uid.toUpperCase() === uid.toUpperCase());
      if (!targetRec) return prev;

      const nextRegistry = prev.nfcRegistry.map((r) =>
        r.uid.toUpperCase() === uid.toUpperCase()
          ? {
              ...r,
              occupancyStatus: status,
              freezeReason: status === 'dibekukan-tunggakan' ? reason : undefined,
              paidDays: status === 'lunas-shm' ? r.totalRequiredDays ?? 3400 : r.paidDays,
            }
          : r
      );

      const actionType =
        status === 'dibekukan-tunggakan'
          ? ('bekukan-nfc' as const)
          : status === 'lunas-shm'
          ? ('lunas-shm' as const)
          : ('aktifkan-nfc' as const);

      const detail =
        status === 'dibekukan-tunggakan'
          ? `Kartu ${uid} (${targetRec.clusterName}) DIBEKUKAN akibat tunggakan iuran harian. Hak huni dicabut, SHM tetap disimpan Bank BTN, setoran dikonversi sebagai biaya sewa (rental).`
          : status === 'lunas-shm'
          ? `Iuran harian unit ${uid} (${targetRec.clusterName}) dinyatakan LUNAS 100% — sertifikat SHM diserahkan penuh.`
          : `Kartu ${uid} (${targetRec.clusterName}) diaktifkan kembali dengan status Hak Huni Sewa-Beli Aktif.`;

      return {
        ...prev,
        nfcRegistry: nextRegistry,
        auditLogs: [
          {
            id: `log-status-${Date.now()}`,
            timestamp: formatNowIndonesian(),
            action: actionType,
            participantName: targetRec.ownerName,
            zoneLabel: targetRec.lokasiKota,
            detail,
          },
          ...prev.auditLogs,
        ],
      };
    });

    if (
      status === 'dibekukan-tunggakan' &&
      activeNfcRecord?.uid.toUpperCase() === uid.toUpperCase()
    ) {
      setActiveNfcRecord(null);
    }
  };

  const handleResetAdminDemoStore = () => {
    const fresh = resetDemoStoreState();
    setDemoStore(fresh);
  };

  // Bridge Action: NFC Card Scanned & Verified -> Hydrate exact house data & unlock Layer 2!
  const handlePropertyUnlocked = (record: NfcPropertyRecord) => {
    setActiveNfcRecord(record);

    const tpl =
      HOUSE_TEMPLATES.find((t) => t.id === record.templateId) || DEFAULT_TEMPLATE;
    setTemplateId(tpl.id);
    setLotLength(tpl.lotLength);
    setLotWidth(tpl.lotWidth);
    setRooms(tpl.rooms.map((r) => ({ ...r })));
    setFloorView('lt1');

    setProfile({
      namaPemilik: record.ownerName,
      lokasiKota: record.lokasiKota,
      luasTanah: record.luasTanah,
      luasBangunanEksisting: record.luasBangunanEksisting,
      nilaiAwalProperti: record.nilaiSerahTerimaAwal,
      contingencyRate: 0.08,
      tahunDibangun: record.tahunDibangun,
      usiaBangunanTahun: record.usiaBangunanTahun,
      umurEkonomisTahun: record.umurEkonomisTahun,
      porsiNilaiTanah: record.porsiNilaiTanah,
      kondisiBangunan: record.kondisiBangunan,
    });
  };

  const handleSelectTemplate = (nextTemplateId: string) => {
    const tpl = HOUSE_TEMPLATES.find((t) => t.id === nextTemplateId);
    if (!tpl) return;

    setTemplateId(tpl.id);
    setLotLength(tpl.lotLength);
    setLotWidth(tpl.lotWidth);

    setRooms((prev) => {
      const customRooms = prev.filter((r) => r.id.startsWith('room-kustom-'));
      return [...tpl.rooms.map((r) => ({ ...r })), ...customRooms];
    });

    setProfile((prev) => ({
      ...prev,
      luasTanah: tpl.luasTanah,
      luasBangunanEksisting: tpl.luasBangunanEksisting,
      nilaiAwalProperti: tpl.nilaiAwalProperti,
    }));
  };

  const handleUpdateRoom = (
    roomId: string,
    patch: Partial<FloorRoom>,
    syncModuleVolume?: number
  ) => {
    let targetModuleId: string | undefined;

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          targetModuleId = r.moduleId;
          return { ...r, ...patch };
        }
        return r;
      })
    );

    if (syncModuleVolume !== undefined && targetModuleId) {
      const modId = targetModuleId;
      setActivePresetId(null);
      setModules((prev) =>
        prev.map((m) => {
          if (m.id !== modId) return m;
          const clamped = Math.max(m.minVolume, Math.min(m.maxVolume, syncModuleVolume));
          return { ...m, customVolume: clamped };
        })
      );
    }
  };

  const handleMirrorRooms = () => {
    const flipWall = (w?: 'top' | 'right' | 'bottom' | 'left') => {
      if (w === 'top') return 'bottom' as const;
      if (w === 'bottom') return 'top' as const;
      return w;
    };
    setRooms((prev) =>
      prev.map((r) => ({
        ...r,
        y: Math.max(0, Math.round((lotWidth - (r.y + r.h)) * 2) / 2),
        doorWall: flipWall(r.doorWall),
        windowWalls: r.windowWalls?.map((w) => flipWall(w)!),
      }))
    );
  };

  const handleResetLayout = () => {
    const tpl = HOUSE_TEMPLATES.find((t) => t.id === templateId) || DEFAULT_TEMPLATE;
    setRooms((prev) => {
      const customRooms = prev.filter((r) => r.id.startsWith('room-kustom-'));
      return [...tpl.rooms.map((r) => ({ ...r })), ...customRooms];
    });
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = PITCHING_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const targetMap = new Map(preset.targetModules.map((tm) => [tm.id, tm]));
    setModules((prev) =>
      prev.map((m) => {
        const target = targetMap.get(m.id);
        if (target) {
          return {
            ...m,
            isSelected: true,
            customVolume: target.volume,
            selectedPhase: target.phase,
          };
        }
        return { ...m, isSelected: false };
      })
    );
    setActivePresetId(presetId);

    if (presetId === 'ekspansi-vertikal') {
      setFloorView('lt2');
    } else {
      setFloorView('lt1');
    }
  };

  const handleToggleModule = (id: string) => {
    setActivePresetId(null);
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isSelected: !m.isSelected } : m))
    );
  };

  const handleChangeModulePhase = (id: string, phase: PhaseId) => {
    setActivePresetId(null);
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selectedPhase: phase } : m))
    );
  };

  const handleModulesChange = (updated: ExpansionModule[]) => {
    setActivePresetId(null);
    setModules(updated);
  };

  const handleAddCustomModule = (newMod: ExpansionModule) => {
    setActivePresetId(null);
    setModules((prev) => [...prev, newMod]);

    const side = Math.max(2, Math.min(4, Math.round(Math.sqrt(newMod.defaultVolume) * 2) / 2));
    const spawnW = Math.min(lotLength - 1, side);
    const spawnH = Math.min(
      lotWidth - 1,
      Math.max(2, Math.round((newMod.defaultVolume / spawnW) * 2) / 2)
    );

    const newRoom: FloorRoom = {
      id: `room-${newMod.id}`,
      label: newMod.name,
      kind: 'module',
      moduleId: newMod.id,
      floor: newMod.selectedPhase === 'tahap-3' ? 'lt2' : 'lt1',
      x: 0.5,
      y: Math.max(0, lotWidth - spawnH),
      w: spawnW,
      h: spawnH,
      furniture: 'custom',
      doorWall: 'top',
      doorType: 'single',
      windowWalls: ['left'],
      elevation: newMod.selectedPhase === 'tahap-3' ? '+3.40' : '±0.00',
    };

    setRooms((prev) => [...prev, newRoom]);
    setFloorView(newRoom.floor);
  };

  const handleDeleteCustomModule = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
    setRooms((prev) => prev.filter((r) => r.moduleId !== id));
  };

  const handleResetDefaults = () => {
    if (activeNfcRecord) {
      handlePropertyUnlocked(activeNfcRecord);
    } else {
      setTemplateId(DEFAULT_TEMPLATE.id);
      setLotLength(DEFAULT_TEMPLATE.lotLength);
      setLotWidth(DEFAULT_TEMPLATE.lotWidth);
      setRooms(DEFAULT_TEMPLATE.rooms.map((r) => ({ ...r })));
      setProfile(DEFAULT_HOUSING_PROFILE);
    }
    setModules(BASELINE_MODULES);
    setActivePresetId(null);
    setFloorView('lt1');
  };

  // STEP 0: Promotional Main Dashboard OR Unified Login/Registration Gate
  if (!currentUser) {
    if (publicView === 'home') {
      return (
        <ProgramHomeView
          user={null}
          onOpenRegister={(zoneId) => {
            setPrefillZoneId(zoneId);
            setPublicView('register');
          }}
          onOpenLogin={() => setPublicView('login')}
        />
      );
    }

    return (
      <LoginScreen
        key={`${publicView}-${prefillZoneId || 'default'}`}
        initialMode={publicView === 'register' ? 'register' : 'login'}
        preselectedZoneId={prefillZoneId}
        allUsers={demoStore.users}
        onBackToHome={() => setPublicView('home')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <>
      <AppShell
        user={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeNfcRecord={activeNfcRecord}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onResetDefaults={handleResetDefaults}
        onQuickPrint={() => setActiveTab(activeNfcRecord ? 'proposal' : 'nfc')}
        onLogout={handleLogout}
        profile={profile}
        selectedModuleCount={selectedModuleCount}
      >
        {/* Portal Operasional Admin BTN (Undian Arisan & Pemrograman Kartu NFC) */}
        {currentUser.role === 'admin' && (
          <AdminPortalView
            adminUser={currentUser}
            users={demoStore.users}
            nfcRegistry={demoStore.nfcRegistry}
            auditLogs={demoStore.auditLogs}
            onSelectWinner={handleAdminSelectWinner}
            onProgramNfcCard={handleAdminProgramNfcCard}
            onUpdateNfcOccupancyStatus={handleAdminUpdateNfcOccupancyStatus}
            onResetDemoData={handleResetAdminDemoStore}
          />
        )}

        {/* Beranda Program (Dashboard Utama Berwarna & Personal) */}
        {currentUser.role !== 'admin' && activeTab === 'beranda' && (
          <ProgramHomeView
            user={currentUser}
            hasUnlockedNfc={Boolean(activeNfcRecord)}
            onGoToArisan={(_zoneId, projectId) => {
              if (projectId) setSelectedArisanProjectId(projectId);
              setActiveTab('arisan');
            }}
            onGoToNfc={() => setActiveTab('nfc')}
            onGoToPlanner={() => setActiveTab('planner')}
          />
        )}

        {/* Skema Arisan Rumah BTN (Otomatis sesuai wilayah biodata user) */}
        {currentUser.role !== 'admin' && activeTab === 'arisan' && (
          <ArisanLayerView
            user={currentUser}
            nfcRegistry={demoStore.nfcRegistry}
            initialProjectId={selectedArisanProjectId}
            onGoToNfcScanner={() => setActiveTab('nfc')}
          />
        )}

        {/* BRIDGE: Pemindai Kartu Kunci Rumah NFC */}
        {currentUser.role !== 'admin' && activeTab === 'nfc' && (
          <NfcScannerView
            user={currentUser}
            activeNfcRecord={activeNfcRecord}
            nfcRegistry={demoStore.nfcRegistry}
            onPropertyUnlocked={handlePropertyUnlocked}
            onGoToLayer2={() => setActiveTab('planner')}
          />
        )}

        {/* LAYER 2 (Protected by NFC Card Verification): Perencanaan Rumah Tumbuh */}
        {activeTab === 'planner' && activeNfcRecord && (
          <PlannerWorkspace
            activeNfcRecord={activeNfcRecord}
            profile={profile}
            modules={modules}
            valuation={valuation}
            templateId={templateId}
            lotLength={lotLength}
            lotWidth={lotWidth}
            rooms={rooms}
            floorView={floorView}
            onFloorViewChange={setFloorView}
            onSelectTemplate={handleSelectTemplate}
            onUpdateRoom={handleUpdateRoom}
            onMirrorRooms={handleMirrorRooms}
            onResetLayout={handleResetLayout}
            onProfileChange={setProfile}
            onModulesChange={handleModulesChange}
            onAddCustomModule={handleAddCustomModule}
            onDeleteCustomModule={handleDeleteCustomModule}
            onToggleModule={handleToggleModule}
            onChangeModulePhase={handleChangeModulePhase}
            onGoToAnalytics={() => setActiveTab('analytics')}
            onSwitchNfcCard={() => setActiveTab('nfc')}
          />
        )}

        {/* LAYER 2: Valuasi, Penyusutan & KPR BTN */}
        {activeTab === 'analytics' && activeNfcRecord && (
          <ValuationAnalyticsView
            profile={profile}
            valuation={valuation}
            onGoToPlanner={() => setActiveTab('planner')}
            onGoToProposal={() => setActiveTab('proposal')}
          />
        )}

        {/* LAYER 2: Proposal Siap Cetak A4 */}
        {activeTab === 'proposal' && activeNfcRecord && (
          <ProposalPrintView
            activeNfcRecord={activeNfcRecord}
            profile={profile}
            modules={modules}
            valuation={valuation}
            templateId={templateId}
            lotLength={lotLength}
            lotWidth={lotWidth}
            rooms={rooms}
            floorView={floorView}
            onFloorViewChange={setFloorView}
            onSelectTemplate={handleSelectTemplate}
            onUpdateRoom={handleUpdateRoom}
            onMirrorRooms={handleMirrorRooms}
            onResetLayout={handleResetLayout}
            onToggleModule={handleToggleModule}
            onBackToPlanner={() => setActiveTab('planner')}
          />
        )}
      </AppShell>

      <SecurityBadgeModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        user={currentUser}
        activeNfcRecord={activeNfcRecord}
        onDisconnectNfc={() => {
          setActiveNfcRecord(null);
          setActiveTab('arisan');
        }}
      />
    </>
  );
}
