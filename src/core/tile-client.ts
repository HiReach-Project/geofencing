import Tile38 from 'tile38';
import { config } from "../config";

const tile = new Tile38({ host: config.tileHost });

export default tile;
