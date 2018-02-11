/* globals __DEV__ */
import Phaser from 'phaser'

export default class extends Phaser.State {
  constructor () {
    super()
    this.style = {
      font: 'Raleway'
    }
    this.score = 0
    this.gameInPlay = false
    this.endGame = false
    this.getNewStartTime = true
    this.gameOver = false
    this.direction = 'down'
    this.gameStartText = this.gameStartText
    this.playerSize = 14
    this.touchableTiles = []
    this.specialTouchableTiles = []
    this.tile = {
      width: 45,
      height: 45
    }
    this.objects = {
      layer: 'otee-objects-layer',
      spritesheet: 'objects'
    }
    this.panel = {
      bgCol: 0xffd670,
      textCol: 0x2D3A44
    }
    this.overlay = {
      bgColHex: '#8777f9',
      bgCol: 0x8777f9,
      textCol: '#ffffff'
    }
    this.playerColor = {
      current: 0x8777f9,
      default: 0x8777f9,
      slow: 0xFF0000,
      fast: 0xFFFFFF,
      trail: 0xDDDDDD
    }
    this.playerStart = {
      x: 198,
      y: 50,
      inPosition: false,
      lives: 3
    }
    this.gameRules = {
      gameSpeed: 1,
      heroSpeedDefault: 160,
      heroSpeedFast: 200,
      heroSpeedSlow: 160,
      heroSpeedCurrent: 180,
      triggerCameraHeight: 250,
      reversePlayer: false
    }
    this.bonusPoints = 0
  }

  init () {}
  preload () {
    this.load.image('blocks', 'assets/images/tiles.png')
    this.load.spritesheet('objects', 'assets/images/objects.png', 25, 25)
    this.load.tilemap('map1', 'assets/data/otee-map-1.json', null, Phaser.Tilemap.TILED_JSON)
  }

  // Walls
  wallBuilder () {
    this.tileMap = this.add.tilemap('map1')

    //  The first parameter is the tileset name, as specified in the Tiled map editor (and in the tilemap json file)
    //  The second parameter maps this name to the Phaser.Cache key 'blocks'
    this.tileMap.addTilesetImage('otee-tileset', 'blocks')
    this.tileMap.addTilesetImage('otee-objects', 'objects')

    //  Creates a layer from the JSON layer in the map data.
    //  A Layer is effectively like a Phaser.Sprite, so is added to the display list.
    this.mapLayer = this.tileMap.createLayer('otee-tile-layer')

    this.objectsGroup = this.add.physicsGroup()

    // See handleTileCollision
    // this.tileMap.setTileIndexCallback(1, this.handleTileCollision, this)
    // this.tileMap.setTileIndexCallback(2, this.handleTileCollision, this)
    // this.tileMap.setTileIndexCallback(3, this.handleTileCollision, this)
    // this.tileMap.setTileIndexCallback(4, this.handleTileCollision, this)
    // this.tileMap.setTileIndexCallback(2, this.handleTileCollision, this)
    // this.tileMap.setTileIndexCallback(6, this.reversePlayer, this)
    // this.tileMap.setTileIndexCallback(7, this.handle1Up, this)
    // this.tileMap.setTileIndexCallback(8, this.handleCheckpoint, this)

    // Collision
    this.tileMap.setCollisionByExclusion([2, 4])
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
        tileAlpha = 0.9
        break
      default:
        break
    }

