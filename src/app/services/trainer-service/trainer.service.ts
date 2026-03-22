import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { trainerSpriteData } from './trainer-sprite-data';
import { PokemonItem } from '../../interfaces/pokemon-item';
import { PokemonService } from '../pokemon-service/pokemon.service';
import { EvolutionService } from '../evolution-service/evolution.service';
import { ItemItem } from '../../interfaces/item-item';
import { ItemSpriteService } from '../item-sprite-service/item-sprite.service';
import { ItemName } from '../items-service/item-names';
import { Badge } from '../../interfaces/badge';
import { BadgesService } from '../badges-service/badges.service';
import { GenerationService } from '../generation-service/generation.service';
import { GameState } from '../game-state-service/game-state';
import { GameStateService } from '../game-state-service/game-state.service';
import { palafinForms } from './palafin-forms';
import { stickyBattleForms } from './sticky-battle-forms';

@Injectable({
  providedIn: 'root'
})
export class TrainerService {

  private readonly STORAGE_KEY = 'pokemon-roulette-save';
  private readonly gameStateSubscription: Subscription;

  constructor(private badgesService: BadgesService,
    private evolutionService: EvolutionService,
    private generationService: GenerationService,
    private itemSpriteService: ItemSpriteService,
    private pokemonService: PokemonService,
    private gameStateService: GameStateService) {
    this.loadState();
    this.gameStateSubscription = this.gameStateService.currentState.subscribe((gameState) => {
      this.syncBattleForms(gameState);
    });
  }

  trainerSpriteData = trainerSpriteData;

  private trainer = new BehaviorSubject<{ sprite: string }>({ sprite: './place-holder-pixel.png' });
  gender: string = 'male';

  trainerTeam: PokemonItem[] = [];

  storedPokemon: PokemonItem[] = [];

  private trainerTeamObservable = new BehaviorSubject<PokemonItem[]>(this.trainerTeam);
  private lastAddedPokemon: PokemonItem | null = null;
  private readonly battleStates = new Set<GameState>(['gym-battle', 'elite-four-battle', 'champion-battle']);
  private readonly temporaryBattleForms = palafinForms;
  private readonly stickyBattleFormGroups = stickyBattleForms;

  trainerItems: ItemItem[] = [
    {
      text: 'items.potion.name',
      name: 'potion',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
      fillStyle: 'purple',
      weight: 1,
      description: 'items.potion.description'
    }
  ];
  private trainerItemsObservable = new BehaviorSubject<ItemItem[]>(this.trainerItems);

  trainerBadges: Badge[] = [];

  private trainerBadgesObservable = new BehaviorSubject<Badge[]>(this.trainerBadges);

  ngOnDestroy(): void {
    this.gameStateSubscription.unsubscribe();
  }

  getTrainer(): Observable<{ sprite: string }> {
    return this.trainer.asObservable();
  }

  getTrainerSprite(generation: number, gender: string): string {
    return this.trainerSpriteData[generation][gender];
  }

  setTrainer(generation: number, gender: string) {
    this.gender = gender;
    this.trainer.next({ sprite: this.getTrainerSprite(generation, gender) });
    this.saveState();
  }

  addToTeam(pokemon: PokemonItem): void {

    pokemon = structuredClone(pokemon);
    this.loadPokemonSpriteIfMissing(pokemon);

    if(this.trainerTeam.length < 6) {
      this.trainerTeam.push(pokemon);
    } else {
      this.storedPokemon.push(pokemon);
    }

    this.lastAddedPokemon = pokemon;
    this.trainerTeamObservable.next(this.getTeam());
    this.saveState();
  }

  removeFromTeam(pokemon: PokemonItem): void {
    let index = this.trainerTeam.indexOf(pokemon);

    if (index !== -1) {
      this.trainerTeam.splice(index, 1);
    } else {
      index = this.storedPokemon.indexOf(pokemon);
      if(index !== -1) {
        this.storedPokemon.splice(index, 1);
      }
    }

    this.trainerTeamObservable.next(this.getTeam());
    this.saveState();
  }

  getTeam(): PokemonItem[] {
    return this.trainerTeam;
  }

  updateTeam(): void {
    this.trainerTeamObservable.next(this.trainerTeam);
  }

  getStored(): PokemonItem[] {
    return this.storedPokemon;
  }

  getTeamObservable(): Observable<PokemonItem[]> {
    return this.trainerTeamObservable.asObservable();
  }

  makeShiny(): void {
    const lastAddedIndex = this.trainerTeam.findIndex(pokemon => pokemon === this.lastAddedPokemon);
    if (lastAddedIndex !== -1) {
      this.trainerTeam[lastAddedIndex].shiny = true;
    } else {
      const storedIndex = this.storedPokemon.findIndex(pokemon => pokemon === this.lastAddedPokemon);
      if (storedIndex !== -1) {
        this.storedPokemon[storedIndex].shiny = true;
      }
    }
    this.trainerTeamObservable.next(this.getTeam());
    this.saveState();
  }

