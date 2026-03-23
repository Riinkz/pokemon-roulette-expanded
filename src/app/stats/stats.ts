import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MainGameButtonComponent } from '../main-game-button/main-game-button.component';
import { StatsService, HallOfFameEntry } from '../services/stats-service/stats';

interface LeaderEntry {
  name: string;
  wins: number;
  losses: number;
  winrate: number;
  type: string;
}

interface TopPokemon {
  pokemonId: number;
  name: string;
  count: number;
  shinyCount: number;
}

interface Achievement {
  label: string;
  done: boolean;
  icon: string;
}

@Component({
  selector: 'app-stats',
  imports: [CommonModule, MainGameButtonComponent, TranslatePipe],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
})
export class Stats implements OnInit {

  activeTab: 'overview' | 'battles' | 'hallOfFame' | 'pokemon' | 'records' = 'overview';

  // battles
  leadersList: LeaderEntry[] = [];
  filteredLeaders: LeaderEntry[] = [];
  battleFilter = 'all';
  sortColumn: 'name' | 'wins' | 'losses' | 'winrate' = 'winrate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // overview
  totalBattles = 0;
  totalWins = 0;
  totalLosses = 0;
  overallWinRate = 0;
  grandChampionCount = 0;
  uniquePokemonCount = 0;
  trainerRank = { title: 'Youngster', emoji: '👦' };

  // hall of fame
  hallOfFame: HallOfFameEntry[] = [];

  // counters
  legendariesCaught = 0;
  endlessWins = 0;
  regionsCompleted = 0;

  // highlights
  toughestOpponent: LeaderEntry | null = null;
  easiestOpponent: LeaderEntry | null = null;
  nemesis: LeaderEntry | null = null;

  // pokemon tab
  topPokemon: TopPokemon[] = [];
  totalShiniesInHof = 0;
  shinyPercentage = 0;
  totalPokemonInHof = 0;
  pokedex: { pokemonId: number; name: string }[] = [];
  shinyDex: { pokemonId: number; name: string }[] = [];

  // records tab
  achievements: Achievement[] = [];
  achievementsUnlocked = 0;

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    const stats = this.statsService.getStats();

