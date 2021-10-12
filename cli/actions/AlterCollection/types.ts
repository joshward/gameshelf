import { BggGameWithVersions } from '../../lib/bgg-api'

export interface FoundGame {
  details: BggGameWithVersions;
  bggId: number;
  inCollection: boolean;
}