  getPokemonThatCanEvolve(): PokemonItem[] {
    const auxPokemonList: PokemonItem[] = [];
    this.trainerTeam.forEach(pokemon => {
      if (this.evolutionService.canEvolve(pokemon)) {
        auxPokemonList.push(pokemon);
      }
    });
    return auxPokemonList;
  }

  private syncBattleForms(gameState: GameState): void {
    if (this.battleStates.has(gameState)) {
      this.applyBattleForms();
      return;
    }

    this.revertBattleForms();
  }

  replaceForEvolution(pokemonOut: PokemonItem, pokemonIn: PokemonItem): void {
    pokemonIn.shiny = pokemonOut.shiny;
    pokemonIn = pokemonIn;
    this.loadPokemonSpriteIfMissing(pokemonIn);

    let index = this.trainerTeam.indexOf(pokemonOut);

    if (index > -1) {
      this.trainerTeam.splice(index, 1, pokemonIn);
    } else {
      index = this.storedPokemon.indexOf(pokemonOut);
      if (index > -1) {
        this.storedPokemon.splice(index, 1, pokemonIn);
      }
    }

    this.trainerTeamObservable.next(this.getTeam());
    this.saveState();
  }

  performTrade(pokemonOut: PokemonItem, pokemonIn: PokemonItem): void {
    this.loadPokemonSpriteIfMissing(pokemonIn);

    let index = this.trainerTeam.indexOf(pokemonOut);
    if (index > -1) {
      this.trainerTeam.splice(index, 1, pokemonIn);
    } else {
      index = this.storedPokemon.indexOf(pokemonOut);
      if (index > -1) {
        this.storedPokemon.splice(index, 1, pokemonIn);
      }
    }
    this.trainerTeamObservable.next(this.getTeam());
    this.saveState();
  }

  getItems(): ItemItem[] {
    return this.trainerItems;
  }

  getItemsObservable(): Observable<ItemItem[]> {
    return this.trainerItemsObservable.asObservable();
  }

  hasItem(itemName: ItemName): boolean {
    return this.trainerItems.some(item => item.name === itemName);
  }

  getItem(itemName: ItemName): ItemItem | undefined {
    return this.trainerItems.find(item => item.name === itemName);
  }

  addToItems(item: ItemItem): void {

    item = structuredClone(item);

    if (!item.sprite) {
      this.itemSpriteService.getItemSprite(item.name).subscribe(response => {
        item.sprite = response.sprite;
        this.saveState();
      });
    }
    this.trainerItems.push(item);
    this.trainerItemsObservable.next(this.trainerItems);
    this.saveState();
  }

  removeItem(item: ItemItem): void {
    const index = this.trainerItems.indexOf(item);
    if (index !== -1) {
      this.trainerItems.splice(index, 1);
    }
    this.trainerItemsObservable.next(this.trainerItems);
    this.saveState();
  }

  getBadgesObservable(): Observable<Badge[]> {
    return this.trainerBadgesObservable.asObservable();
  }

  addBadge(fromRound: number, fromLeader: number = 0): void {
    this.badgesService.getBadge(this.generationService.getCurrentGeneration(), fromRound, fromLeader).subscribe(badge => {
      this.trainerBadges.push(badge);
      this.trainerBadgesObservable.next(this.trainerBadges);
      this.saveState();
    })
  }

  maxPowerTeam(): void {
    const all = [...this.trainerTeam, ...this.storedPokemon].sort((a, b) => b.power - a.power);
    this.trainerTeam = all.slice(0, 6);
    this.storedPokemon = all.slice(6);
    this.trainerTeamObservable.next(this.trainerTeam);
    this.saveState();
  }

  sortTeam(mode: 'power' | 'newest'): void {
    if (mode === 'power') {
      this.trainerTeam.sort((a, b) => b.power - a.power);
    } else {
      // newest = reverse to put latest additions first
      this.trainerTeam.reverse();
    }
    this.trainerTeamObservable.next(this.trainerTeam);
    this.saveState();
  }

  resetTrainer() {
    this.trainer.next({ sprite: './place-holder-pixel.png' });
    this.clearSave();
  }

  resetTeam() {
    this.trainerTeam = [];
    this.storedPokemon = [];
    this.trainerTeamObservable.next(this.trainerTeam);
    this.saveState();
  }

  clearStorage(): void {
    this.storedPokemon = [];
    this.saveState();
  }

  resetItems() {
    this.trainerItems = [
      {
        text: 'items.potion.name',
        name: 'potion',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
        fillStyle: 'purple',
        weight: 1,
        description: 'items.potion.description'
      }
    ];
    this.trainerItemsObservable.next(this.trainerItems);
    this.saveState();
  }

  resetBadges() {
    this.trainerBadges = [];
    this.trainerBadgesObservable.next(this.trainerBadges);
    this.saveState();
  }