    // When we hit the tile, do things only once...
    if (tile.alpha === 1) {
      this.pointInfo = this.add.text(this.player.x, this.player.y, text, { font: this.style.font, fontSize: '10px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
      // Add bonus to total
      this.bonusPoints += bonusPoints
    }

    this.pointInfo.anchor.setTo(0.5) // set anchor to middle / center
    this.pointInfo.lifespan = 400

    // Change opacity down
    tile.alpha = tileAlpha
    this.gameRules.heroSpeedCurrent = playerSpeed
    this.mapLayer.dirty = true

    // Tiles to be reset for each death go here
    if (index === 5) {
      // Add the touched tile to an array
      this.touchableTiles.push(tile)
    } else {
      // Else end of game reset tiles go here
      this.specialTouchableTiles.push(tile)
    }
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

  // Reset SPECIAL touched tiles - reset only on GAME OVER
  resetSpecialTouchableTiles () {
    // Convert alpha back to 1
    this.specialTouchableTiles.forEach((touchedTile) => {
      touchedTile.alpha = 1
    })
    // Refresh map
    this.mapLayer.dirty = true
    // Clear touched tiles array
    this.specialTouchableTiles = []
  }

  reversePlayer (sprite, tile) {
    this.gameRules.reversePlayer = true
    tile.alpha = 0.2
    // Add the touched tile to an array
    this.touchableTiles.push(tile)
  }

  handle1Up (sprite, tile) {
    // When we hit the tile, do things only once...
    if (tile.alpha === 1) {
      this.pointInfo = this.add.text(this.player.x, this.player.y, '1 UP!', { font: this.style.font, fontSize: '12px', fill: '#333', backgroundColor: '#fdd971', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
      this.pointInfo.anchor.setTo(0.5) // set anchor to middle / center
      this.playerStart.lives += 1
    }
    this.pointInfo.lifespan = 400
    tile.alpha = 0.2
    this.mapLayer.dirty = true
    // Add the SPECIAL touched tile to an array - reset only on GAME OVER
    this.specialTouchableTiles.push(tile)
  }

  handleCheckpoint (sprite, tile) {
    // When we hit the tile, do things only once...
    if (tile.alpha === 1) {
      this.pointInfo = this.add.text(this.player.x, this.player.y, 'CHECKPOINT!', { font: this.style.font, fontSize: '12px', fill: '#333', backgroundColor: '#62e79e', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
      this.pointInfo.anchor.setTo(0.5) // set anchor to middle / center
    }
    this.pointInfo.lifespan = 400
    tile.alpha = 0.2
    this.mapLayer.dirty = true

    this.playerStart.x = (tile.worldX + this.tile.width / 2) - this.playerSize / 2
    this.playerStart.y = (tile.worldY + this.tile.height / 2) - this.playerSize / 2

    // Add the SPECIAL touched tile to an array - reset only on GAME OVER
    this.specialTouchableTiles.push(tile)
  }

  // Store Hero History
  storeHeroHistory (xPos, yPos) {
    let x = xPos + (this.playerSize / 2) - 2
    let y = yPos + (this.playerSize / 2) - 2

    this.trail = this.add.graphics(0, 0)
    this.trail.beginFill(this.playerColor.trail, 1)
    this.trail.drawRect(x, y, 2, 2)
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
      this.handleLossOfLife()
    }

    this.add.tween(this.player).to({ y: 50 }, 500, Phaser.Easing.Back.Out, true, 1000)

    this.playerGroup.add(this.player)
  }

  scorePanelBuilder () {
    this.scorePanel = this.add.group()
    this.scorePanel.width = this.camera.width
    this.scorePanel.fixedToCamera = true

    let scoreBg = this.add.graphics(0, 0)
    scoreBg.beginFill(this.panel.bgCol, 1)
    scoreBg.drawRect(0, 0, this.camera.width, 30)

    // use the bitmap data as the texture for the sprite
    this.scorePanel.add(scoreBg)
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
    if (this.startPanelBG) {
      this.startPanelBG.kill()
    }
    // Only required once per loop to generate total time
    if (this.getNewStartTime) {
      this.startTime = Date.now()
    }
    this.getNewStartTime = false

    // To move player
    this.movePlayer()
    this.moveCamera()

    // Collide the player and the stars with the walls
    this.physics.arcade.collide(this.player, this.mapLayer, this.handleLossOfLife, null, this)
    // When the player hits the edge of the screen
    this.player.events.onOutOfBounds.add(this.handleLossOfLife, this)

    // If player is off screen
    if (this.player.y <= this.game.camera.y + (this.playerSize / 2)) {
      this.handleLossOfLife()
    }
  }

  handleReset () {
    if (this.endGamePanel) this.endGamePanel.kill()
    if (this.restartInfo) this.restartInfo.kill()

    this.trail.destroy()
    this.score = 0
    this.scoreText.text = `Score: ${this.score}`

    this.direction = 'down'
    this.endGame = false
    this.bonusPoints = 0
    this.gameRules.heroSpeedCurrent = this.gameRules.heroSpeedDefault
    this.gameRules.reversePlayer = false
    this.playerColor.current = this.playerColor.default
    this.resetTouchableTiles()

    // If it's game over...
    if (this.gameOver) {
      // Reset
      this.playerStart.lives = 3
      this.livesLeft.text = `Lives: ${this.playerStart.lives}`
      this.camera.y = 0
      this.playerStart.x = 198 // TODO get rid of hard-value
      this.playerStart.y = 50 // TODO get rid of hard-value
      // Reset special tiles
      this.resetSpecialTouchableTiles()
      // Put player in position
      this.readyPlayerOne()
    // Else, do things differently
    } else {
      this.player.x = this.playerStart.x
      this.player.y = this.playerStart.y
      this.camera.y = this.playerStart.y - (this.camera.height / 2 - 100)
      // Put player in position
      this.readyPlayerOne()
    }
    // Reset gameOver value (after Game over happens)
    this.gameOver = false
  }

  readyPlayerOne () {
    // Move player into start position
    this.player.x = this.playerStart.x
    this.player.y = this.playerStart.y

    // Tween player in before starting...
    let tweenPlayerIn = this.add.tween(this.player).from({y: 0}, 500, Phaser.Easing.Back.Out, true, 500)
    tweenPlayerIn.onComplete.add(() => {
      // Player needs to be in position nefore starting
      this.playerStart.inPosition = true

      if (!this.gameInPlay) {
        this.startAgainInfo()
      }
    })
  }

  handleLossOfLife () {
    this.playerStart.lives -= 1
    this.endGame = true
    this.direction = null
    this.gameInPlay = false
    this.playerStart.inPosition = false

    this.livesLeft.text = `Lives: ${this.playerStart.lives}`

    this.playerInfo = this.add.text(this.player.x + 7, this.player.y - 15, 'OUCH', { font: this.style.font, fontSize: '10px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.playerInfo.anchor.setTo(0.5) // set anchor to middle / center
    // Kill off after this time...
    this.playerInfo.lifespan = 1000

    //  Reset the players velocity (keyboardEvents)
    this.player.body.velocity.x = 0
    this.player.body.velocity.y = 0

    //  You can set your own intensity and duration
    this.camera.shake(0.01, 500)

    // Restart info
    this.restartInfo = this.add.text(this.centerX, this.centerY, 'ENTER TO RESTART', { font: this.style.font, fontSize: '20px', fill: this.overlay.textCol, backgroundColor: this.overlay.bgColHex, align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.restartInfo.anchor.setTo(0.5) // set anchor to middle / center
    this.restartInfo.fixedToCamera = true

    if (this.playerStart.lives === 0) {
      this.handleGameOver()
    }
  }

  handleGameOver () {
    this.gameOver = true
    this.restartInfo.kill()

    // Create Group for Info
    this.endGamePanel = this.add.group()
    this.endGamePanel.alpha = 0
    this.endGamePanel.width = this.camera.width - 30
    this.endGamePanel.fixedToCamera = true

    this.endGameBG = this.add.graphics(0, 0)
    this.endGameBG.beginFill(this.playerColor.current, 1)
    this.endGameBG.drawRect(35, (this.camera.height / 2) - 85, this.camera.width - 80, 170)
    this.endGameBG.anchor.set(0.5, 0.5)

    // use the bitmap data as the texture for the sprite
    this.endGamePanel.add(this.endGameBG)

    // Get play time
    this.totalTime = this.msToTime(Date.now() - this.startTime)
    this.getNewStartTime = true

    // Game over text
    this.gameOverInfo = this.add.text(this.centerX, this.centerY - 40, 'GAME OVER', { font: this.style.font, fontSize: '25px', fill: '#FFF', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.gameOverInfo.anchor.setTo(0.5) // set anchor to middle / center
    // Score
    this.scoreInfo = this.add.text(this.centerX, this.centerY - 5, `Score: ${this.score} `, { font: this.style.font, fontSize: '15px', fill: '#FFF', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.scoreInfo.anchor.setTo(0.5) // set anchor to middle / center
    // Time
    this.totalTimeInfo = this.add.text(this.centerX, this.centerY + 22, `Time: ${this.totalTime} `, { font: this.style.font, fontSize: '15px', fill: '#FFF', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.totalTimeInfo.anchor.setTo(0.5) // set anchor to middle / center
    // Restart info
    this.restartInfo = this.add.text(this.centerX, this.centerY + 50, 'Press ENTER to reset', { font: this.style.font, backgroundColor: 'rgba(0, 0, 0, 0.2)', fontSize: '12px', fill: '#FFF', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.restartInfo.anchor.setTo(0.5) // set anchor to middle / center
    // Add text to group
    this.endGamePanel.add(this.scoreInfo)
    this.endGamePanel.add(this.totalTimeInfo)
    this.endGamePanel.add(this.gameOverInfo)
    this.endGamePanel.add(this.restartInfo)

    this.add.tween(this.endGamePanel).to({alpha: 1}, 250, 'Linear', true)

    this.setHighScore()
  }

  msToTime (ms) {
    let dt = new Date(ms)
    let mins = dt.getMinutes()
    let secs = parseInt(dt.getSeconds(), 10)
    let millis = parseInt(dt.getMilliseconds(), 10)

    let tm = `${mins ? mins + 'm ' : ''}${secs}.${Math.ceil(millis / 100)}s`
    return tm
  }

  startAgainInfo () {
    this.startPanelBG = this.add.graphics(this.centerX, this.centerY)
    this.startPanelBG.beginFill(this.overlay.bgCol, 1)
    this.startPanelBG.drawCircle(0, 0, 170)
    this.startPanelBG.world.x = this.centerX
    this.startPanelBG.world.y = this.centerY
    this.startPanelBG.fixedToCamera = true
    this.startPanelBG.anchor.set(0.5)
    this.startPanelBG.alpha = 1
    this.startPanelBG.scale.x = 1
    this.startPanelBG.scale.y = 1

    this.startInfo = this.add.text(0, 5, 'SPACEBAR TO START', { font: this.style.font, fontSize: '15px', fill: this.overlay.textCol, align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.startInfo.anchor.setTo(0.5) // set anchor to middle / center

    this.startPanelBG.addChild(this.startInfo)

    this.score = 0
    let startTween1 = this.add.tween(this.startPanelBG).from({ alpha: 0 }, 1000, 'Linear')
    let startTween2 = this.add.tween(this.startPanelBG.scale).to({ x: 1.05, y: 1.05 }, 500, Phaser.Easing.Circular.InOut, 500, 1000).yoyo(true).loop(true)

    startTween1.chain(startTween2)
    startTween1.start()
  }

  // Create Bonus 2 items from map objects
  bonus1Builder () {
    this.bonus1Group = this.add.physicsGroup()
    // name, gid, key, frame, exists, autoCull, group, CustomClass, adjustY
    this.tileMap.createFromObjects(this.objects.layer, 'bonus1', this.objects.spritesheet, 0, true, false, this.bonus1Group)

    this.bonus1Group.forEach((item) => {
      item.body.immovable = true
    })
  }

  // Create Bonus 2 items from map objects
  bonus2Builder () {
    this.bonus2Group = this.add.physicsGroup()

    // name, gid, key, frame, exists, autoCull, group, CustomClass, adjustY
    this.tileMap.createFromObjects(this.objects.layer, 'bonus2', this.objects.spritesheet, 3, true, false, this.bonus2Group)

    this.bonus2Group.forEach((item) => {
      item.body.immovable = true
    })
  }

  updateScore () {
    this.score = Math.floor(this.player.y - this.playerStart.y) + this.bonusPoints
    this.scoreText.text = `SCORE: ${this.score}`
    this.livesLeft.text = `LIVES: ${this.playerStart.lives}`
    this.highScoreText.text = `HIGH: ${localStorage.highScore || 0}`
  }

  scoreText () {
    this.scoreText = this.add.text(10, 8, 'SCORE: 0', {font: this.style.font, fontSize: '12px', fill: this.panel.textCol})
    this.livesLeft = this.add.text(178, 8, `LIVES: ${this.playerStart.lives}`, {font: this.style.font, fontSize: '12px', fill: this.panel.textCol, align: 'center', boundsAlignH: 'center'})
    this.highScoreText = this.add.text(0, 8, `HIGH: ${localStorage.highScore || 0}`, { font: this.style.font, fontSize: '12px', fill: this.panel.textCol, align: 'right', boundsAlignH: 'right', wordWrapWidth: 20 })
    this.highScoreText.setTextBounds(0, 0, this.camera.width - 10, 0)

    this.scorePanel.add(this.scoreText)
    this.scorePanel.add(this.livesLeft)
    this.scorePanel.add(this.highScoreText)
  }

  setHighScore () {
    this.startTime = 0
    // Set a hightScore localStorage variable if it hasn't already been set
    if (localStorage.getItem('highScore') === null) {
      localStorage.setItem('highScore', this.score)
    // If the new score is greater than the previous high score, store it
    } else if (this.score > localStorage.getItem('highScore')) {
      localStorage.setItem('highScore', this.score)
      this.highScore = localStorage.highScore
      this.highScoreText.text = `HIGH: ${this.highScore}`
    }
  }

  // CREATE THE THINGS
  create () {
    //  We're going to be using physics, so enable the Arcade Physics system
    this.physics.startSystem(Phaser.Physics.ARCADE)

    this.centerX = this.camera.width / 2
    this.centerY = this.camera.height / 2

    this.wallBuilder()
    this.goalInfo = this.add.text(130, 120, 'REACH THE CHECKPOINT', { font: this.style.font, fontSize: '12px', fill: 'rgba(0, 0, 0, 0.25)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.playerGroup = this.add.group()
    this.playerBuilder()
    this.tunnelGroup = this.add.group()
    //this.tileMap.createFromTiles(2, 2, null, this.mapLayer, this.tunnelGroup)

    this.bonus1Builder()
    this.bonus2Builder()
    this.scorePanelBuilder()
    this.scoreText()
    this.readyPlayerOne()
  }

  update () {
    this.spacebar = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    this.enter = this.input.keyboard.addKey(Phaser.Keyboard.ENTER)
    this.enterNumpad = this.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_ENTER)

    // If we're not already playing, and not in the game over phase, and the player is in position, and the spacebar is pressed... *phew*
    if (!this.gameInPlay && !this.endGame && this.playerStart.inPosition && this.spacebar.isDown) {
      this.gameInPlay = true
    }

    // Only update score if player is in position
    if (this.player.y >= this.playerStart.y + 5) {
      this.updateScore()
    }

    if (this.gameInPlay) {
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
