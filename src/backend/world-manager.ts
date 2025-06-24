import {
  World,
  InventorySlot,
  GameMap,
  Room,
  Point2d,
  ExitMappingEntry,
  LookDirection,
  EntitiesMap,
  UpgradeOption,
  Entity,
} from '../common/interfaces';
import {
  Event,
  InventorySelectEvent,
  PlayerAttackEvent,
  PurchaseUpgradeEvent,
} from '../common/events';
import { attackFromPlayer, movePlayer } from './player-controller';
import { generateRoom, getStartingRoom } from './map-generator';
import { Dictionary } from 'typescript-collections';
import { prngAlea } from 'ts-seedrandom';
import {
  PlayerCharacter,
  calculateExperienceForNextLevel,
  calculateExperienceFromKill,
  canLevelUp,
  levelUp,
  recalculatePlayerStats,
} from './behaviour/character';
import { health, FOV, speed } from './behaviour/character';
import { getBuffsClassMap } from './data/dataloader';
import { serializeWorld, deserializeWorld } from './serializer';

export class WorldManager {
  private world: World | null = null;
  private updateCallback: (world: World) => void;
  private npcMovementTimer: NodeJS.Timeout | null = null;

  constructor(updateCallback: (world: World) => void) {
    this.updateCallback = updateCallback;
  }

  private updateWorld(world: World) {
    this.world = world;
    this.updateCallback(world);
  }

  private startNPCMovementTimer() {
    if (this.npcMovementTimer) {
      clearInterval(this.npcMovementTimer);
    }

    this.npcMovementTimer = setInterval(() => {
      if (!this.world || this.world.player.character.healthBar <= 0) return;

      this.handleNPCMovement();
    }, 1000);
  }

  private stopNPCMovementTimer() {
    if (this.npcMovementTimer) {
      clearInterval(this.npcMovementTimer);
      this.npcMovementTimer = null;
    }
  }

  public exampleUpdate() {
    if (!this.world) return;
    const newWorld = { ...this.world };

    // Update newWorld

    this.updateWorld(newWorld);
  }

  private createEmptyInventory(): InventorySlot[] {
    return [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
      { id: 6 },
      { id: 7 },
      { id: 8 },
      { id: 9 },
      { id: 0, item: { id: 'test-item', name: 'Test Item' } },
    ];
  }

  public generateStubWorld() {
    const worldSeed = Math.trunc(Math.random() * 1000000);
    let worldRandom = prngAlea(worldSeed);
    const stubWorld: World = {
      map: this.generateStubMap(worldSeed),
      player: {
        id: 'player',
        x: 8,
        y: 8,
        character: new PlayerCharacter('Sanya', {
          s: 10,
          p: 10,
          e: 10,
          i: 10,
          a: 10,
        }),
        lookDir: LookDirection.Right,
        level: 1,
        experience: 0,
        experienceToNext: calculateExperienceForNextLevel(1),
        slots: this.createEmptyInventory(),
        activeSlot: 1,
        availableExperience: 10000,
        spentExperience: 0,
        upgradesBought: {},
        animation: {
          lastAttacked: 0,
          lastMoved: 0,
        },
      },
      random: worldRandom,
      onEntityDeath: (deadEntity: Entity, attacker: Entity) => {
        if (this.world) {
          this.handleEnemyKilled(this.world, { enemyLevel: deadEntity.level });
        }
      },
      availableUpgrades: [],
      isPlayerDead: false,
    };

    stubWorld.availableUpgrades = this.calculateAvailableUpgrades(stubWorld);

    this.updateWorld(stubWorld);
    this.startNPCMovementTimer();
  }

  private generateStubMap(seed: number): GameMap {
    let defaultExitMapping: Dictionary<ExitMappingEntry, ExitMappingEntry> =
      new Dictionary(JSON.stringify);
    const stubMap: GameMap = {
      rooms: [getStartingRoom()],
      currentRoom: 0,
      exitMapping: defaultExitMapping,
    };
    return stubMap;
  }

  private countUnlinkedExits(): number {
    const totalExits = this.world?.map.rooms
      .map((r) => r.exits.size())
      .reduce((sum, cur) => sum + cur, 0);
    const linkedExits = this.world?.map.exitMapping.size()!;
    return totalExits! - linkedExits;
  }

