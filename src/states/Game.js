/* globals __DEV__ */
import Phaser from 'phaser'

export default class extends Phaser.State {
  constructor () {
    super()

    this.backgroundColor = 'red'
    this.player = this.player
    this.cursors = this.cursors
    this.stars = this.stars
    this.score = 0
    this.gameInPlay = false
    this.endGame = false
    this.scoreText = this.scoreText
    this.tileMap = this.tileMap
    this.mapLayer = this.mapLayer
    this.direction = 'down'
    this.gameStartText = this.gameStartText
    this.playerSize = 14
    this.touchableTiles = []
    this.playerColor = {
      current: 0xff9770,
      default: 0xff9770,
      slow: 0xFF0000,
      fast: 0xFFFFFF,
      trail: 0xFFFFFF
    }
    this.playerStart = {
      x: 198,
      y: 50
    }
    this.bonusPoints = 0
    this.gameRules = {
      gameSpeed: 1,
      heroSpeedDefault: 160,
      heroSpeedFast: 200,
      heroSpeedSlow: 160,
      heroSpeedCurrent: 180,
      triggerCameraHeight: 250,
      reversePlayer: false
    }
  }

  init () {}
  preload () {
    this.load.tilemap('map', 'assets/data/phaser-game-tile.csv', null, Phaser.Tilemap.CSV)
    this.load.image('blocks', 'assets/images/tiles.png')
  }

  // Walls
  wallBuilder () {
    //  Because we're loading CSV map data we have to specify the tile size here or we can't render it
    this.tileMap = this.add.tilemap('map', 37, 37)

    //  Add a Tileset image to the map
    this.tileMap.addTilesetImage('blocks')

    // Creates a map layer
    this.mapLayer = this.tileMap.createLayer(0)

    //  Resize the world
    this.mapLayer.resizeWorld()

    // See handleTileCollision
    this.tileMap.setTileIndexCallback(1, this.handleTileCollision, this)
    this.tileMap.setTileIndexCallback(2, this.handleTileCollision, this)
    this.tileMap.setTileIndexCallback(3, this.handleTileCollision, this)
    this.tileMap.setTileIndexCallback(4, this.handleTileCollision, this)
    this.tileMap.setTileIndexCallback(5, this.handleTileCollision, this)
    this.tileMap.setTileIndexCallback(6, this.reversePlayer, this)

    // Collision
    this.tileMap.setCollisionByExclusion([-1, 5])
  }

