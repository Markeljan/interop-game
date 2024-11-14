import Phaser from "phaser";
import { OwnedNft } from "alchemy-sdk";
import { CONFIG } from "../../config";

export class MainScene extends Phaser.Scene {
  private playerNfts: OwnedNft[] = [];
  private selectedIndex = 0;
  private itemBoxes: Phaser.GameObjects.Rectangle[] = [];
  private itemSprites: Phaser.GameObjects.Image[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private readonly MENU_WIDTH = 200;
  private readonly GRID_COLS = 3;
  private readonly GRID_ROWS = 5;
  private readonly ITEM_SIZE = 80;
  private readonly ITEM_PADDING = 8;

  private gameState: "inventory" | "playing" = "inventory";
  private activePlayer?: Phaser.Physics.Arcade.Image;
  private playerSpeed = 200;

  constructor(data: { nfts: OwnedNft[] }) {
    super({ key: "MainScene" });
    this.playerNfts = data.nfts;
  }

  preload() {
    this.playerNfts.forEach((nft) => {
      this.load.image(nft.contract.address, nft.image.originalUrl);
    });
  }

  create() {
    // Create cursor keys
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Create the menu background
    this.createMenuBackground();

    // Create the grid of item boxes
    this.createItemGrid();

    // Highlight the first box
    this.updateSelection();
  }

  private createMenuBackground() {
    // Left panel background
    const leftPanel = this.add.rectangle(0, 0, this.MENU_WIDTH, 600, 0x2d2d2d);
    leftPanel.setOrigin(0, 0);
    leftPanel.setAlpha(0.9);

    // Right panel background
    const rightPanel = this.add.rectangle(
      this.MENU_WIDTH,
      0,
      800 - this.MENU_WIDTH,
      600,
      parseInt(CONFIG.inventoryBgColor)
    );
    rightPanel.setOrigin(0, 0);
    rightPanel.setAlpha(0.9);

    // Add "Inventory" text
    const inventoryText = this.add.text(20, 20, "Inventory", {
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: "Arial",
    });
    inventoryText.setShadow(2, 2, "#000000", 2);
  }

  private createItemGrid() {
    const startX = this.MENU_WIDTH + 50;
    const startY = 50;

    for (let i = 0; i < this.GRID_ROWS * this.GRID_COLS; i++) {
      const row = Math.floor(i / this.GRID_COLS);
      const col = i % this.GRID_COLS;
      const x = startX + col * (this.ITEM_SIZE + this.ITEM_PADDING);
      const y = startY + row * (this.ITEM_SIZE + this.ITEM_PADDING);

      // Create item box
      const box = this.add.rectangle(
        x,
        y,
        this.ITEM_SIZE,
        this.ITEM_SIZE,
        0x4d4d4d
      );
      box.setOrigin(0, 0);
      box.setStrokeStyle(2, 0x666666);
      this.itemBoxes.push(box);

      // Add NFT if available
      if (i < this.playerNfts.length) {
        const sprite = this.add.image(
          x + this.ITEM_SIZE / 2,
          y + this.ITEM_SIZE / 2,
          this.playerNfts[i].contract.address
        );
        sprite.setDisplaySize(this.ITEM_SIZE - 20, this.ITEM_SIZE - 20);
        this.itemSprites.push(sprite);
      }
    }
  }

  private selectedItemSprite?: Phaser.GameObjects.Image;
  private selectedItemName?: Phaser.GameObjects.Text;
  private selectedItemDescription?: Phaser.GameObjects.Text;

  private updateSelectedItemDisplay() {
    // Clean up previous display
    this.selectedItemSprite?.destroy();
    this.selectedItemName?.destroy();
    this.selectedItemDescription?.destroy();

    if (this.selectedIndex < this.playerNfts.length) {
      const selectedNft = this.playerNfts[this.selectedIndex];

      // Display larger image
      this.selectedItemSprite = this.add.image(
        this.MENU_WIDTH / 2,
        200,
        selectedNft.contract.address
      );
      this.selectedItemSprite.setDisplaySize(160, 160);

      // Display name
      this.selectedItemName = this.add.text(
        10,
        300,
        selectedNft.name || "Untitled",
        {
          fontSize: "16px",
          color: "#ffffff",
          fontFamily: "Arial",
          wordWrap: { width: this.MENU_WIDTH - 20 },
        }
      );

      // Display description
      this.selectedItemDescription = this.add.text(
        10,
        340,
        selectedNft.description || "No description available",
        {
          fontSize: "14px",
          color: "#cccccc",
          fontFamily: "Arial",
          wordWrap: { width: this.MENU_WIDTH - 20 },
        }
      );
    }
  }

  private updateSelection() {
    this.itemBoxes.forEach((box, index) => {
      if (index === this.selectedIndex) {
        box.setStrokeStyle(3, 0xffff00);
      } else {
        box.setStrokeStyle(2, 0x666666);
      }
    });
    this.updateSelectedItemDisplay();
  }

  update() {
    if (this.gameState === "inventory") {
      this.handleInventoryControls();
    } else {
      this.handlePlayingControls();
    }
  }

  private handleInventoryControls() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      if (this.selectedIndex % this.GRID_COLS < this.GRID_COLS - 1) {
        this.selectedIndex++;
        this.updateSelection();
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      if (this.selectedIndex % this.GRID_COLS > 0) {
        this.selectedIndex--;
        this.updateSelection();
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      if (
        this.selectedIndex + this.GRID_COLS <
        this.GRID_COLS * this.GRID_ROWS
      ) {
        this.selectedIndex += this.GRID_COLS;
        this.updateSelection();
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      if (this.selectedIndex - this.GRID_COLS >= 0) {
        this.selectedIndex -= this.GRID_COLS;
        this.updateSelection();
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this.startPlaying();
    }
  }

  private handlePlayingControls() {
    if (!this.activePlayer) return;

    // Reset velocity
    this.activePlayer.setVelocity(0);

    // Handle movement
    if (this.cursors.left.isDown) {
      this.activePlayer.setVelocityX(-this.playerSpeed);
    } else if (this.cursors.right.isDown) {
      this.activePlayer.setVelocityX(this.playerSpeed);
    }

    if (this.cursors.up.isDown) {
      this.activePlayer.setVelocityY(-this.playerSpeed);
    } else if (this.cursors.down.isDown) {
      this.activePlayer.setVelocityY(this.playerSpeed);
    }

    // Press ESC to return to inventory
    if (this.input.keyboard?.addKey("ESC").isDown) {
      this.returnToInventory();
    }
  }

  private startPlaying() {
    if (this.selectedIndex >= this.playerNfts.length) return;

    this.gameState = "playing";

    // Hide inventory UI
    this.itemBoxes.forEach((box) => box.setVisible(false));
    this.itemSprites.forEach((sprite) => sprite.setVisible(false));
    this.selectedItemSprite?.setVisible(false);
    this.selectedItemName?.setVisible(false);
    this.selectedItemDescription?.setVisible(false);

    // Create player sprite
    const selectedNft = this.playerNfts[this.selectedIndex];
    this.activePlayer = this.physics.add.image(
      400,
      300,
      selectedNft.contract.address
    );
    this.activePlayer.setDisplaySize(64, 64);

    // Enable physics
    this.activePlayer.setCollideWorldBounds(true);
  }

  private returnToInventory() {
    this.gameState = "inventory";

    // Show inventory UI
    this.itemBoxes.forEach((box) => box.setVisible(true));
    this.itemSprites.forEach((sprite) => sprite.setVisible(true));
    this.selectedItemSprite?.setVisible(true);
    this.selectedItemName?.setVisible(true);
    this.selectedItemDescription?.setVisible(true);

    // Remove player sprite
    this.activePlayer?.destroy();
    this.activePlayer = undefined;
  }
}
