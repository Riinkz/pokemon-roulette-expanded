import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MainGameButtonComponent } from '../main-game-button/main-game-button.component';
import { StatsService, HallOfFameEntry } from '../services/stats-service/stats';

@Component({
  selector: 'app-stats',
  imports: [CommonModule, MainGameButtonComponent, TranslatePipe],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
})
export class Stats implements OnInit {

  activeTab: 'battles' | 'hallOfFame' = 'battles';
  leadersList: { name: string; wins: number; losses: number; winrate: number; type: string }[] = [];
  hallOfFame: HallOfFameEntry[] = [];

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    const stats = this.statsService.getStats();

    this.leadersList = Object.entries(stats.leaders).map(([name, data]) => ({
      name,
      wins: data.wins,
      losses: data.losses,
      winrate: this.statsService.getLeaderWinrate(name),
      type: data.type
    })).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));

    this.hallOfFame = [...stats.hallOfFame].reverse();
  }
}
