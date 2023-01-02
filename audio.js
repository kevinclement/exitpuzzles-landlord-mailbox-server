const path = require('path');
var player = require('play-sound')(opts = { player: 'aplay' })

module.exports = class Audio {
    constructor(opts) {
        this.logger = opts.logger
    }

    play(fileName, cb) {
        this.logger.log('audio: playing \'' + fileName + '\'...')
        let fullFile = path.join(__dirname, 'audio', fileName); 

        player.play(fullFile, (err) => {
            if (err) {
                this.logger.logger.error('audio: Exception: ' + err)
            } else {
                this.logger.log('audio: played.')
            }

            if (cb) {
                cb()
            }
        })
    }
}