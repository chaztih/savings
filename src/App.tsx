/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  BookOpen, 
  History, 
  Star, 
  X, 
  CheckCircle2, 
  Coins, 
  TrendingUp,
  Calendar as CalendarIcon,
  ChevronRight,
  Plus,
  Crown,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface SavingsEntry {
  date: string; // ISO string
  amount: number;
  diary: string;
}

interface AppState {
  entries: Record<string, SavingsEntry>;
  isPro: boolean;
  lastDrawDate: string | null;
}

// --- Constants ---
const BANKNOTES = [100, 200, 300, 500, 1000];
const STORAGE_KEY = 'daily_savings_app_data';

// --- Components ---

const AdBanner = ({ isPro }: { isPro: boolean }) => {
  if (isPro) return null;
  return (
    <div className="w-full p-4 bg-zinc-100 border border-zinc-200 rounded-xl mt-8 flex items-center justify-between overflow-hidden relative group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-zinc-300 rounded-lg flex items-center justify-center text-zinc-500 font-bold text-xs">AD</div>
        <div>
          <h4 className="font-bold text-zinc-800 text-sm">想擺脫廣告嗎？</h4>
          <p className="text-zinc-500 text-xs">升級到 Pro 版本，享受純淨的存錢體驗。</p>
        </div>
      </div>
      <button className="px-4 py-2 bg-zinc-800 text-white text-xs font-bold rounded-lg hover:bg-zinc-700 transition-colors">
        了解更多
      </button>
      <div className="absolute top-1 right-2 text-[10px] text-zinc-400 uppercase tracking-widest">Sponsored</div>
    </div>
  );
};

