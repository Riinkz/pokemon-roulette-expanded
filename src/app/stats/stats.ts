import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainGameButtonComponent } from '../main-game-button/main-game-button.component';
import { StatsService, PokemonBattleStats } from '../services/stats-service/stats';

@Component({
  selector: 'app-stats',
  imports: [CommonModule, MainGameButtonComponent],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
})
export class Stats implements OnInit {

  statsList: { pokemonId: number; name: string; wins: number; losses: number; winrate: number }[] = [];

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    const raw = this.statsService.getStats();
    this.statsList = Object.entries(raw).map(([id, data]) => ({
      pokemonId: Number(id),
      name: data.name,
      wins: data.wins,
      losses: data.losses,
      winrate: this.statsService.getWinrate(Number(id))
    })).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
  }
}
