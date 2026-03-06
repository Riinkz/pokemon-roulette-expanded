import { Component, HostListener, OnInit } from '@angular/core';
import { NgbCollapseModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TrainerTeamComponent } from "../trainer-team/trainer-team.component";
import { ItemsComponent } from "../items/items.component";
import { GameStateService } from '../services/game-state-service/game-state.service';
import { CommonModule } from '@angular/common';
import { ItemItem } from '../interfaces/item-item';
import { RestartGameButtonComponent } from "../restart-game-buttom/restart-game-buttom.component";
import { TrainerService } from '../services/trainer-service/trainer.service';
import { AnalyticsService } from '../services/analytics-service/analytics.service';
import { CoffeeButtonComponent } from "./coffee-button/coffee-button.component";
import { NgIconsModule } from '@ng-icons/core';
import { DarkModeService } from '../services/dark-mode-service/dark-mode.service';
import { Observable } from 'rxjs';
import { LanguageSelectorComponent } from './language-selector/language-selector.component';
import { RouletteContainerComponent } from './roulette-container/roulette-container.component';
import { SettingsButtonComponent } from '../settings-button/settings-button.component';
import { RareCandyService } from '../services/rare-candy-service/rare-candy.service';
import { GenerationService } from '../services/generation-service/generation.service';
import { SettingsService } from '../services/settings-service/settings.service';
import { EventLogService } from '../services/event-log-service/event-log.service';

@Component({
  selector: 'app-main-game',
  imports: [
    CommonModule,
    RouletteContainerComponent,
    SettingsButtonComponent,
    TrainerTeamComponent,
    ItemsComponent,
    RestartGameButtonComponent,
    CoffeeButtonComponent,
    NgIconsModule,
    NgbCollapseModule,
    LanguageSelectorComponent
  ],
  templateUrl: './main-game.component.html',
  styleUrl: './main-game.component.css'
})
export class MainGameComponent implements OnInit {

  constructor(
    private darkModeService: DarkModeService,
    private gameStateService: GameStateService,
    private generationService: GenerationService,
    private trainerService: TrainerService,
    private modalService: NgbModal,
    private analyticsService: AnalyticsService,
    private rareCandyService: RareCandyService,
    private settingsService: SettingsService,
    public eventLogService: EventLogService) {
      this.darkMode = this.darkModeService.darkMode$;
  }

  wheelSpinning: boolean = false;
  devMode = false;
  devMenuOpen = false;

  ngOnInit(): void {
    this.analyticsService.trackEvent('main-game-loaded', 'Main Game Loaded', 'user acess');

    this.gameStateService.wheelSpinningObserver.subscribe(state => {
      this.wheelSpinning = state;
    });

    this.settingsService.settings$.subscribe(s => this.devMode = s.devMode);
  }

  toggleDevMenu(): void {
    this.devMenuOpen = !this.devMenuOpen;
  }

  toggleFastSpins(): void {
    this.settingsService.toggleFastSpins();
  }

  toggleShowChances(): void {
    this.settingsService.toggleShowChances();
  }

  toggleShowEventLog(): void {
    this.settingsService.toggleShowEventLog();
  }

  toggleShowPower(): void {
    this.settingsService.toggleShowPower();
  }

  toggleShowSort(): void {
    this.settingsService.toggleShowSort();
  }

  onThemeChange(event: Event): void {
    const theme = (event.target as HTMLSelectElement).value;
    this.settingsService.setTheme(theme);
  }

  get settings() {
    return this.settingsService.currentSettings;
  }
  
  darkMode!: Observable<boolean>;
  mapIsCollapsed: boolean = true;

  resetGameAction(): void {
    this.resetGame();
    this.modalService.dismissAll();
  }

  rareCandyInterrupt(rareCandy: ItemItem): void {
    if(this.wheelSpinning){
      return;
    }

    this.rareCandyService.triggerRareCandyEvolution(rareCandy);
  }

  private rPressCount = 0;
  private rPressTimer: any;

  @HostListener('window:keydown.r')
  handleRestartShortcut(): void {
    if (this.wheelSpinning) return;
    this.rPressCount++;
    clearTimeout(this.rPressTimer);
    this.rPressTimer = setTimeout(() => this.rPressCount = 0, 800);
    if (this.rPressCount >= 3) {
      this.rPressCount = 0;
      this.resetGameAction();
    }
  }

  resetGame(): void {
    this.trainerService.resetTrainer();
    this.trainerService.resetTeam();
    this.trainerService.resetItems();
    this.trainerService.resetBadges();
    this.gameStateService.resetGameState();
    this.generationService.clearSave();
  }
}
