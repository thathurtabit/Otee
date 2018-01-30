/* globals __DEV__ */
import Phaser from 'phaser'

export default class extends Phaser.State {
  constructor () {
    super()
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
    this.playerSize = 15
    this.touchableTiles = []
    this.playerColor = {
      current: 0xff9770,
      default: 0xff9770,
      slow: 0xFF0000,
      fast: 0xFFFFFF,
      trail: 0xFFFFFF
    }
    this.playerStart = {
      x: 220,
      y: 20
    }
    this.gameRules = {
      gameSpeed: 1,
      heroSpeedDefault: 180,
      heroSpeedFast: 200,
      heroSpeedSlow: 160,
      heroSpeedCurrent: 180,
      triggerCameraHeight: 375
    }
  }

  init () {}
  preload () {
    this.load.tilemap('map', 'assets/data/phaser-game-tile.csv', null, Phaser.Tilemap.CSV)
    this.load.image('blocks', 'assets/images/tiles.png')
    this.load.image('star', 'assets/images/star.png')
  }

  // Walls
  wallBuilder () {
    //  Because we're loading CSV map data we have to specify the tile size here or we can't render it
    this.tileMap = this.add.tilemap('map', 41, 41)

    //  Add a Tileset image to the map
    this.tileMap.addTilesetImage('blocks')

    // Creates a map layer
    this.mapLayer = this.tileMap.createLayer(0)

    //  Resize the world
    this.mapLayer.resizeWorld()

    // Colision with slow tile
    this.tileMap.setTileIndexCallback(2, this.slowDownPlayer, this)

    // Colision with fast tile
    this.tileMap.setTileIndexCallback(3, this.speedUpPlayer, this)

    // Collision
    this.tileMap.setCollisionByExclusion([4])
  }

  // // Handle overlap between player and object
  // collectStar (player, star) {
  //   // Removes the star from the screen
  //   star.kill()

  //   //  Add and update the score
  //   this.score += 10
  //   this.scoreText.text = `Score: ${this.score}`

  //   if (this.score === 10 * 12) {
  //     this.scoreText.text = `You win!`
  //   }
  // }

  // // Allow the player to collect stars
  // starGroup () {
  //   this.stars = this.add.group()

  //   this.stars.enableBody = true

  //   //  Here we'll create 12 of them evenly spaced apart
  //   for (let i = 0; i < 12; i++) {
  //     //  Create a star inside of the 'stars' group
  //     let star = this.stars.create(i * 70, 0, 'star')

  //     //  Let gravity do its thing
  //     star.body.gravity.y = 100

  //     //  This just gives each star a slightly random bounce value
  //     star.body.bounce.y = 0.2 + Math.random() * 0.2
  //   }
  // }

  slowDownPlayer (sprite, tile) {
    tile.alpha = 0.2
    this.gameRules.heroSpeedCurrent = 120
    this.playerColor.current = 0xFF0000
    this.mapLayer.dirty = true

    // Add the touched tile to an array
    this.touchableTiles.push(tile)
  }

  speedUpPlayer (sprite, tile) {

    tile.alpha = 0.2
    this.gameRules.heroSpeedCurrent = 220
    this.playerColor.current = 0xFFFFFF
    this.mapLayer.dirty = true
    //if (tileTouched === 0) {
      this.pointInfo = this.add.text(this.player.x, this.player.y - 20, '50 POINTS', { font: 'Press Start 2P', fontSize: '10px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
      //tileTouched = true
    //}
    this.pointInfo.lifespan = 100

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

  // Store Hero History
  storeHeroHistory (xPos, yPos) {
    let x = xPos + (this.playerSize / 2)
    let y = yPos + (this.playerSize / 2)

    this.trail = this.add.graphics(0, 0)
    this.trail.beginFill(this.playerColor.trail, 1)
    this.trail.drawCircle(x, y, 1)
    // Kill off after this time...
    this.trail.lifespan = 500
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
  }

  // Movement events
  keyboardEvents () {
    this.cursors = this.input.keyboard.createCursorKeys()

    //  Reset the players velocity (keyboardEvents)
    this.player.body.velocity.x = 0
    this.player.body.velocity.y = 0

    if (this.cursors.left.isDown) {
      //  Move left
      this.direction = 'left'
    } else if (this.cursors.right.isDown) {
      //  Move right
      this.direction = 'right'
    } else if (this.cursors.up.isDown) {
      //  Move up
      this.direction = 'up'
    } else if (this.cursors.down.isDown) {
      //  Move down
      this.direction = 'down'
    }
  }

  // TODO: Replace with Switch
  movePlayer () {
    // Get player position on change of direction
    const getPosAtTurn = () => {
      // Send current player data to allow trail to be built
      this.storeHeroHistory(this.player.x, this.player.y)
    }

    if (this.direction === 'left') {
      this.player.body.velocity.x -= this.gameRules.heroSpeedCurrent
      getPosAtTurn()
    } else if (this.direction === 'right') {
      this.player.body.velocity.x += this.gameRules.heroSpeedCurrent
      getPosAtTurn()
    } else if (this.direction === 'up') {
      this.player.body.velocity.y -= this.gameRules.heroSpeedCurrent
      getPosAtTurn()
    } else if (this.direction === 'down') {
      this.player.body.velocity.y += this.gameRules.heroSpeedCurrent
      getPosAtTurn()
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

    // // Stars colliding with walls
    // this.physics.arcade.collide(this.stars, this.mapLayer)
    // // This for keyboard events
    // this.physics.arcade.overlap(this.player, this.stars, this.collectStar, null, this)
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
    this.gameRules.heroSpeedCurrent = this.gameRules.heroSpeedDefault
    this.playerColor.current = this.playerColor.default
    this.resetTouchableTiles()

    this.gameOverInfo.text = 'SPACEBAR to start'
  }

  handleGameOver () {
    this.direction = null
    this.endGame = true
    this.gameInPlay = false

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
    this.score = Math.floor(this.player.y - this.playerStart.y)
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
    this.scoreText = this.add.text(10, 10, 'Score: 0', { font: 'Press Start 2P', fontSize: '12px', fill: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.2)' })
    this.scoreText.fixedToCamera = true
    this.highScoreText = this.add.text(250, 10, `High: ${localStorage.highScore || 0}`, { font: 'Press Start 2P', fontSize: '12px', fill: '#fff', align: 'right', backgroundColor: 'rgba(0, 0, 0, 0.2)' })
    this.highScoreText.fixedToCamera = true
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
    this.playerBuilder()

    //this.starGroup()
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
    if ((!this.gameInPlay && this.enter.isDown) || (!this.gameInPlay && this.enterNumpad.isDown)) {
      this.handleReset()
    }
  }

  render () {
    if (__DEV__) {
      //this.game.debug.cameraInfo(this.camera, 32, 32)
      // this.game.debug.spriteCoords(this.player, 32, 500)
    }
  }
}