  handleTileCollision (sprite, tile) {
    let index = tile.index
    let text
    let playerSpeed = this.gameRules.heroSpeedCurrent
    let bonusPoints = 0
    let tileAlpha = 0.3

    switch (index) {
      case 1:
        text = '+50 POINTS!'
        bonusPoints = 50
        break
      case 2:
        text = 'SLOW DOWN'
        playerSpeed = 100
        break
      case 3:
        text = 'SPEED UP'
        playerSpeed = 220
        break
      case 4:
        text = '+100 POINTS!'
        bonusPoints = 100
        break
      case 5:
        text = 'IT\'S DARK!'
        tileAlpha = 0.95
        break
      default:
        break
    }

    // When we hit the tile, do things only once...
    if (tile.alpha === 1) {
      this.pointInfo = this.add.text(this.player.x, this.player.y, text, { font: 'Press Start 2P', fontSize: '10px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
      // Add bonus to total
      this.bonusPoints += bonusPoints
    }

    this.pointInfo.anchor.setTo(0.5) // set anchor to middle / center
    this.pointInfo.lifespan = 400

    // Change opacity down
    tile.alpha = tileAlpha
    this.gameRules.heroSpeedCurrent = playerSpeed
    this.playerColor.current = 0xFF0000
    this.mapLayer.dirty = true

    // Add the touched tile to an array
    this.touchableTiles.push(tile)
  }

  // Reset touched tiles
  resetTouchableTiles () {
    // Convert alpha back to 1
    this.touchableTiles.forEach((touchedTile) => {
      touchedTile.alpha = 1
    })
    // Refresh map
    this.mapLayer.dirty = true
    // Clear touched tiles array
    this.touchableTiles = []
  }

  reversePlayer (sprite, tile) {
    this.gameRules.reversePlayer = true
    tile.alpha = 0.2
    // Add the touched tile to an array
    this.touchableTiles.push(tile)
  }

  // Store Hero History
  storeHeroHistory (xPos, yPos) {
    let x = xPos + (this.playerSize / 2) - 1
    let y = yPos + (this.playerSize / 2) - 1

    this.trail = this.add.graphics(0, 0)
    this.trail.beginFill(this.playerColor.trail, 1)
    this.trail.drawCircle(x, y, 1)
    // Kill off after this time...
    this.trail.lifespan = 500

    this.playerGroup.add(this.trail)
  }

  // Player
  playerBuilder () {
    let hero = this.add.graphics(0, 0)
    hero.beginFill(this.playerColor.current, 1)
    hero.drawCircle(this.playerSize, this.playerSize, this.playerSize * 2)

    // The player and its settings
    this.player = this.add.sprite(this.playerStart.x, this.playerStart.y)
    this.player.width = this.playerSize
    this.player.height = this.playerSize
    this.player.addChild(hero)

    //  We need to enable physics on the player
    this.physics.arcade.enable(this.player)

    this.player.body.collideWorldBounds = true
    this.player.checkWorldBounds = true

    if (this.player.inCamera === false && this.gameInPlay) {
      this.handleGameOver()
    }

    this.playerGroup.add(this.player)
  }

  scorePanelBuilder () {
    this.scorePanel = this.add.group()
    this.scorePanel.x = 50
    this.scorePanel.y = 100
    this.scorePanel.alpha = 0.95
    this.scorePanel.width = this.camera.width
    this.scorePanel.fixedToCamera = true

    let scoreBg = this.add.graphics(0, 0)
    scoreBg.beginFill(this.playerColor.current, 1)
    scoreBg.drawRect(0, 0, this.camera.width, 30)

    // use the bitmap data as the texture for the sprite
    this.scorePanel.add(scoreBg)

    console.log(this.scorePanel)
  }

  // Movement events
  keyboardEvents () {
    this.cursors = this.input.keyboard.createCursorKeys()

    // Reset the reversing back to normal
    const resetReverse = () => {
      this.gameRules.reversePlayer = false
    }

    //  Reset the players velocity (keyboardEvents)
    this.player.body.velocity.x = 0
    this.player.body.velocity.y = 0

    if (this.cursors.left.isDown) {
      //  Move left
      this.direction = 'left'
      resetReverse()
    } else if (this.cursors.right.isDown) {
      //  Move right
      this.direction = 'right'
      resetReverse()
    } else if (this.cursors.up.isDown) {
      //  Move up
      this.direction = 'up'
      resetReverse()
    } else if (this.cursors.down.isDown) {
      //  Move down
      this.direction = 'down'
      resetReverse()
    }
  }

  // TODO: Replace with Switch
  movePlayer () {
    // Get player position on change of direction
    const getPosAtTurn = () => {
      // Send current player data to allow trail to be built
      this.storeHeroHistory(this.player.x, this.player.y)
    }
    // If not reversed, turn normally
    if (!this.gameRules.reversePlayer) {
      switch (this.direction) {
        case 'left':
          this.player.body.velocity.x -= this.gameRules.heroSpeedCurrent
          getPosAtTurn()
          break
        case 'right':
          this.player.body.velocity.x += this.gameRules.heroSpeedCurrent
          getPosAtTurn()
          break
        case 'up':
          this.player.body.velocity.y -= this.gameRules.heroSpeedCurrent
          getPosAtTurn()
          break
        case 'down':
          this.player.body.velocity.y += this.gameRules.heroSpeedCurrent
          getPosAtTurn()
          break
        default:
          break
      }
    // Player is reversed!
    } else {
      switch (this.direction) {
        case 'left':
          this.player.body.velocity.x += this.gameRules.heroSpeedCurrent
          getPosAtTurn()
          break
        case 'right':
          this.player.body.velocity.x -= this.gameRules.heroSpeedCurrent
          getPosAtTurn()
          break
        case 'up':
          this.player.body.velocity.y += this.gameRules.heroSpeedCurrent
          getPosAtTurn()
          break
        case 'down':
          this.player.body.velocity.y -= this.gameRules.heroSpeedCurrent
          getPosAtTurn()
          break
        default:
          break
      }
    }
  }

  // Constantly move the camera
  moveCamera () {
    // As long as the game is running and the player has reaches a certain position...
    if (this.gameInPlay && this.player.y >= this.gameRules.triggerCameraHeight) {
      this.camera.y += this.gameRules.gameSpeed
    }
  }

  handleGameInPlay () {
    this.startInfo.kill()
    // if it bleeds we can kill it
    if (this.gameOverInfo) {
      this.gameOverInfo.kill()
    }

    // To move player
    this.movePlayer()
    this.moveCamera()

    // Collide the player and the stars with the walls
    this.physics.arcade.collide(this.player, this.mapLayer, this.handleGameOver, null, this)
    // When the player hits the edge of the screen
    this.player.events.onOutOfBounds.add(this.handleGameOver, this)

    // If player is off screen
    if (this.player.y <= this.game.camera.y + (this.playerSize / 2)) {
      this.handleGameOver()
    }
  }

  handleReset () {
    this.restartInfo.kill()
    this.scoreInfo.kill()
    this.trail.destroy()
    this.score = 0
    this.player.x = this.playerStart.x
    this.player.y = this.playerStart.y
    this.camera.y = 0
    this.direction = 'down'
    this.endGame = false
    this.bonusPoints = 0
    this.gameRules.heroSpeedCurrent = this.gameRules.heroSpeedDefault
    this.gameRules.reversePlayer = false
    this.playerColor.current = this.playerColor.default
    this.resetTouchableTiles()

    this.gameOverInfo.text = 'SPACEBAR to start'
  }

  handleGameOver () {
    this.direction = null
    this.endGame = true
    this.gameInPlay = false

    this.playerInfo = this.add.text(this.player.x + 7, this.player.y - 15, 'OUCH', { font: 'Press Start 2P', fontSize: '10px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.playerInfo.anchor.setTo(0.5) // set anchor to middle / center
    // Kill off after this time...
    this.playerInfo.lifespan = 1000

    //  You can set your own intensity and duration
    this.camera.shake(0.02, 500)

    //  Reset the players velocity (keyboardEvents)
    this.player.body.velocity.x = 0
    this.player.body.velocity.y = 0

    let centerX = this.camera.width / 2
    let centerY = this.camera.height / 2

    // To do, collect all this info in a group?
    this.scoreInfo = this.add.text(centerX, centerY - 50, `Score: ${this.score} `, { font: 'Press Start 2P', fontSize: '25px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.scoreInfo.anchor.setTo(0.5) // set anchor to middle / center
    this.gameOverInfo = this.add.text(centerX, centerY - 12, 'GAME OVER', { font: 'Press Start 2P', fontSize: '18px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.gameOverInfo.anchor.setTo(0.5) // set anchor to middle / center
    this.restartInfo = this.add.text(centerX, centerY + 20, 'Press ENTER to reset', { font: 'Press Start 2P', fontSize: '15px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.restartInfo.anchor.setTo(0.5) // set anchor to middle / center
    // Fix to camera position
    this.scoreInfo.fixedToCamera = true
    this.gameOverInfo.fixedToCamera = true
    this.restartInfo.fixedToCamera = true

    this.setHighScore()
  }

  updateScore () {
    this.score = Math.floor(this.player.y - this.playerStart.y) + this.bonusPoints
    this.scoreText.text = `Score: ${this.score}`
    this.highScoreText.text = `High: ${localStorage.highScore || 0}`
  }

  startMenu () {
    let centerX = this.camera.width / 2
    let centerY = this.camera.height / 2

    if (!this.gameInPlay) {
      this.startInfo = this.add.text(centerX, centerY, 'SPACEBAR to start', { font: 'Press Start 2P', fontSize: '18px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
      this.startInfo.anchor.setTo(0.5) // set anchor to middle / center
    }
  }

  scoreText () {
    this.scoreText = this.add.text(10, 10, 'Score: 0', {font: 'Press Start 2P', fontSize: '10px', fill: '#fff'})
    this.highScoreText = this.add.text(0, 10, `High: ${localStorage.highScore || 0}`, { font: 'Press Start 2P', fontSize: '10px', fill: '#fff', align: 'right', boundsAlignH: 'right', wordWrapWidth: 20 })
    this.highScoreText.setTextBounds(0, 0, this.camera.width - 10, 0)

    this.scorePanel.add(this.scoreText)
    this.scorePanel.add(this.highScoreText)
  }

  setHighScore () {
    // Set a hightScore localStorage variable if it hasn't already been set
    if (localStorage.getItem('highScore') === null) {
      localStorage.setItem('highScore', this.score)
    // If the new score is greater than the previous high score, store it
    } else if (this.score > localStorage.getItem('highScore')) {
      localStorage.setItem('highScore', this.score)
      this.highScore = localStorage.highScore
      this.highScoreText.text = `High Score: ${this.highScore}`
    }
  }

  // CREATE THE THINGS
  create () {
    //  We're going to be using physics, so enable the Arcade Physics system
    this.physics.startSystem(Phaser.Physics.ARCADE)

    this.wallBuilder()
    this.playerGroup = this.add.group()
    this.playerBuilder()
    this.tunnelGroup = this.add.group()
    this.tileMap.createFromTiles(5, 5, null, this.mapLayer, this.tunnelGroup)
    this.scorePanelBuilder()
    this.scoreText()
    this.startMenu()
  }

  update () {
    this.spacebar = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    this.enter = this.input.keyboard.addKey(Phaser.Keyboard.ENTER)
    this.enterNumpad = this.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_ENTER)

    this.updateScore()

    // If we're not already playing, and not in the game over phase, and the spacebar is pressed...
    if (!this.gameInPlay && !this.endGame && this.spacebar.isDown) {
      this.gameInPlay = true
    }

    if (this.gameInPlay) {
      // Set initial direction
      // Hero keyboard events
      this.keyboardEvents()
      this.handleGameInPlay()
    }

    // Handle reset
    if ((this.endGame && this.enter.isDown) || (this.endGame && this.enterNumpad.isDown)) {
      this.handleReset()
    }

    // Handle z order
    this.game.world.sendToBack(this.playerGroup)
    this.game.world.bringToTop(this.tunnelGroup)
  }

  render () {
    if (__DEV__) {
      //this.game.debug.cameraInfo(this.camera, 32, 32)
      // this.game.debug.spriteCoords(this.player, 32, 500)
    }
  }
}
