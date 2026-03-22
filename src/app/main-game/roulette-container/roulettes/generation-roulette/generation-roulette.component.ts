import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { WheelComponent } from '../../../../wheel/wheel.component';
import { GenerationService } from '../../../../services/generation-service/generation.service';
import { GenerationItem } from '../../../../interfaces/generation-item';
import { GameStateService } from '../../../../services/game-state-service/game-state.service';
import { DarkModeService } from '../../../../services/dark-mode-service/dark-mode.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-generation-roulette',
  imports: [
    CommonModule,
    WheelComponent,
    TranslatePipe
  ],
  templateUrl: './generation-roulette.component.html',
  styleUrl: './generation-roulette.component.css'
})
export class GenerationRouletteComponent {

  constructor(private generationService: GenerationService,
              private gameStateService: GameStateService,
              private darkModeService: DarkModeService) {
    const completed = this.gameStateService.getCompletedRegionIds();
    const available = this.generationService.getGenerationList()
      .filter(g => !completed.includes(g.id));
    this.generations = available.length > 0 ? available : this.generationService.getGenerationList();
    this.darkMode = this.darkModeService.darkMode$;
  }

  generations: GenerationItem[];
  darkMode!: Observable<boolean>;
  selectedGeneration: GenerationItem | null = null;
  showChoiceButtons = true;
  @Output() generationSelectedEvent = new EventEmitter<GenerationItem>();

  onItemSelected(index: number): void {
    this.selectedGeneration = this.generations[index];
    this.generationService.setGenerationById(this.generations[index].id);
    this.generationSelectedEvent.emit();
  }

  toggleChoiceView(): void {
    this.showChoiceButtons = !this.showChoiceButtons;
  }

  onGenerationChosen(index: number): void {
    this.selectedGeneration = this.generations[index];
    this.generationService.setGenerationById(this.generations[index].id);
    this.generationSelectedEvent.emit();
  }
}
