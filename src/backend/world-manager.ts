import {
  World,
  InventorySlot,
  InventoryItem,
  ItemType,
  GameMap,
  Room,
  Point2d,
  ExitMappingEntry,
  LookDirection,
  EntitiesMap,
  UpgradeOption,
  Entity,
  Grid,
} from '../common/interfaces';
import {
  Event,
  InventorySelectEvent,
  InventoryUseEvent,
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
import { WEAPONS } from './data/weapons';
import { TargetType } from './behaviour/buffs';
import {
  serializeWorld,
  deserializeWorld,
  serializeGameMapToString,
  deserializeGameMapFromString,
  reconstructCharacter,
} from './serializer';

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
      this.cleanupFloatingTexts();
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
      { id: 0 },
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
          s: 5,
          p: 5,
          e: 5,
          i: 5,
          a: 5,
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
      onCreateFloatingText: (
        x: number,
        y: number,
        text: string,
        type: 'damage' | 'miss' | 'critical' | 'buff' | 'debuff',
        color?: string
      ) => {
        this.addFloatingText(x, y, text, type, color);
      },
      availableUpgrades: [],
      isPlayerDead: false,
      floatingTexts: [],
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
      case 'inventory_use':
        this.handleInventoryUse(event);
        break;
      case 'purchase_upgrade':
        this.handlePurchaseUpgrade(event);
        break;
    }
  }

  private handleInventorySelect(event: InventorySelectEvent) {
    if (!this.world) return;

    const selectedSlot = this.world.player.slots.find(
      (slot) => slot.id === event.slotId
    );
    const selectedItem = selectedSlot?.item;

    if (selectedItem?.type === 'weapon') {
      this.world.player.character.equipWeapon(selectedItem, this.world.player);
    } else {
      this.world.player.character.equipWeapon(undefined, this.world.player);
    }

    const newWorld = {
      ...this.world,
      player: {
        ...this.world.player,
        activeSlot: event.slotId,
      },
    };

    this.updateWorld(newWorld);
  }

  private handleInventoryUse(event: InventoryUseEvent) {
    if (!this.world) return;

    const slot = this.world.player.slots.find((s) => s.id === event.slotId);
    if (!slot || !slot.item) return;

    const item = slot.item;
    const player = this.world.player;

    // if (item.type === ItemType.Scroll && !event.target) {
    //   return;
    // }

    switch (item.type) {
      case ItemType.Consumable:
        this.applyPotion(item, player);
        break;
      case ItemType.Scroll:
        this.applyScroll(item, player, event.target!);
        break;
    }

    if (item.type != ItemType.Weapon) slot.item = undefined;
    this.updateWorld({ ...this.world });
  }

  private applyPotion(item: InventoryItem, entity: Entity) {
    if (item.effect && item.effect.length > 0) {
      entity.character.applyBuff(entity, item.effect);
    }
  }

  private applyScroll(item: InventoryItem, caster: Entity, target: Point2d) {
    const room = this.world!.map.rooms[this.world!.map.currentRoom];
    const map = room.map;

    // if (target.y < 0 || target.y >= map.length ||
    //     target.x < 0 || target.x >= map[0].length) {
    //   return;
    // }

    if (item.id === 'scroll_teleport') {
      // if (
      //   map[target.y][target.x] === 'floor' &&
      //   (!room.entities.get(target) || room.entities.get(target)?.size === 0)
      // ) {
      //   room.entities.delete({ x: caster.x, y: caster.y }, caster);

      //   caster.x = target.x;
      //   caster.y = target.y;

      //   room.entities.add(target, caster);

      //   if (this.world?.onCreateFloatingText) {
      //     this.world.onCreateFloatingText(target.x, target.y, 'POOF!', 'buff');
      //   }
      // }
      return; 
    }

    if (item.effect) {
      const targets = this.getEntitiesInArea(
        target,
        item.area || { areaUp: 0, areaDown: 0, areaLeft: 0, areaRight: 0 }
      );

      targets.forEach((entity) => {
        if (item.targetType === TargetType.Enemy && entity.id !== caster.id) {
          entity.character.applyBuff(entity, item.effect!);
        } else if (item.targetType === TargetType.Self) {
          caster.character.applyBuff(caster, item.effect!);
        }
      });
    }
  }

  private getEntitiesInArea(center: Point2d, area: Grid): Entity[] {
    const entities: Entity[] = [];
    const room = this.world!.map.rooms[this.world!.map.currentRoom];
    const { areaUp, areaDown, areaLeft, areaRight } = area;

    for (let dy = -areaUp; dy <= areaDown; dy++) {
      for (let dx = -areaLeft; dx <= areaRight; dx++) {
        if (!center)
          center = {
            x: this.world ? this.world?.player.x : 0,
            y: this.world ? this.world?.player.y : 0,
          };
        const pos = {
          x: center.x + dx,
          y: center.y + dy,
        };

        const entitiesAtPos = room.entities.get(pos);
        if (entitiesAtPos) {
          entitiesAtPos.forEach((entity) => entities.push(entity));
        }
      }
    }

    return entities;
  }

  private handleAttack = (event: PlayerAttackEvent) => {
    if (!this.world) return;

    const newWorld = {
      ...this.world,
      onEntityDeath: (deadEntity: Entity, attacker: Entity) =>
        this.handleEnemyKilled(newWorld, { enemyLevel: deadEntity.level }),
      onCreateFloatingText: (
        x: number,
        y: number,
        text: string,
        type: 'damage' | 'miss' | 'critical' | 'buff' | 'debuff',
        color?: string
      ) => {
        this.addFloatingText(x, y, text, type, color);
      },
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
      onEntityDeath: this.world.onEntityDeath,
      onCreateFloatingText: this.world.onCreateFloatingText,
      floatingTexts: this.world.floatingTexts,
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

  private reinitializeWorldCallbacks(world: World): void {
    world.onEntityDeath = (deadEntity: Entity, attacker: Entity) => {
      if (this.world) {
        this.handleEnemyKilled(this.world, { enemyLevel: deadEntity.level });
      }
    };

    world.onCreateFloatingText = (
      x: number,
      y: number,
      text: string,
      type: 'damage' | 'miss' | 'critical' | 'buff' | 'debuff',
      color?: string
    ) => {
      this.addFloatingText(x, y, text, type, color);
    };

    if (!world.floatingTexts) {
      world.floatingTexts = [];
    }
  }

  public loadGame(saveData: string): void {
    try {
      const world = deserializeWorld(saveData);
      this.stopNPCMovementTimer();

      this.reinitializeWorldCallbacks(world);

      this.world = world;
      this.updateWorld(world);
      this.startNPCMovementTimer();
    } catch (error) {
      console.error('Failed to load game:', error);
      throw new Error('Invalid save data');
    }
  }

  public saveMap(): string {
    if (!this.world) {
      throw new Error('No world to save map from');
    }
    return serializeGameMapToString(this.world.map);
  }

  public loadMap(mapData: string): void {
    if (!this.world) {
      throw new Error('No world to load map into');
    }

    try {
      const map = deserializeGameMapFromString(mapData);

      if (map && map.rooms) {
        map.rooms.forEach((room: any) => {
          if (room.entities) {
            room.entities.forEach((entity: any) => {
              if (entity.character) {
                entity.character = reconstructCharacter(entity.character);
              }
            });
          }
        });
      }

      const newWorld = {
        ...this.world,
        map: map,
      };

      this.reinitializeWorldCallbacks(newWorld);

      this.updateWorld(newWorld);
    } catch (error) {
      console.error('Failed to load map:', error);
      throw new Error('Invalid map data');
    }
  }

  private addFloatingText(
    x: number,
    y: number,
    text: string,
    type: 'damage' | 'miss' | 'critical' | 'buff' | 'debuff',
    color?: string
  ) {
    if (!this.world) return;

    if (!this.world.floatingTexts) {
      this.world.floatingTexts = [];
    }

    const floatingText = {
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      text,
      type,
      color: color || this.getDefaultColor(type),
      startTime: Date.now(),
      duration: 2000,
    };

    this.world.floatingTexts.push(floatingText);

    this.cleanupFloatingTexts();
  }

  private getDefaultColor(
    type: 'damage' | 'miss' | 'critical' | 'buff' | 'debuff'
  ): string {
    switch (type) {
      case 'damage':
        return '#ff4444';
      case 'miss':
        return '#888888';
      case 'critical':
        return '#ffaa00';
      case 'buff':
        return '#44ff44';
      case 'debuff':
        return '#ff8844';
      default:
        return '#ffffff';
    }
  }

  private cleanupFloatingTexts() {
    if (!this.world?.floatingTexts) return;

    const now = Date.now();
    this.world.floatingTexts = this.world.floatingTexts.filter(
      (text) => now - text.startTime < text.duration
    );
  }

  public createAttackFloatingText(
    attackResult: any,
    targetX: number,
    targetY: number
  ) {
    if (!attackResult) return;

    const { finalDamage, status } = attackResult;

    switch (status) {
      case 'miss':
        this.addFloatingText(targetX, targetY, 'MISS', 'miss');
        break;
      case 'normal':
        const damage = Math.round(finalDamage);
        this.addFloatingText(targetX, targetY, `-${damage}`, 'damage');
        break;
      case 'redirected':
        const redirectDamage = Math.round(finalDamage);
        this.addFloatingText(
          targetX,
          targetY,
          `REDIRECT -${redirectDamage}`,
          'critical'
        );
        break;
      case 'self-hit':
        const selfDamage = Math.round(finalDamage);
        this.addFloatingText(targetX, targetY, `SELF -${selfDamage}`, 'debuff');
        break;
    }

    if (attackResult.finalAttack?.attackBuffs?.length > 0) {
      attackResult.finalAttack.attackBuffs.forEach((buff: any) => {
        if (buff.name) {
          this.addFloatingText(targetX, targetY - 0.3, buff.name, 'buff');
        }
      });
    }
  }
}