  public processTransition(curWorld: World): World {
    const pos: Point2d = { x: curWorld.player.x, y: curWorld.player.y };
    let gameMap = curWorld.map;
    const currentRoomId: number = gameMap!.currentRoom;
    if (gameMap.rooms[currentRoomId].map[pos.y][pos.x] != 'door') {
      return curWorld;
    }
    const exitId = gameMap.rooms[currentRoomId].exits.getValue(pos);
    if (!exitId && exitId != 0) {
      console.log('failed to perform transition, no mapping for exit', pos);
      console.log(gameMap.rooms[currentRoomId].exits);
      return curWorld;
    }
    const currentEntry: ExitMappingEntry = {
      roomId: currentRoomId,
      exitId: exitId,
    };
    let nextRoomEntry = gameMap.exitMapping.getValue(currentEntry);
    if (!nextRoomEntry) {
      const roomSeed = Math.round(1000000 * curWorld.random());
      const unlinkedExits = this.countUnlinkedExits();
      const newRoom = generateRoom(
        roomSeed,
        curWorld.player.level,
        unlinkedExits < 2
      );
      const newRoomId = gameMap.rooms.length;
      gameMap.rooms.push(newRoom);
      nextRoomEntry = { roomId: newRoomId, exitId: 0 };
      gameMap.exitMapping.setValue(currentEntry, nextRoomEntry);
      gameMap.exitMapping.setValue(nextRoomEntry, currentEntry);
    }
    const newPosition = gameMap.rooms[
      nextRoomEntry.roomId
    ].reverseExits.getValue(nextRoomEntry.exitId);
    if (!newPosition) {
      console.log(
        'failed to perform transition, no reverse mapping for exit',
        nextRoomEntry.exitId
      );
      return curWorld;
    }
    return {
      ...this.world!,
      map: { ...gameMap, currentRoom: nextRoomEntry.roomId },
      player: { ...curWorld.player, x: newPosition.x, y: newPosition.y },
    };
  }

  public handleEvent(event: Event) {
    if (!this.world) return;

    switch (event.type) {
      case 'player_move':
        const playerMovedWorld = movePlayer(this.world, event.direction);
        const transitionHandledWorld = this.processTransition(playerMovedWorld);
        this.updateWorld(transitionHandledWorld);
        return;
      case 'player_attack':
        this.handleAttack(event);
        break;
      case 'inventory_select':
        this.handleInventorySelect(event);
        break;
      case 'purchase_upgrade':
        this.handlePurchaseUpgrade(event);
        break;
    }
  }

  private handleInventorySelect(event: InventorySelectEvent) {
    if (!this.world) return;

    const newWorld = {
      ...this.world,
      player: {
        ...this.world.player,
        activeSlot: event.slotId,
      },
    };

    this.updateWorld(newWorld);
  }

  private handleAttack = (event: PlayerAttackEvent) => {
    if (!this.world) return;

    const newWorld = {
      ...this.world,
      onEntityDeath: (deadEntity: Entity, attacker: Entity) =>
        this.handleEnemyKilled(newWorld, { enemyLevel: deadEntity.level }),
    };

    attackFromPlayer(newWorld, event.weaponChosen);

    const newWorldObject = {
      ...newWorld,
      isPlayerDead: newWorld.player.character.healthBar <= 0,
    };

    this.updateWorld(newWorldObject);
  };

  private handleEnemyKilled(world: World, event: { enemyLevel: number }) {
    const expGained = calculateExperienceFromKill(
      world.player.character,
      event.enemyLevel,
      world.player.upgradesBought
    );
    world.player.experience += expGained;
    world.player.availableExperience += expGained;

    let leveledUp = false;
    while (canLevelUp(world.player.experience, world.player.experienceToNext)) {
      const levelUpResult = levelUp(world.player);
      world.player.level = levelUpResult.level;
      world.player.experience = levelUpResult.experience;
      world.player.experienceToNext = levelUpResult.experienceToNext;
      leveledUp = true;

      world.player.character.maxHealthBar = health(
        world.player.character,
        world.player.upgradesBought
      );
      world.player.character.healthBar = world.player.character.maxHealthBar;
    }

    if (leveledUp) {
      world.availableUpgrades = this.calculateAvailableUpgrades(world);
    }
  }

  public handleNPCMovement() {
    if (!this.world) return;

    //update player
    if (this.world.player && !this.world.isPlayerDead) {
      this.world.player.character.update(this.world.player, this.world);
    }

    const room = this.world.map?.rooms[this.world.map.currentRoom];
    if (!room) return;

    //update entities
    room.entities.forEach((entity) => {
      if (entity.character.healthBar > 0 && this.world) {
        entity.character.update(entity, this.world);
        //console.log('---', entity.id);
        //console.log(
        //  entity.character.baseCharacteristics,
        //   entity.character.characteristics
        // );
        // console.log(
        //   entity.character.baseMaxHealthBar,
        //   entity.character.maxHealthBar
        // );
        // console.log(entity.character.buffsBonus);
      }
    });

    const entitiesArray: Entity[] = [];
    room.entities.forEach((entity) => {
      if (entity.character.healthBar > 0) {
        entitiesArray.push(entity);
      }
    });

    for (const entity of entitiesArray) {
      if (!this.world) return;

      if (entity.character.healthBar <= 0) {
        continue;
      }

      const entitiesAtPosition = room.entities.get({
        x: entity.x,
        y: entity.y,
      });
      if (
        !entitiesAtPosition ||
        !Array.from(entitiesAtPosition).includes(entity)
      ) {
        continue;
      }

      const { to, lookDir, attackResult, lastAttacked, lastMoved } =
        entity.character.move(entity, this.world);

      if (entity.character.healthBar <= 0) {
        continue;
      }

      if (lookDir) entity.lookDir = lookDir;
      if (attackResult) entity.lastAttackArray = attackResult.attackedTiles;
      entity.animation.lastAttacked = lastAttacked;
      entity.animation.lastMoved = lastMoved;

      const { x, y } = to;
      if (!room.entities.get(to)) {
        room.entities.delete({ x: entity.x, y: entity.y }, entity);
        entity.x = x;
        entity.y = y;
        room.entities.add({ x: entity.x, y: entity.y }, entity);
      }
    }

    const newWorld = {
      ...this.world,
      player: { ...this.world.player },
      isPlayerDead: this.world.player.character.healthBar <= 0,
    };

    this.updateWorld(newWorld);
  }

