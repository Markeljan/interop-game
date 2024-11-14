import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "./config";
import { OwnedNft } from "alchemy-sdk";

export function Game({ playerNfts }: { playerNfts: OwnedNft[] }) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    gameRef.current = new Phaser.Game(
      createGameConfig(containerRef.current.id, playerNfts)
    );

    return () => {
      gameRef.current?.destroy(true);
    };
  }, [playerNfts]);

  return <div id="phaser-container" ref={containerRef} className="h-[600px]" />;
}
