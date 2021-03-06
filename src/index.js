// @flow
import _ from 'lodash';
import fs from 'fs';
import { Commands, openSlpFile, iterateEvents, getMetadata } from './utils/slpReader';

import { getLastFrame, Frames } from "./stats/common";
import { generateConversions } from "./stats/conversions";
import { generateCombos } from "./stats/combos";
import { generateStocks } from "./stats/stocks";
import { generateActionCounts } from "./stats/actions";
import { generateOverall as generateOverallStats } from "./stats/overall";

// Type imports
import type {
  PlayerType, PreFrameUpdateType, PostFrameUpdateType, SlpFileType, MetadataType, GameEndType
} from "./utils/slpReader";
import type {
  StockType, ConversionType, ComboType, ActionCountsType, OverallType
} from "./stats/common";

type GameSettingsType = {
  stageId: number,
  isTeams: boolean,
  players: PlayerType[]
};

export type FrameEntryType = {
  frame: number,
  players: { [playerIndex: number]: {
    pre: PreFrameUpdateType,
    post: PostFrameUpdateType
  }}
};

type FramesType = {
  [frameIndex: number]: FrameEntryType
};

type StatsType = {
  lastFrame: number,
  playableFrameCount: number,
  stocks: StockType[],
  conversions: ConversionType[],
  combos: ComboType[],
  actionCounts: ActionCountsType[],
  overall: OverallType[],
};

/**
 * Slippi Game class that wraps a file
 */
export default class SlippiGame {
  filePath: string;
  file: SlpFileType;
  settings: GameSettingsType | null;
  playerFrames: FramesType | null;
  followerFrames: FramesType | null;
  stats: StatsType | null;
  metadata: MetadataType | null;
  gameEnd: GameEndType | null;

  latestFrameIndex: number | null;
  frameReadPos: number | null;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.frameReadPos = null;
    this.latestFrameIndex = null;
  }

  /**
   * Gets the game settings, these are the settings that describe the starting state of
   * the game such as characters, stage, etc.
   */
  getSettings(): GameSettingsType {
    if (this.settings) {
      // If header is already generated, return it
      return this.settings;
    }

    const slpfile = openSlpFile(this.filePath);

    // Prepare default settings
    let settings: GameSettingsType = {
      stageId: 0,
      isTeams: false,
      isPAL: false,
      players: []
    };

    // Generate settings from iterating through file
    iterateEvents(slpfile, (command, payload) => {
      if (!payload) {
        // If payload is falsy, keep iterating. The parser probably just doesn't know
        // about this command yet
        return false;
      }

      switch (command) {
      case Commands.GAME_START:
        if (!payload.stageId) {
          return true; // Why do I have to do this? Still not sold on Flow
        }

        settings = payload;
        settings.players = _.filter(payload.players, player => player.type !== 3);
        break;
      case Commands.POST_FRAME_UPDATE:
        if (payload.frame === null || payload.frame > Frames.FIRST) {
          // Once we are an frame -122 or higher we are done getting match settings
          // Tell the iterator to stop
          return true;
        }

        const playerIndex = payload.playerIndex;
        const playersByIndex = _.keyBy(settings.players, 'playerIndex');

        switch (payload.internalCharacterId) {
        case 0x7:
          playersByIndex[playerIndex].characterId = 0x13; // Sheik
          break;
        case 0x13:
          playersByIndex[playerIndex].characterId = 0x12; // Zelda
          break;
        }
        break;
      }

      return false; // Tell the iterator to keep iterating
    });

    this.settings = settings;
    fs.closeSync(slpfile.fileDescriptor);
    return settings;
  }

  getLatestFrame(): FrameEntryType | null {
    // TODO: Write this to check if we actually have all the latest frame data and return that
    // TODO: If we do. For now I'm just going to take a shortcut
    const allFrames = this.getFrames();
    const frameIndex = this.latestFrameIndex || Frames.FIRST;
    return _.get(allFrames, frameIndex - 1) || null;
  }

  getGameEnd(): GameEndType | null {
    if (this.gameEnd) {
      return this.gameEnd;
    }

    // Trigger getFrames because that is where the flag is set
    this.getFrames();
    return this.gameEnd || null;
  }

  getFrames(): FramesType {
    const slpfile = openSlpFile(this.filePath);

    const playerFrames: FramesType = this.playerFrames || {};
    const followerFrames: FramesType = this.followerFrames || {};

    this.frameReadPos = iterateEvents(slpfile, (command, payload) => {
      if (!payload) {
        // If payload is falsy, keep iterating. The parser probably just doesn't know
        // about this command yet
        return false;
      }

      switch (command) {
      case Commands.PRE_FRAME_UPDATE:
      case Commands.POST_FRAME_UPDATE:
        if (!payload.frame && payload.frame !== 0) {
          // If payload is messed up, stop iterating. This shouldn't ever happen
          return true;
        }

        const location = command === Commands.PRE_FRAME_UPDATE ? "pre" : "post";
        const frames = payload.isFollower ? followerFrames : playerFrames;
        this.latestFrameIndex = payload.frame;
        _.set(frames, [payload.frame, 'players', payload.playerIndex, location], payload);
        _.set(frames, [payload.frame, 'frame'], payload.frame);
        break;
      case Commands.GAME_END:
        this.gameEnd = payload;
        break;
      }

      return false; // Tell the iterator to keep iterating
    }, this.frameReadPos);

    this.playerFrames = playerFrames;
    this.followerFrames = followerFrames;
    fs.closeSync(slpfile.fileDescriptor);
    return playerFrames;
  }

  getStats(): StatsType {
    const slpfile = openSlpFile(this.filePath);

    const lastFrame = getLastFrame(this);

    // The order here kind of matters because things later in the call order might
    // reference things calculated earlier. More specifically, currently the overall
    // calculation uses the others
    this.stats = {};
    this.stats.stocks = generateStocks(this);
    this.stats.conversions = generateConversions(this);
    this.stats.combos = generateCombos(this);
    this.stats.actionCounts = generateActionCounts(this);
    this.stats.lastFrame = lastFrame;
    this.stats.playableFrameCount = lastFrame + Math.abs(Frames.FIRST_PLAYABLE);
    this.stats.overall = generateOverallStats(this);

    fs.closeSync(slpfile.fileDescriptor);

    return this.stats;
  }

  getMetadata(): MetadataType {
    if (this.metadata) {
      return this.metadata;
    }

    const slpfile = openSlpFile(this.filePath);

    this.metadata = getMetadata(slpfile);

    fs.closeSync(slpfile.fileDescriptor);
    return this.metadata;
  }
}