  private calculateAvailableUpgrades(world: World): UpgradeOption[] {
    const upgradesBought = world.player.upgradesBought;

    const upgrades: UpgradeOption[] = [
      {
        id: 'strength',
        name: 'Strength',
        description: 'Increases damage and health',
        characteristic: 's',
        currentLevel: upgradesBought.strength || 0,
        maxLevel: 10,
        cost: this.calculateUpgradeCost(
          'strength',
          upgradesBought.strength || 0
        ),
      },
      {
        id: 'perception',
        name: 'Perception',
        description: 'Increases field of view and accuracy',
        characteristic: 'p',
        currentLevel: upgradesBought.perception || 0,
        maxLevel: 10,
        cost: this.calculateUpgradeCost(
          'perception',
          upgradesBought.perception || 0
        ),
      },
      {
        id: 'endurance',
        name: 'Endurance',
        description: 'Increases health and defense',
        characteristic: 'e',
        currentLevel: upgradesBought.endurance || 0,
        maxLevel: 10,
        cost: this.calculateUpgradeCost(
          'endurance',
          upgradesBought.endurance || 0
        ),
      },
      {
        id: 'agility',
        name: 'Agility',
        description: 'Increases movement and attack speed',
        characteristic: 'a',
        currentLevel: upgradesBought.agility || 0,
        maxLevel: 10,
        cost: this.calculateUpgradeCost('agility', upgradesBought.agility || 0),
      },
      {
        id: 'intelligence',
        name: 'Intelligence',
        description: 'Increases experience gain',
        characteristic: 'i',
        currentLevel: upgradesBought.intelligence || 0,
        maxLevel: 10,
        cost: this.calculateUpgradeCost(
          'intelligence',
          upgradesBought.intelligence || 0
        ),
      },
    ];

    return upgrades.filter(
      (upgrade) => upgrade.currentLevel < upgrade.maxLevel
    );
  }

  private calculateUpgradeCost(
    upgradeId: string,
    currentUpgrades: number
  ): number {
    const baseCost = 50;
    return Math.floor(baseCost * Math.pow(1.5, currentUpgrades));
  }

  private handlePurchaseUpgrade(event: PurchaseUpgradeEvent) {
    if (!this.world) return;

    const upgrade = this.world.availableUpgrades.find(
      (u) => u.id === event.upgradeId
    );
    if (!upgrade) return;

    if (this.world.player.availableExperience < upgrade.cost) return;

    const newWorld = { ...this.world };
    newWorld.player = { ...this.world.player };
    newWorld.player.availableExperience -= upgrade.cost;
    newWorld.player.spentExperience += upgrade.cost;
    newWorld.player.upgradesBought = {
      ...this.world.player.upgradesBought,
      [event.upgradeId]:
        (this.world.player.upgradesBought[event.upgradeId] || 0) + 1,
    };

    newWorld.player.character.applyBuff(newWorld.player, [
      getBuffsClassMap()['SimpleAttributeBuff'],
      getBuffsClassMap()['SimpleFurryBuff'],
    ]);

    recalculatePlayerStats(newWorld.player);
    newWorld.availableUpgrades = this.calculateAvailableUpgrades(newWorld);

    const newWorldObject = {
      ...newWorld,
      isPlayerDead: newWorld.player.character.healthBar <= 0,
    };

    this.updateWorld(newWorldObject);
  }

  public restartGame() {
    this.stopNPCMovementTimer();
    this.generateStubWorld();
  }

  public cleanup() {
    this.stopNPCMovementTimer();
  }

  public saveGame(): string {
    if (!this.world) {
      throw new Error('No world to save');
    }
    return serializeWorld(this.world);
  }

  public loadGame(saveData: string): void {
    try {
      const world = deserializeWorld(saveData);
      this.stopNPCMovementTimer();
      this.world = world;
      this.updateWorld(world);
      this.startNPCMovementTimer();
    } catch (error) {
      console.error('Failed to load game:', error);
      throw new Error('Invalid save data');
    }
  }
}
