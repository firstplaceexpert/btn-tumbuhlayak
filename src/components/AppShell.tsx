'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  BarChart3,
  FileText,
  ShieldCheck,
  RotateCcw,
  Printer,
  Menu,
  X,
  Users,
  Wifi,
  LogOut,
  CheckCircle2,
  ChevronDown,
  Home,
} from 'lucide-react';
import { DemoUser, HousingProfile, NfcPropertyRecord } from '../types';
import { BtnLogo } from './BtnLogo';

export type WorkspaceTab =
  | 'beranda'
  | 'arisan'
  | 'nfc'
  | 'planner'
  | 'analytics'
  | 'proposal'
  | 'admin';

interface AppShellProps {
  user: DemoUser;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  activeNfcRecord: NfcPropertyRecord | null;
  onOpenMethodology: () => void;
  onResetDefaults: () => void;
  onQuickPrint: () => void;
  onLogout: () => void;
  profile: HousingProfile;
  selectedModuleCount: number;
  children: React.ReactNode;
}

const PROPERTY_NAV_ITEMS: {
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'planner', label: 'Perencanaan & Denah', icon: Compass },
  { id: 'analytics', label: 'Valuasi & KPR', icon: BarChart3 },
  { id: 'proposal', label: 'Ringkasan & Cetak', icon: FileText },
];

