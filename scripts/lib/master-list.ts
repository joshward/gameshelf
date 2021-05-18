import {
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { Config } from './config';
import { loadData } from './core/data';

export class MasterListExpansion {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  bggId?: number;

  @IsOptional()
  @IsBoolean()
  skip?: boolean;
}

export class MasterListGame {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  bggId?: number;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @IsOptional()
  @IsBoolean()
  wifeFavorite?: boolean;

  @IsOptional()
  @IsBoolean()
  new?: boolean;

  @IsOptional()
  @ValidateNested()
  @Expose({ name: "expansion" })
  @Type(() => MasterListExpansion)
  expansions?: MasterListExpansion[];

  @IsOptional()
  @IsInt()
  version?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  versionName?: string;

  @IsOptional()
  @IsBoolean()
  skip?: boolean;
}

export class MasterList {
  @ValidateNested()
  @Expose({ name: "game" })
  @Type(() => MasterListGame)
  games!: MasterListGame[];
}

export const loadMasterList = async (config: Config): Promise<MasterList> => {
  const file = config.source.gamesFile;
  const masterList = await loadData(file, { transform: MasterList, validate: true });

  const filteredGames = masterList.games.filter(game => !game.skip);
  masterList.games = filteredGames.map(game => {
    game.expansions = game.expansions?.filter(expansion => !expansion.skip);
    return game;
  });

  return masterList;
}