    // leaders list
    this.leadersList = Object.entries(stats.leaders).map(([name, data]) => ({
      name,
      wins: data.wins,
      losses: data.losses,
      winrate: this.statsService.getLeaderWinrate(name),
      type: data.type
    })).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));

    this.filteredLeaders = [...this.leadersList];
    this.applySort();

    // totals
    this.totalBattles = this.leadersList.reduce((s, l) => s + l.wins + l.losses, 0);
    this.totalWins = this.leadersList.reduce((s, l) => s + l.wins, 0);
    this.totalLosses = this.totalBattles - this.totalWins;
    this.overallWinRate = this.totalBattles > 0 ? Math.round((this.totalWins / this.totalBattles) * 100) : 0;

    // hall of fame
    this.hallOfFame = [...stats.hallOfFame].reverse();
    this.grandChampionCount = stats.hallOfFame.filter(e => e.grandChampion).length;

    // counters
    this.legendariesCaught = stats.legendariesCaught || 0;
    this.endlessWins = stats.endlessWins || 0;
    this.regionsCompleted = stats.regionsCompleted || 0;

    // highlights
    const eligible = this.leadersList.filter(l => (l.wins + l.losses) >= 2);
    if (eligible.length > 0) {
      this.toughestOpponent = eligible.reduce((min, l) => l.winrate < min.winrate ? l : min);
      this.easiestOpponent = eligible.reduce((max, l) => l.winrate > max.winrate ? l : max);
    }
    if (this.leadersList.length > 0) {
      this.nemesis = this.leadersList.reduce((max, l) => l.losses > max.losses ? l : max);
      if (this.nemesis && this.nemesis.losses === 0) this.nemesis = null;
    }

    // pokemon usage from HoF
    const pokemonUsage = new Map<number, { name: string; count: number; shinyCount: number }>();
    let totalPokemon = 0;
    let totalShinies = 0;
    for (const entry of stats.hallOfFame) {
      for (const p of entry.team) {
        totalPokemon++;
        if (p.shiny) totalShinies++;
        const existing = pokemonUsage.get(p.pokemonId);
        if (existing) {
          existing.count++;
          if (p.shiny) existing.shinyCount++;
        } else {
          pokemonUsage.set(p.pokemonId, { name: p.name, count: 1, shinyCount: p.shiny ? 1 : 0 });
        }
      }
    }
    this.uniquePokemonCount = pokemonUsage.size;
    this.totalPokemonInHof = totalPokemon;
    this.totalShiniesInHof = totalShinies;
    this.shinyPercentage = totalPokemon > 0 ? Math.round((totalShinies / totalPokemon) * 100) : 0;

    this.topPokemon = [...pokemonUsage.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({ pokemonId: id, ...data }));

    this.pokedex = [...pokemonUsage.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([id, data]) => ({ pokemonId: id, name: data.name }));

    this.shinyDex = [...pokemonUsage.entries()]
      .filter(([_, data]) => data.shinyCount > 0)
      .sort((a, b) => a[0] - b[0])
      .map(([id, data]) => ({ pokemonId: id, name: data.name }));

    // trainer rank
    this.trainerRank = this.getTrainerRank(this.totalWins);

    // achievements
    const uniqueRegions = new Set(stats.hallOfFame.map(e => e.generation));
    this.achievements = [
      { label: 'First Victory', done: stats.hallOfFame.length > 0, icon: '🏅' },
      { label: 'All 9 Regions', done: uniqueRegions.size >= 9, icon: '🗺️' },
      { label: 'Grand Champion', done: stats.hallOfFame.some(e => e.grandChampion), icon: '👑' },
      { label: 'Legendary Hunter (10+)', done: this.legendariesCaught >= 10, icon: '✨' },
      { label: 'Shiny Team (3+ shinies)', done: stats.hallOfFame.some(e => e.team.filter(p => p.shiny).length >= 3), icon: '💎' },
      { label: '100 Battles', done: this.totalBattles >= 100, icon: '⚔️' },
      { label: '90% Win Rate (20+ battles)', done: this.overallWinRate >= 90 && this.totalBattles >= 20, icon: '🎯' },
      { label: 'Endless Mode x5', done: this.endlessWins >= 5, icon: '♾️' },
    ];
    this.achievementsUnlocked = this.achievements.filter(a => a.done).length;
  }

  filterBattles(type: string): void {
    this.battleFilter = type;
    this.filteredLeaders = type === 'all'
      ? [...this.leadersList]
      : this.leadersList.filter(l => l.type === type);
    this.applySort();
  }

  sortBy(column: 'name' | 'wins' | 'losses' | 'winrate'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = column === 'name' ? 'asc' : 'desc';
    }
    this.applySort();
  }

  private applySort(): void {
    this.filteredLeaders.sort((a, b) => {
      let cmp: number;
      if (this.sortColumn === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = (a[this.sortColumn] as number) - (b[this.sortColumn] as number);
      }
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });
  }

  getShinyCount(entry: HallOfFameEntry): number {
    return entry.team.filter(p => p.shiny).length;
  }

  winRateColor(rate: number): string {
    if (rate >= 70) return 'bg-success';
    if (rate >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  private getTrainerRank(totalWins: number): { title: string; emoji: string } {
    if (totalWins >= 500) return { title: 'Grand Champion', emoji: '👑' };
    if (totalWins >= 200) return { title: 'Champion', emoji: '🏆' };
    if (totalWins >= 100) return { title: 'Elite Trainer', emoji: '⭐' };
    if (totalWins >= 50) return { title: 'Ace Trainer', emoji: '🎖️' };
    if (totalWins >= 25) return { title: 'Pokefan', emoji: '❤️' };
    if (totalWins >= 10) return { title: 'Bug Catcher', emoji: '🐛' };
    return { title: 'Youngster', emoji: '👦' };
  }
}