export const AppShell: React.FC<AppShellProps> = ({
  user,
  activeTab,
  onSelectTab,
  activeNfcRecord,
  onOpenMethodology,
  onResetDefaults,
  onQuickPrint,
  onLogout,
  selectedModuleCount,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const isPropertyUnlocked = Boolean(activeNfcRecord);
  const isAdmin = user.role === 'admin';

  const userInitials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setAccountMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavClick = (tab: WorkspaceTab) => {
    if ((tab === 'planner' || tab === 'analytics' || tab === 'proposal') && !isPropertyUnlocked) {
      onSelectTab('nfc');
    } else {
      onSelectTab(tab);
    }
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-frame flex flex-col">
      {/* Floating Horizontal Top Navigation Bar */}
      <div className="sticky top-3 z-40 px-3 sm:px-5 pt-3 no-print">
        <header className="max-w-[1260px] mx-auto bg-sheet/95 backdrop-blur-md border border-hairline rounded-[16px] shadow-[0_8px_28px_-8px_rgba(15,23,42,0.12)] px-3.5 sm:px-5 h-16 flex items-center justify-between gap-3">
          {/* Left: Official BTN Wordmark */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleNavClick(isAdmin ? 'admin' : 'beranda')}
              className="text-left focus:outline-none rounded-control"
              aria-label="Beranda btn TumbuhLayak"
            >
              <div className="hidden xl:block">
                <BtnLogo size="md" showTagline />
              </div>
              <div className="xl:hidden">
                <BtnLogo size="sm" />
              </div>
            </button>
          </div>

          {/* Center: Horizontal Navigation Menu */}
          <nav
            aria-label="Navigasi utama"
            className="hidden lg:flex items-center gap-0.5 flex-shrink-0"
          >
            {isAdmin ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-btnred-soft border border-btnred-border text-btnred text-[13px] font-semibold">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>Portal Operasional Admin BTN</span>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('beranda')}
                  aria-current={activeTab === 'beranda' ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-[10px] text-[12.5px] whitespace-nowrap transition-colors ${
                    activeTab === 'beranda'
                      ? 'bg-brand-soft text-brand font-semibold'
                      : 'text-ink-secondary hover:bg-well hover:text-ink font-medium'
                  }`}
                >
                  <Home
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      activeTab === 'beranda' ? 'text-brand' : 'text-ink-subtle'
                    }`}
                    aria-hidden="true"
                  />
                  <span>Beranda</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('arisan')}
                  aria-current={activeTab === 'arisan' ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-[10px] text-[12.5px] whitespace-nowrap transition-colors ${
                    activeTab === 'arisan'
                      ? 'bg-brand-soft text-brand font-semibold'
                      : 'text-ink-secondary hover:bg-well hover:text-ink font-medium'
                  }`}
                >
                  <Users
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      activeTab === 'arisan' ? 'text-brand' : 'text-ink-subtle'
                    }`}
                    aria-hidden="true"
                  />
                  <span>Arisan Rumah</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('nfc')}
                  aria-current={activeTab === 'nfc' ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-[10px] text-[12.5px] whitespace-nowrap transition-colors ${
                    activeTab === 'nfc'
                      ? 'bg-brand-soft text-brand font-semibold'
                      : 'text-ink-secondary hover:bg-well hover:text-ink font-medium'
                  }`}
                >
                  <Wifi
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      activeTab === 'nfc'
                        ? 'text-brand'
                        : isPropertyUnlocked
                        ? 'text-positive'
                        : 'text-btnred'
                    }`}
                    aria-hidden="true"
                  />
                  <span>Scan Kartu</span>
                  {isPropertyUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-positive flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-btnred flex-shrink-0" aria-hidden="true" />
                  )}
                </button>

                {/* Menu Perencanaan & Nilai Rumah (hanya muncul setelah kartu NFC terverifikasi) */}
                {isPropertyUnlocked && (
                  <>
                    <span className="h-5 w-px bg-hairline mx-1 flex-shrink-0" aria-hidden="true" />

                    {PROPERTY_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavClick(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-[10px] text-[12.5px] whitespace-nowrap transition-colors ${
                            isActive
                              ? 'bg-brand-soft text-brand font-semibold'
                              : 'text-ink-secondary hover:bg-well hover:text-ink font-medium'
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              isActive ? 'text-brand' : 'text-ink-subtle'
                            }`}
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                          {item.id === 'planner' && (
                            <span
                              className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                                isActive
                                  ? 'bg-brand text-white'
                                  : 'bg-well text-ink-secondary border border-hairline'
                              }`}
                            >
                              {selectedModuleCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </nav>

          {/* Right: User Account Dropdown + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Desktop Account Dropdown */}
            <div ref={accountMenuRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-[10px] border border-hairline bg-well/70 hover:bg-well text-ink transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-brand text-white text-[11px] font-display font-bold flex items-center justify-center flex-shrink-0">
                  {userInitials}
                </span>
                <span className="text-[13px] font-medium max-w-[110px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-ink-secondary transition-transform ${
                    accountMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-[14px] bg-sheet border border-hairline shadow-[0_14px_36px_-10px_rgba(15,23,42,0.18)] p-2 space-y-1 z-50"
                >
                  <div className="px-2.5 py-2 border-b border-rule mb-1">
                    <div className="text-[13px] font-semibold text-ink truncate">{user.name}</div>
                    <div className="text-xs text-ink-secondary truncate">{user.email}</div>
                    {user.domicileCity && (
                      <div className="text-[11px] text-brand font-medium truncate mt-0.5">
                        Domisili: {user.domicileCity}
                      </div>
                    )}
                  </div>

                  {isPropertyUnlocked && activeNfcRecord && (
                    <div className="px-2.5 py-2 rounded-control bg-positive-soft/60 border border-positive-border mb-1">
                      <div className="text-[11px] font-mono font-semibold text-positive">
                        {activeNfcRecord.uid}
                      </div>
                      <div className="text-xs text-ink-secondary truncate">
                        {activeNfcRecord.unitBlock} · {activeNfcRecord.houseTypeLabel}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenMethodology();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-control text-[13px] text-ink-secondary hover:bg-well hover:text-ink transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
                    <span>Keamanan akun</span>
                  </button>

                  {isPropertyUnlocked && (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleNavClick('nfc')}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-control text-[13px] text-ink-secondary hover:bg-well hover:text-ink transition-colors"
                      >
                        <Wifi className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
                        <span>Ganti kartu rumah</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onResetDefaults();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-control text-[13px] text-ink-secondary hover:bg-well hover:text-ink transition-colors"
                      >
                        <RotateCcw className="w-4 h-4 text-ink-subtle flex-shrink-0" aria-hidden="true" />
                        <span>Reset standar SNI</span>
                      </button>
                    </>
                  )}

                  <div className="pt-1 mt-1 border-t border-rule">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-control text-[13px] text-btnred hover:bg-btnred-soft transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span>Keluar akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-hairline bg-well text-ink hover:bg-active"
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Menu className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Floating Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden max-w-[1260px] mx-auto mt-2 rounded-[16px] bg-sheet border border-hairline shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)] p-3 space-y-3">
            <nav aria-label="Navigasi seluler" className="space-y-1">
              {isAdmin ? (
                <div className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-control bg-btnred-soft border border-btnred-border text-btnred text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>Portal Operasional Admin BTN</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavClick('beranda')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-control text-sm ${
                      activeTab === 'beranda'
                        ? 'bg-brand-soft text-brand font-semibold'
                        : 'text-ink-secondary hover:bg-well hover:text-ink'
                    }`}
                  >
                    <Home className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>Beranda Program</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavClick('arisan')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-control text-sm ${
                      activeTab === 'arisan'
                        ? 'bg-brand-soft text-brand font-semibold'
                        : 'text-ink-secondary hover:bg-well hover:text-ink'
                    }`}
                  >
                    <Users className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>Arisan Rumah BTN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavClick('nfc')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-sm ${
                      activeTab === 'nfc'
                        ? 'bg-brand-soft text-brand font-semibold'
                        : 'text-ink-secondary hover:bg-well hover:text-ink'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Wifi className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span>Scan Kartu Rumah Anda</span>
                    </span>
                    {isPropertyUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-positive" aria-hidden="true" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-btnred" aria-hidden="true" />
                    )}
                  </button>

                  {isPropertyUnlocked &&
                    PROPERTY_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-sm ${
                            isActive
                              ? 'bg-brand-soft text-brand font-semibold'
                              : 'text-ink-secondary hover:bg-well hover:text-ink'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                            <span>{item.label}</span>
                          </span>
                          {item.id === 'planner' && (
                            <span className="text-xs tabular-nums px-2 py-0.5 rounded-full bg-brand-soft text-brand font-semibold">
                              {selectedModuleCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </>
              )}
            </nav>

            <div className="pt-2.5 border-t border-rule space-y-1">
              <div className="px-3 py-1.5">
                <div className="text-[13px] font-semibold text-ink">{user.name}</div>
                <div className="text-xs text-ink-secondary">{user.email}</div>
              </div>

              {isPropertyUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onQuickPrint();
                  }}
                  className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-sm text-brand font-medium hover:bg-brand-soft"
                >
                  <Printer className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>Cetak PDF</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMethodology();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-sm text-ink-secondary hover:bg-well hover:text-ink"
              >
                <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
                <span>Keamanan akun</span>
              </button>

              {isPropertyUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onResetDefaults();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-sm text-ink-secondary hover:bg-well hover:text-ink"
                >
                  <RotateCcw className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>Reset standar SNI</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-sm text-btnred hover:bg-btnred-soft font-medium"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>Keluar akun</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Centered Warm Workspace Sheet */}
      <div className="flex-1 px-3 sm:px-6 pt-5 pb-10 min-w-0">
        <main className="max-w-[1220px] mx-auto bg-sheet border border-hairline rounded-sheet min-w-0 print-sheet">
          <div className="px-5 py-6 sm:px-9 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