const SubscriptionModal = ({ isOpen, onClose, onUpgrade }: { isOpen: boolean, onClose: () => void, onUpgrade: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Crown size={32} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">升級到 Pro 版本</h2>
              <p className="text-zinc-500 mb-8">一次性付費，解鎖所有高級功能並移除廣告。</p>
              
              <div className="space-y-4 mb-8">
                {[
                  "完全移除所有廣告",
                  "無限次數補登日記",
                  "導出存錢數據 (CSV)",
                  "多種主題配色選擇",
                  "支持獨立開發者"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-left">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <span className="text-zinc-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl mb-8 border border-zinc-100">
                <div className="text-xs text-zinc-400 uppercase font-bold tracking-widest mb-1">限時優惠</div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-black text-zinc-900">NT$ 150</span>
                  <span className="text-zinc-400 line-through text-sm">NT$ 300</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  onUpgrade();
                  onClose();
                }}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-transform active:scale-95 shadow-lg shadow-zinc-200"
              >
                立即升級
              </button>
              
              <button 
                onClick={onClose}
                className="mt-4 text-zinc-400 text-sm font-medium hover:text-zinc-600 transition-colors"
              >
                稍後再說
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return { entries: {}, isPro: false, lastDrawDate: null };
  });

  const [showSubModal, setShowSubModal] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnAmount, setDrawnAmount] = useState<number | null>(null);
  const [diaryText, setDiaryText] = useState('');
  const [view, setView] = useState<'today' | 'history'>('today');

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = state.entries[todayStr];
  const hasDrawnToday = !!todayEntry;

  const handleDraw = () => {
    if (hasDrawnToday) return;
    
    setIsDrawing(true);
    // Simulate a "slot machine" effect
    setTimeout(() => {
      const randomAmount = BANKNOTES[Math.floor(Math.random() * BANKNOTES.length)];
      setDrawnAmount(randomAmount);
      setIsDrawing(false);
    }, 1500);
  };

  const handleSaveDiary = () => {
    if (drawnAmount === null) return;
    
    const newEntry: SavingsEntry = {
      date: new Date().toISOString(),
      amount: drawnAmount,
      diary: diaryText
    };

    setState(prev => ({
      ...prev,
      entries: {
        ...prev.entries,
        [todayStr]: newEntry
      },
      lastDrawDate: todayStr
    }));
    
    setDrawnAmount(null);
    setDiaryText('');
  };

  const totalSaved = useMemo(() => {
    return (Object.values(state.entries) as SavingsEntry[]).reduce((sum, entry) => sum + entry.amount, 0);
  }, [state.entries]);

  const sortedEntries = useMemo(() => {
    return (Object.values(state.entries) as SavingsEntry[]).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [state.entries]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-bottom border-zinc-100 px-6 py-4 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
            <Wallet size={18} />
          </div>
          <h1 className="font-black text-xl tracking-tight">SAVINGS</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {!state.isPro && (
            <button 
              onClick={() => setShowSubModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <Crown size={14} />
              <span>PRO</span>
            </button>
          )}
          <button 
            onClick={() => setView(view === 'today' ? 'history' : 'today')}
            className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors"
          >
            {view === 'today' ? <History size={20} /> : <BookOpen size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 pb-32">
        {view === 'today' ? (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">累計儲蓄</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-zinc-400">NT$</span>
                  <span className="text-2xl font-black">{totalSaved.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">儲蓄天數</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{Object.keys(state.entries).length}</span>
                  <span className="text-xs font-bold text-zinc-400">DAYS</span>
                </div>
              </div>
            </div>

            {/* Main Action Area */}
            <section className="relative">
              {!hasDrawnToday && drawnAmount === null ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] p-10 text-center border border-zinc-100 shadow-xl shadow-zinc-100/50 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-100" />
                  
                  <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                    <Coins size={40} className={cn("text-zinc-300", isDrawing && "animate-bounce")} />
                  </div>
                  
                  <h2 className="text-2xl font-black mb-2">準備好今天的挑戰了嗎？</h2>
                  <p className="text-zinc-500 text-sm mb-10 max-w-[240px] mx-auto">
                    點擊按鈕抽取今天的存錢金額，只存鈔票，不留零頭。
                  </p>

                  <button 
                    onClick={handleDraw}
                    disabled={isDrawing}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg",
                      isDrawing 
                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                        : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200"
                    )}
                  >
                    {isDrawing ? "抽取中..." : "開始抽取"}
                  </button>
                </motion.div>
              ) : hasDrawnToday ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-emerald-50 rounded-[2.5rem] p-10 text-center border border-emerald-100"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-900 mb-1">今日已完成！</h2>
                  <div className="text-4xl font-black text-emerald-600 mb-4">
                    <span className="text-lg mr-1">NT$</span>
                    {todayEntry.amount}
                  </div>
                  <p className="text-emerald-700/60 text-sm italic">「{todayEntry.diary || "今天沒有寫下心情..."}」</p>
                  
                  <button 
                    onClick={() => setView('history')}
                    className="mt-8 text-emerald-700 text-xs font-bold uppercase tracking-widest flex items-center gap-1 mx-auto hover:gap-2 transition-all"
                  >
                    查看歷史記錄 <ChevronRight size={14} />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-xl"
                >
                  <div className="text-center mb-8">
                    <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">今日存錢金額</div>
                    <div className="text-6xl font-black tracking-tighter text-zinc-900">
                      <span className="text-2xl align-top mr-1">$</span>
                      {drawnAmount}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">今日日記</span>
                      <textarea 
                        value={diaryText}
                        onChange={(e) => setDiaryText(e.target.value)}
                        placeholder="今天發生了什麼好事？寫下來吧..."
                        className="mt-2 w-full h-32 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all resize-none text-sm"
                      />
                    </label>
                    
                    <button 
                      onClick={handleSaveDiary}
                      className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-transform active:scale-95 shadow-lg shadow-zinc-200"
                    >
                      確認並儲存
                    </button>
                    
                    <button 
                      onClick={() => setDrawnAmount(null)}
                      className="w-full py-2 text-zinc-400 text-xs font-medium hover:text-zinc-600 transition-colors"
                    >
                      重新抽取 (僅限測試期)
                    </button>
                  </div>
                </motion.div>
              )}
            </section>

            {/* Ad Banner */}
            <AdBanner isPro={state.isPro} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black">歷史記錄</h2>
              <div className="text-xs font-bold text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
                {sortedEntries.length} 筆記錄
              </div>
            </div>

            {sortedEntries.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                  <AlertCircle size={32} />
                </div>
                <p className="text-zinc-400 text-sm">還沒有任何存錢記錄喔，快去存第一筆吧！</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedEntries.map((entry, i) => (
                  <motion.div 
                    key={entry.date}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-start gap-4"
                  >
                    <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-zinc-100">
                      <span className="text-[10px] font-bold text-zinc-400 leading-none mb-0.5">
                        {format(parseISO(entry.date), 'MMM')}
                      </span>
                      <span className="text-lg font-black text-zinc-800 leading-none">
                        {format(parseISO(entry.date), 'dd')}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-black text-zinc-900">
                          NT$ {entry.amount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium">
                          {format(parseISO(entry.date), 'HH:mm')}
                        </div>
                      </div>
                      <p className="text-zinc-500 text-sm line-clamp-2 italic">
                        {entry.diary || "無日記內容"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!state.isPro && sortedEntries.length > 3 && (
              <div className="p-6 bg-zinc-900 rounded-3xl text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Crown size={80} />
                </div>
                <h3 className="font-bold mb-2">解鎖完整數據分析</h3>
                <p className="text-zinc-400 text-xs mb-4">Pro 用戶可以查看月度統計圖表與趨勢分析。</p>
                <button 
                  onClick={() => setShowSubModal(true)}
                  className="px-6 py-2 bg-white text-zinc-900 text-xs font-bold rounded-full hover:bg-zinc-100 transition-colors"
                >
                  立即升級
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubModal} 
        onClose={() => setShowSubModal(false)}
        onUpgrade={() => setState(prev => ({ ...prev, isPro: true }))}
      />

      {/* Bottom Nav (Mobile style) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-zinc-100 px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 z-40">
        <button 
          onClick={() => setView('today')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all",
            view === 'today' ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          <Plus size={18} />
          <span>今日存錢</span>
        </button>
        <div className="w-px h-6 bg-zinc-100 mx-1" />
        <button 
          onClick={() => setView('history')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all",
            view === 'history' ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          <History size={18} />
          <span>歷史記錄</span>
        </button>
      </nav>
    </div>
  );
}
