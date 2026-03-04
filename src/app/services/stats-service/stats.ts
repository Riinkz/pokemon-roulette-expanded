import { Injectable } from '@angular/core';

export interface PokemonBattleStats {
  [pokemonId: number]: {
    name: string;
    wins: number;
    losses: number;
  }
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {

  private readonly STORAGE_KEY = 'pokemon-roulette-stats';

  private stats: PokemonBattleStats = {};

  constructor() {
    this.loadStats();
  }

  recordBattle(pokemonId: number, name: string, won: boolean): void {
    if (!this.stats[pokemonId]) {
      this.stats[pokemonId] = { name, wins: 0, losses: 0 };
    }
    if (won) {
      this.stats[pokemonId].wins++;
    } else {
      this.stats[pokemonId].losses++;
    }
    this.saveStats();
  }

  getStats(): PokemonBattleStats {
    return this.stats;
  }

  getWinrate(pokemonId: number): number {
    const entry = this.stats[pokemonId];
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
      this.stats = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }
}
