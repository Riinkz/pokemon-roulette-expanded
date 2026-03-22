import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';

export interface GameSettings {
  muteAudio: boolean;
  skipShinyRolls: boolean;
  lessExplanations: boolean;
  devMode: boolean;
  fastSpins: boolean;
  showChances: boolean;
  showEventLog: boolean;
  showPower: boolean;
  showSort: boolean;
  alwaysWin: boolean;
  audioVolume: number;
  theme: string;
  gender: string;
}

@Injectable({
  providedIn: 'root'
})

export class SettingsService {
  private readonly STORAGE_KEY = 'pokemon-roulette-settings';
  private readonly defaultSettings: GameSettings = {
    muteAudio: false,
    skipShinyRolls: false,
    lessExplanations: false,
    devMode: false,
    fastSpins: false,
    showChances: false,
    showEventLog: false,
    showPower: false,
    showSort: false,
    alwaysWin: false,
    audioVolume: 100,
    theme: 'default',
    gender: ''
  };

  private settingsSubject$: BehaviorSubject<GameSettings>;
  private renderer: Renderer2;
  private readonly themeClasses = ['theme-gameboy', 'theme-rocket'];

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.settingsSubject$ = new BehaviorSubject(this.getInitialSettings());
    this.applyTheme(this.currentSettings.theme);
  }

  get settings$(): Observable<GameSettings> {
    return this.settingsSubject$.asObservable().pipe(distinctUntilChanged());
  }

  get currentSettings(): GameSettings {
    return this.settingsSubject$.getValue();
  }

  toggleMuteAudio(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, muteAudio: !currentSettings.muteAudio };
    this.updateSettings(newSettings);
  }

  toggleSkipShinyRolls(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, skipShinyRolls: !currentSettings.skipShinyRolls };
    this.updateSettings(newSettings);
  }

  toggleLessExplanations(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, lessExplanations: !currentSettings.lessExplanations };
    this.updateSettings(newSettings);
  }

  toggleDevMode(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, devMode: !currentSettings.devMode };
    this.updateSettings(newSettings);
  }

  toggleFastSpins(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, fastSpins: !currentSettings.fastSpins };
    this.updateSettings(newSettings);
  }

  toggleShowChances(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, showChances: !currentSettings.showChances };
    this.updateSettings(newSettings);
  }

  toggleShowEventLog(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, showEventLog: !currentSettings.showEventLog };
    this.updateSettings(newSettings);
  }

  toggleShowPower(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, showPower: !currentSettings.showPower };
    this.updateSettings(newSettings);
  }

  toggleShowSort(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, showSort: !currentSettings.showSort };
    this.updateSettings(newSettings);
  }

  toggleAlwaysWin(): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, alwaysWin: !currentSettings.alwaysWin };
    this.updateSettings(newSettings);
  }

  setTheme(theme: string): void {
    this.applyTheme(theme);
    this.updateSettings({ ...this.currentSettings, theme });
  }

  private applyTheme(theme: string): void {
    const body = document.body;
    this.themeClasses.forEach(cls => this.renderer.removeClass(body, cls));
    if (theme !== 'default') {
      this.renderer.addClass(body, `theme-${theme}`);
    }
  }

  setGender(gender: string): void {
    this.updateSettings({ ...this.currentSettings, gender });
  }

  setAudioVolume(volume: number): void {
    const currentSettings = this.currentSettings;
    const newSettings = { ...currentSettings, audioVolume: volume, muteAudio: volume === 0 };
    this.updateSettings(newSettings);
  }

  resetSettings(): void {
    this.updateSettings(this.defaultSettings);
  }

  private updateSettings(newSettings: GameSettings): void {
    this.saveSettingsToStorage(newSettings);
    this.settingsSubject$.next(newSettings);
  }

  private getInitialSettings(): GameSettings {
    const settingsFromStorage = this.getSettingsFromStorage();
    return { ...this.defaultSettings, ...settingsFromStorage };
  }

  private saveSettingsToStorage(settings: GameSettings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }

  private getSettingsFromStorage(): Partial<GameSettings> | null {
    const storageItem = localStorage.getItem(this.STORAGE_KEY);

    if (storageItem) {
      try {
        return JSON.parse(storageItem);
      } catch (error) {
        console.error(
          'Invalid settings localStorage item:',
          storageItem,
          'falling back to default settings'
        );
      }
    }

    return null;
  }
}
