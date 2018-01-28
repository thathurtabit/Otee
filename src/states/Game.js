/* globals __DEV__ */
import Phaser from 'phaser'

export default class extends Phaser.State {
  constructor () {
    super()
    this.player = this.player
    this.cursors = this.cursors
    this.stars = this.stars
    this.score = 0
    //this.highScore = localStorage.highScore || 0
    this.gameInPlay = false
    this.scoreText = this.scoreText
    this.tileMap = this.tileMap
    this.mapLayer = this.mapLayer
    this.direction = 'down'
    this.gameStartText = this.gameStartText
    this.playerStart = {
      x: 177,
      y: 10
    }
    this.gameRules = {
      gameSpeed: 1,
      heroSpeed: 180,
      rollHeight: 375
    }
  }

  init () {}
  preload () {
    this.load.tilemap('map', 'assets/data/phaser-game-tile.csv', null, Phaser.Tilemap.CSV)
    this.load.image('blocks', 'assets/images/tiles.png')
    this.load.image('star', 'assets/images/star.png')
    this.load.spritesheet('hero', 'assets/images/player.png', 15, 15)
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

    // Collision
    this.tileMap.setCollisionByExclusion([1])
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

  // Player
  playerBuilder () {
    // The player and its settings
    this.player = this.add.sprite(this.playerStart.x, this.playerStart.y, 'hero')

    //  We need to enable physics on the player
    this.physics.arcade.enable(this.player)

    this.player.body.collideWorldBounds = true
    this.player.checkWorldBounds = true

    if (this.player.inCamera === false && this.gameInPlay) {
      this.handleGameOver()
    }

    //  Our two animations, walking left and right.
    this.player.animations.add('left', [0, 1, 2, 3, 4], 0, true)
    this.player.animations.add('right', [4, 3, 2, 1, 0], 0, true)
    this.player.animations.add('up', [0, 1, 2, 3, 4], 0, true)
    this.player.animations.add('down', [4, 3, 2, 1, 0], 0, true)
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
    if (this.direction === 'left') {
      this.player.body.velocity.x -= this.gameRules.heroSpeed
      this.player.animations.play('left')
    } else if (this.direction === 'right') {
      this.player.body.velocity.x += this.gameRules.heroSpeed
      this.player.animations.play('right')
    } else if (this.direction === 'up') {
      this.player.body.velocity.y -= this.gameRules.heroSpeed
      this.player.animations.play('up')
    } else if (this.direction === 'down') {
      this.player.body.velocity.y += this.gameRules.heroSpeed
      this.player.animations.play('down')
    }
  }

  // Constantly move the camera
  moveCamera () {
    // As long as the game is running and the player has reaches a certain position...
    if (this.gameInPlay && this.player.y >= this.gameRules.rollHeight) {
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
    this.score = 0
    this.player.x = this.playerStart.x
    this.player.y = this.playerStart.y
    this.camera.y = 0
    this.direction = 'down'

    this.gameOverInfo.text = 'SPACEBAR to start'
  }

  handleGameOver () {
    this.direction = null
    this.gameInPlay = false

    //  Reset the players velocity (keyboardEvents)
    this.player.body.velocity.x = 0
    this.player.body.velocity.y = 0

    let centerX = this.camera.width / 2
    let centerY = this.camera.height / 2

    // To do, collect all this info in a group?
    this.scoreInfo = this.add.text(centerX, centerY - 50, `Score: ${this.score} `, { fontSize: '25px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.scoreInfo.anchor.setTo(0.5) // set anchor to middle / center
    this.gameOverInfo = this.add.text(centerX, centerY - 12, 'GAME OVER', { fontSize: '18px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
    this.gameOverInfo.anchor.setTo(0.5) // set anchor to middle / center
    this.restartInfo = this.add.text(centerX, centerY + 20, 'Press ENTER to reset', { fontSize: '15px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
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
    this.highScoreText.text = `High Score: ${localStorage.highScore || 0}`
  }

  startMenu () {
    let centerX = this.camera.width / 2
    let centerY = this.camera.height / 2

    if (!this.gameInPlay) {
      this.startInfo = this.add.text(centerX, centerY, 'SPACEBAR to start', { fontSize: '18px', fill: '#FFF', backgroundColor: 'rgba(0, 0, 0, 0.5)', align: 'center', boundsAlignH: 'center', boundsAlignV: 'middle' })
      this.startInfo.anchor.setTo(0.5) // set anchor to middle / center
    }
  }

  scoreText () {
    this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '12px', fill: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.2)' })
    this.scoreText.fixedToCamera = true
    this.highScoreText = this.add.text(300, 10, `High Score: ${localStorage.highScore || 0}`, { fontSize: '12px', fill: '#fff', align: 'right', backgroundColor: 'rgba(0, 0, 0, 0.2)' })
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

    // If we're not already playing and the spacebar is pressed
    if (!this.gameInPlay && this.spacebar.isDown) {
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
