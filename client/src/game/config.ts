import Phaser from "phaser";
import { OwnedNft } from "alchemy-sdk";
import { MainScene } from "./scenes/MainScene";

export const createGameConfig = (
  parent: string,
  nfts: OwnedNft[]
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: "#282c34",
  scale: {
    mode: Phaser.Scale.FIT,
    width: 800,
    height: 600,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false,
    },
  },
  scene: [new MainScene({ nfts })],
});
