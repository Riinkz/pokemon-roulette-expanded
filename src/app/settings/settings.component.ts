import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { LanguageSelectorComponent } from "../main-game/language-selector/language-selector.component";
import { TranslatePipe } from '@ngx-translate/core';
import { MainGameButtonComponent } from "../main-game-button/main-game-button.component";
import { DarkModeToggleComponent } from './dark-mode-toggle/dark-mode-toggle.component';
import { NgIconsModule } from '@ng-icons/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { SettingsService, GameSettings } from '../services/settings-service/settings.service';

@Component({
  selector: 'app-settings',
  imports: [
    DarkModeToggleComponent,
    LanguageSelectorComponent,
    TranslatePipe,
    MainGameButtonComponent,
    NgIconsModule,
    CommonModule
],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {

  settings$!: Observable<GameSettings>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  devMode = false;
  private gearClicks = 0;
  private gearClickTimer: any;

  constructor(private settingsService: SettingsService, private router: Router) {}

  ngOnInit(): void {
    this.settings$ = this.settingsService.settings$;
    this.devMode = this.settingsService.currentSettings.devMode;
  }

  onHeaderClick(): void {
    this.gearClicks++;
    clearTimeout(this.gearClickTimer);
    this.gearClickTimer = setTimeout(() => this.gearClicks = 0, 2000);
    if (this.gearClicks >= 5) {
      this.gearClicks = 0;
      this.settingsService.toggleDevMode();
      this.devMode = this.settingsService.currentSettings.devMode;
    }
  }

  onToggleVerbosity(): void {
    this.settingsService.toggleLessExplanations();
  }

  onToggleMuteAudio(): void {
    this.settingsService.toggleMuteAudio();
  }

  onToggleSkipShinyRolls(): void {
    this.settingsService.toggleSkipShinyRolls();
  }

  goToStats(): void {
    this.router.navigate(['/stats']);
  }

  exportSave(): void {
    const saveData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pokemon-roulette')) {
        saveData[key] = localStorage.getItem(key)!;
      }
    }
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pokemon-roulette-save.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  importSave(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const saveData = JSON.parse(reader.result as string);
        for (const [key, value] of Object.entries(saveData)) {
          if (key.startsWith('pokemon-roulette')) {
            localStorage.setItem(key, value as string);
          }
        }
        window.location.reload();
      } catch (e) {
        console.error('Invalid save file:', e);
        alert('Invalid save file.');
      }
    };
    reader.readAsText(file);
  }

}
