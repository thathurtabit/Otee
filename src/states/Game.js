/* globals __DEV__ */
import Phaser from 'phaser'

export default class extends Phaser.State {
  constructor () {
    super()
    this.player = this.player
    this.cursors = this.cursors
    this.stars = this.stars
    this.score = 0
    this.scoreText = this.scoreText
    this.tileMap = this.tileMap
    this.mapLayer = this.mapLayer
    this.direction = null
    this.gameRules = {
      gameSpeed: 1,
      heroSpeed: 180
    }
    this.gameOverText = this.gameOverText
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

  // Handle overlap between player and object
  collectStar (player, star) {
    // Removes the star from the screen
    star.kill()

    //  Add and update the score
    this.score += 10
    this.scoreText.text = `Score: ${this.score}`

    if (this.score === 10 * 12) {
      this.scoreText.text = `You win!`
    }
  }

  // Allow the player to collect stars
  starGroup () {
    this.stars = this.add.group()

    this.stars.enableBody = true

    //  Here we'll create 12 of them evenly spaced apart
    for (let i = 0; i < 12; i++) {
      //  Create a star inside of the 'stars' group
      let star = this.stars.create(i * 70, 0, 'star')

      //  Let gravity do its thing
      star.body.gravity.y = 100

      //  This just gives each star a slightly random bounce value
      star.body.bounce.y = 0.2 + Math.random() * 0.2
    }
  }

  // Player
  playerBuilder () {
    // The player and its settings
    this.player = this.add.sprite(80, 50, 'hero')

    //  We need to enable physics on the player
    this.physics.arcade.enable(this.player)

    this.player.body.collideWorldBounds = true

    //  Our two animations, walking left and right.
    this.player.animations.add('left', [0, 1, 2, 3, 4], 0, true)
    this.player.animations.add('right', [4, 3, 2, 1, 0], 0, true)
    this.player.animations.add('up', [0, 1, 2, 3, 4], 0, true)
    this.player.animations.add('down', [4, 3, 2, 1, 0], 0, true)
  }

  // Movement events
  movementEvents () {
    this.cursors = this.input.keyboard.createCursorKeys()

    //  Reset the players velocity (movementEvents)
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
    // As long as the game is running...
    if (this.direction !== null) {
      this.camera.y += this.gameRules.gameSpeed
    }
  }

  handleGameOver () {
    this.direction = null
  }

  // CREATE THE THINGS
  create () {
    //  We're going to be using physics, so enable the Arcade Physics system
    this.physics.startSystem(Phaser.Physics.ARCADE)


    this.wallBuilder()
    this.playerBuilder()
    this.starGroup()

    this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '18px', fill: '#fff' })
    this.gameOverText = this.add.text(this.world.centerX, this.world.centerY, 'RUNNING', { fontSize: '16px', fill: '#FFF' })
    this.scoreText.fixedToCamera = true
  }

  update () {
    this.moveCamera()
    // Collide the player and the stars with the walls
    this.physics.arcade.collide(this.player, this.mapLayer, this.handleGameOver, null, this)
    // When the player hits the edge of the screen
    this.player.events.onOutOfBounds.add(this.handleGameOver, this)
    // Stars colliding with walls
    this.physics.arcade.collide(this.stars, this.mapLayer)
    // This for keyboard events
    this.physics.arcade.overlap(this.player, this.stars, this.collectStar, null, this)
    // This for keyboard events
    this.movementEvents()
    this.movePlayer()

    
  }

  render () {
    if (__DEV__) {
      //this.game.debug.cameraInfo(this.camera, 32, 32)
      //this.game.debug.spriteCoords(this.player, 32, 500)
    }
  }
}
