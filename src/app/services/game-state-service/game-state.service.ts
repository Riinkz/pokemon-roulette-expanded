import { Injectable } from '@angular/core';
import { GameState } from './game-state';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {

  private readonly STORAGE_KEY = 'pokemon-roulette-game-state';

  private stateStack: GameState[] = [];
  private state = new BehaviorSubject<GameState>('game-start');
  currentState = this.state.asObservable();

  private currentRound = new BehaviorSubject<number>(0);
  currentRoundObserver = this.currentRound.asObservable();

  private regionsCompleted = new BehaviorSubject<number>(0);
  regionsCompletedObserver = this.regionsCompleted.asObservable();
  private completedRegionIds: number[] = [];

  private wheelSpinning = new BehaviorSubject<boolean>(false);
  wheelSpinningObserver = this.wheelSpinning.asObservable();

  constructor() {
    if (!this.loadState()) {
      this.initializeStates();
    }
  }

  private initializeStates(): void {
    this.stateStack = [
      'game-finish',
      'champion-battle',
      'elite-four-battle',
      'elite-four-battle',
      'elite-four-battle',
      'elite-four-battle',
      'elite-four-preparation',
      'gym-battle',
      'adventure-continues',
      'gym-battle',
      'adventure-continues',
      'gym-battle',
      'adventure-continues',
      'gym-battle',
      'adventure-continues',
      'gym-battle',
      'adventure-continues',
      'gym-battle',
      'adventure-continues',
      'gym-battle',
      'adventure-continues',
      'gym-battle',
      'start-adventure',
      'starter-pokemon',
      'character-select'
    ];
  }

  setNextState(newState: GameState): void {
    this.stateStack.push(newState);
    this.saveState();
  }

  finishCurrentState(): GameState {
    if (this.stateStack.length > 0) {
      const poppedState = this.stateStack.pop();
      if (poppedState) {
        this.state.next(poppedState);
        this.saveState();
        return poppedState;
      }
    }
    return 'game-over';
  }

  advanceRound(): void {
    this.currentRound.next(this.currentRound.value + 1);
    this.saveState();
  }

  retreatRound(): void {
    this.currentRound.next(this.currentRound.value - 1);
    this.saveState();
  }

  repeatCurrentState(): void {
    this.stateStack.push(this.state.value);
    this.saveState();
  }

  setWheelSpinning(state: boolean): void {
    this.wheelSpinning.next(state);
  }

  getCompletedRegionIds(): number[] {
    return this.completedRegionIds;
  }

  startNextRegion(completedGenId: number): void {
    this.completedRegionIds.push(completedGenId);
    this.regionsCompleted.next(this.regionsCompleted.value + 1);
    this.stateStack = [
      'game-finish',
      'champion-battle',
      'elite-four-battle', 'elite-four-battle', 'elite-four-battle', 'elite-four-battle',
      'elite-four-preparation',
      'gym-battle', 'adventure-continues',
      'gym-battle', 'adventure-continues',
      'gym-battle', 'adventure-continues',
      'gym-battle', 'adventure-continues',
      'gym-battle', 'adventure-continues',
      'gym-battle', 'adventure-continues',
      'gym-battle', 'adventure-continues',
      'gym-battle',
      'start-adventure'
    ];
    this.currentRound.next(0);
    this.state.next('game-start');
    this.saveState();
  }

  resetGameState(): void {
    this.clearSave();
    this.initializeStates();
    this.stateStack.push('game-start');
    const poppedState = this.stateStack.pop();
    if (poppedState) {
      this.state.next(poppedState);
    }
    this.currentRound.next(0);
    this.regionsCompleted.next(0);
    this.completedRegionIds = [];
  }

  private saveState(): void {
    try {
      const data = {
        stateStack: this.stateStack,
        currentState: this.state.value,
        currentRound: this.currentRound.value,
        regionsCompleted: this.regionsCompleted.value,
        completedRegionIds: this.completedRegionIds
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  }

  private loadState(): boolean {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (data.stateStack?.length) {
        this.stateStack = data.stateStack;
        this.state.next(data.currentState || 'game-start');
        this.currentRound.next(data.currentRound || 0);
        this.regionsCompleted.next(data.regionsCompleted || 0);
        this.completedRegionIds = data.completedRegionIds || [];
        return true;
      }
    } catch (e) {
      console.error('Failed to load game state:', e);
    }
    return false;
  }

  clearSave(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
