import { Injectable } from '@angular/core';

export interface LeaderStats {
  [leaderName: string]: {
    wins: number;
    losses: number;
    type: 'gym' | 'elite' | 'champion' | 'rival';
  }
}

export interface HallOfFameEntry {
  team: { name: string; pokemonId: number; shiny: boolean }[];
  generation: string;
  date: string;
}

export interface GameStats {
  leaders: LeaderStats;
  hallOfFame: HallOfFameEntry[];
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {

  private readonly STORAGE_KEY = 'pokemon-roulette-stats';
  private stats: GameStats = { leaders: {}, hallOfFame: [] };

  constructor() {
    this.loadStats();
  }

  recordBattle(leaderName: string, won: boolean, type: 'gym' | 'elite' | 'champion' | 'rival'): void {
    if (!this.stats.leaders[leaderName]) {
      this.stats.leaders[leaderName] = { wins: 0, losses: 0, type };
    }
    if (won) {
      this.stats.leaders[leaderName].wins++;
    } else {
      this.stats.leaders[leaderName].losses++;
    }
    this.saveStats();
  }

  recordHallOfFame(team: { name: string; pokemonId: number; shiny: boolean }[], generation: string): void {
    // prevent duplicate entries on F5 during game-finish
    const last = this.stats.hallOfFame[this.stats.hallOfFame.length - 1];
    if (last && last.generation === generation &&
        JSON.stringify(last.team.map(p => p.pokemonId)) === JSON.stringify(team.map(p => p.pokemonId))) {
      return;
    }

    this.stats.hallOfFame.push({
      team,
      generation,
      date: new Date().toLocaleDateString()
    });
    this.saveStats();
  }

  getStats(): GameStats {
    return this.stats;
  }

  getLeaderWinrate(leaderName: string): number {
    const entry = this.stats.leaders[leaderName];
    if (!entry) return 0;
    const total = entry.wins + entry.losses;
    if (total === 0) return 0;
    return Math.round((entry.wins / total) * 100);
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
    } catch (e) {
      console.error('Failed to save stats:', e);
    }
  }

  private loadStats(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      // handle old format gracefully
      if (parsed.leaders) {
        this.stats = parsed;
      }

      // dedup hall of fame entries
      if (this.stats.hallOfFame?.length > 1) {
        this.stats.hallOfFame = this.stats.hallOfFame.filter((entry, i, arr) => {
          if (i === 0) return true;
          const prev = arr[i - 1];
          return !(prev.generation === entry.generation &&
            JSON.stringify(prev.team.map(p => p.pokemonId)) === JSON.stringify(entry.team.map(p => p.pokemonId)));
        });
        this.saveStats();
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }
}
