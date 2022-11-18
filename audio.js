const path = require('path');
var player = require('play-sound')(opts = { player: 'aplay' })

module.exports = class Audio {
    constructor(opts) {
        this.logger = opts.logger
        this.queue = []
        this.playing = false
    }

    play(files, cb, delayInMs) {

        // if more than one file to play, queue it up
        if (Array.isArray(files)) {
            for (let file of files) {
                this.queue.push(file)
            }
        } else {
            this.queue.push(files)
        }

        if (!this.playing) {
            delayInMs = delayInMs ? delayInMs : 0
            setTimeout(()=>{
                this.dequeueAndPlay(cb)
            }, delayInMs)
        } else {
            this.logger.log('audio: audio already playing, so added to queue.')
            if (cb) cb()
        }
    }

    dequeueAndPlay(cb) {
        let fileName = this.queue.shift()
        let fullFile = path.join(__dirname, 'audio', fileName); 

        let device = fileName == "coin.wav" ? "softvol" : "hw"

        this.logger.log('audio: playing \'' + fileName + '\'...')
        this.playing = true
        player.play(fullFile, { aplay: ['-D', device ] }, (err) => {
            if (err) {
                this.logger.logger.error('audio: Exception: ' + err)
            } else {
                this.logger.log('audio: played.')
            }

            this.playing = false

            if (this.queue.length > 0) {
                this.dequeueAndPlay(cb)
            } else if (cb) {
                cb()
            }
        })
    }
}