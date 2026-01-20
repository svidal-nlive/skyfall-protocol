/**
 * LeaderboardDisplay - Shows top 10 endless mode runs
 * 
 * Phase 16: Endless Mode
 * - Displays local leaderboard entries
 * - Sortable by wave reached or score
 * - Shows run details (kills, duration, aircraft)
 */

import React, { useState, useMemo } from 'react';
import { Trophy, Target, Clock, Plane, Medal, ChevronUp, ChevronDown, X } from 'lucide-react';
import { endlessModeManager, EndlessRun } from '../game/EndlessModeManager';

type SortBy = 'wave' | 'score' | 'kills' | 'duration';
type SortOrder = 'asc' | 'desc';

interface LeaderboardDisplayProps {
  isVisible: boolean;
  onClose: () => void;
}

const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({ isVisible, onClose }) => {
  const [sortBy, setSortBy] = useState<SortBy>('wave');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const runs = endlessModeManager.getLeaderboard();
  
  const sortedRuns = useMemo(() => {
    const sorted = [...runs].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'wave':
          comparison = b.waveReached - a.waveReached;
          break;
        case 'score':
          comparison = b.score - a.score;
          break;
        case 'kills':
          comparison = b.kills - a.kills;
          break;
        case 'duration':
          comparison = b.duration - a.duration;
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    return sorted;
  }, [runs, sortBy, sortOrder]);
  
  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getAircraftName = (id: string): string => {
    const names: Record<string, string> = {
      falcon: 'Falcon',
      switchblade: 'Switchblade',
      ironclad: 'Ironclad',
      wraith: 'Wraith',
      archon: 'Archon',
    };
    return names[id] || id;
  };
  
  const getRankColor = (index: number): string => {
    switch (index) {
      case 0: return 'text-yellow-400';
      case 1: return 'text-slate-300';
      case 2: return 'text-amber-600';
      default: return 'text-slate-500';
    }
  };
  
  const getRankIcon = (index: number) => {
    if (index < 3) {
      return <Medal className={`w-5 h-5 ${getRankColor(index)}`} />;
    }
    return <span className="w-5 h-5 text-center text-slate-600">{index + 1}</span>;
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-purple-900/90 to-slate-900/95 border border-purple-500/30 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-purple-400" />
            <h2 className="text-2xl font-bold text-white tracking-wider">ENDLESS LEADERBOARD</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Best Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
            <div className="text-purple-300/70 text-xs tracking-wider mb-1">BEST WAVE</div>
            <div className="text-3xl font-bold text-purple-400">
              {endlessModeManager.getBestWave() > 0 ? `Wave ${endlessModeManager.getBestWave()}` : '—'}
            </div>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
            <div className="text-purple-300/70 text-xs tracking-wider mb-1">BEST SCORE</div>
            <div className="text-3xl font-bold text-purple-400">
              {endlessModeManager.getBestScore() > 0 ? endlessModeManager.getBestScore().toLocaleString() : '—'}
            </div>
          </div>
        </div>
        
        {/* Table */}
        {runs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No endless runs yet</p>
              <p className="text-sm mt-1">Complete your first endless run to see it here!</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm">
                <tr className="text-left text-xs text-slate-400 tracking-wider border-b border-slate-700">
                  <th className="pb-3 pl-2 w-10">#</th>
                  <th 
                    className="pb-3 cursor-pointer hover:text-purple-400 transition-colors"
                    onClick={() => handleSort('wave')}
                  >
                    <div className="flex items-center gap-1">
                      WAVE
                      {sortBy === 'wave' && (
                        sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="pb-3 cursor-pointer hover:text-purple-400 transition-colors"
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center gap-1">
                      SCORE
                      {sortBy === 'score' && (
                        sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="pb-3 cursor-pointer hover:text-purple-400 transition-colors hidden sm:table-cell"
                    onClick={() => handleSort('kills')}
                  >
                    <div className="flex items-center gap-1">
                      KILLS
                      {sortBy === 'kills' && (
                        sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="pb-3 cursor-pointer hover:text-purple-400 transition-colors hidden md:table-cell"
                    onClick={() => handleSort('duration')}
                  >
                    <div className="flex items-center gap-1">
                      TIME
                      {sortBy === 'duration' && (
                        sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="pb-3 hidden lg:table-cell">AIRCRAFT</th>
                  <th className="pb-3 text-right pr-2 hidden md:table-cell">DATE</th>
                </tr>
              </thead>
              <tbody>
                {sortedRuns.map((run, index) => (
                  <tr 
                    key={run.id}
                    className={`border-b border-slate-800/50 transition-colors ${
                      index === 0 ? 'bg-yellow-500/5' : 
                      index === 1 ? 'bg-slate-400/5' : 
                      index === 2 ? 'bg-amber-600/5' : 
                      'hover:bg-purple-500/5'
                    }`}
                  >
                    <td className="py-3 pl-2">
                      {getRankIcon(index)}
                    </td>
                    <td className="py-3">
                      <span className={`font-bold ${index < 3 ? getRankColor(index) : 'text-white'}`}>
                        {run.waveReached}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-purple-300">{run.score.toLocaleString()}</span>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Target className="w-3 h-3" />
                        {run.kills}
                      </div>
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatDuration(run.duration)}
                      </div>
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Plane className="w-3 h-3" />
                        {getAircraftName(run.aircraftUsed)}
                      </div>
                    </td>
                    <td className="py-3 text-right pr-2 text-xs text-slate-500 hidden md:table-cell">
                      {formatDate(run.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center text-sm">
          <span className="text-slate-500">
            {runs.length}/10 runs recorded
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white tracking-wider transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardDisplay;