  saveState(): void {
    const state = {
      gender: this.gender,
      trainerSprite: this.trainer.getValue().sprite,
      trainerTeam: this.trainerTeam,
      storedPokemon: this.storedPokemon,
      trainerItems: this.trainerItems,
      trainerBadges: this.trainerBadges
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save trainer state:', e);
    }
  }

  private loadState(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      if (state.gender) this.gender = state.gender;
      if (state.trainerSprite) this.trainer.next({ sprite: state.trainerSprite });
      if (state.trainerTeam?.length) {
        this.trainerTeam = state.trainerTeam;
        this.trainerTeamObservable.next(this.trainerTeam);
      }
      if (state.storedPokemon?.length) this.storedPokemon = state.storedPokemon;
      if (state.trainerItems?.length) {
        this.trainerItems = state.trainerItems;
        this.trainerItemsObservable.next(this.trainerItems);
      }
      if (state.trainerBadges?.length) {
        this.trainerBadges = state.trainerBadges;
        this.trainerBadgesObservable.next(this.trainerBadges);
      }

      // re-fetch missing sprites (race condition: F5 before async fetch completed)
      [...this.trainerTeam, ...this.storedPokemon].forEach(pokemon => {
        if (!pokemon.sprite) {
          this.pokemonService.getPokemonSprites(pokemon.pokemonId).subscribe(response => {
            pokemon.sprite = response.sprite;
            this.trainerTeamObservable.next(this.trainerTeam);
            this.saveState();
          });
        }
      });

      this.trainerItems.forEach(item => {
        if (!item.sprite) {
          this.itemSpriteService.getItemSprite(item.name).subscribe(response => {
            item.sprite = response.sprite;
            this.saveState();
          });
        }
      });

    } catch (e) {
      console.error('Failed to load trainer state:', e);
    }
  }

  clearSave(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Applies all battle-entry transforms in one pass with a single emit.
  // Temporary forms apply to team+stored; sticky forms apply to team only.
  private applyBattleForms(): void {
    let changed = false;
    changed = this.replaceTemporaryForms(this.trainerTeam, true) || changed;
    changed = this.replaceTemporaryForms(this.storedPokemon, true) || changed;
    changed = this.applyStickyFormsToCollection(this.trainerTeam) || changed;

    if (changed) {
      this.trainerTeamObservable.next(this.getTeam());
    }
  }

  // Reverts temporary forms only. Sticky forms intentionally persist after battle.
  private revertBattleForms(): void {
    let changed = false;
    changed = this.replaceTemporaryForms(this.trainerTeam, false) || changed;
    changed = this.replaceTemporaryForms(this.storedPokemon, false) || changed;

    if (changed) {
      this.trainerTeamObservable.next(this.getTeam());
    }
  }

  private applyStickyFormsToCollection(collection: PokemonItem[]): boolean {
    let replaced = false;

    this.stickyBattleFormGroups.forEach(group => {
      const formIds = new Set(group.forms.map(f => f.pokemonId));

      collection.forEach((pokemon, index) => {
        if (!formIds.has(pokemon.pokemonId)) {
          return;
        }

        const currentFormIndex = group.forms.findIndex(f => f.pokemonId === pokemon.pokemonId);
        let targetForm: PokemonItem;

        if (group.mode === 'toggle') {
          targetForm = group.forms[(currentFormIndex + 1) % group.forms.length];
        } else {
          const otherForms = group.forms.filter(f => f.pokemonId !== pokemon.pokemonId);
          targetForm = otherForms[Math.floor(Math.random() * otherForms.length)];
        }

        const replacement = structuredClone(targetForm);
        replacement.shiny = pokemon.shiny;
        replacement.sprite = null;
        this.loadPokemonSpriteIfMissing(replacement);
        collection[index] = replacement;
        replaced = true;
      });
    });

    return replaced;
  }

  private loadPokemonSpriteIfMissing(pokemon: PokemonItem): void {
    if (!pokemon.sprite) {
      this.pokemonService.getPokemonSprites(pokemon.pokemonId).subscribe(response => {
        pokemon.sprite = response.sprite;
      });
    }
  }

  private replaceTemporaryForms(collection: PokemonItem[], transformToBattleForm: boolean): boolean {
    let replaced = false;

    Object.values(this.temporaryBattleForms).forEach(forms => {
      if (forms.length < 2) {
        return;
      }

      const baseForm = forms[0];
      const battleForm = forms[1];
      const sourceId = transformToBattleForm ? baseForm.pokemonId : battleForm.pokemonId;
      const targetForm = transformToBattleForm ? battleForm : baseForm;

      collection.forEach((pokemon, index) => {
        if (pokemon.pokemonId !== sourceId) {
          return;
        }

        const replacement = structuredClone(targetForm);
        replacement.shiny = pokemon.shiny;
        replacement.sprite = null;
        this.loadPokemonSpriteIfMissing(replacement);
        collection[index] = replacement;
        replaced = true;
      });
    });

    return replaced;
  }
}

