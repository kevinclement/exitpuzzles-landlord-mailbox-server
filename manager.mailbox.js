let Manager = require('./manager')

module.exports = class MailboxManager extends Manager {
    constructor(opts) {
        let incoming = [];
        let handlers = {};

        let ref = opts.fb.db.ref('landlord/devices/mailbox')

        super({ 
            ...opts,
            ref: ref,
            dev:'/dev/ttyMailbox',
            baudRate: 115200,
            handlers: handlers,
            incoming:incoming,
        })

        // setup supported commands
        handlers['mailbox.reboot'] = (s,cb) => {
            this.write('reboot', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }

        handlers['mailbox.drop'] = (s,cb) => {
            this.write('t', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }

        // vacuum:off
        // servo:15
        // state:WAITING
        // resetButton:off

        // setup supported device output parsing
        incoming.push(
        {
            pattern:/.*status=(.*)/,
            match: (m) => {
                m[1].split(',').forEach((s)=> {
                    let p = s.split(/:(.+)/);
                    switch(p[0]) {

                        case "solved": 
                            this.solved = (p[1] === 'true')
                            break
                    }
                })

                ref.child('info/build').update({
                    version: this.version,
                    date: this.buildDate,
                    gitDate: this.gitDate
                })

                ref.update({
                    solved: this.solved,
                })
            }
        });

        this.audio = opts.audio

        this.solved = false

        this.version = "unknown"
        this.gitDate = "unknown"
        this.buildDate = "unknown"

        // now connect to serial
        this.connect()
    }

    play(fName, cb) {
        this.audio.play(fName, (err) => {
            if (cb) {
                cb()
            }
        })
    }

    allSolved() {
        this.logger.log(this.logPrefix + 'all solved, playing sound...')

        this.play("mail-end.wav", () => {
            this.logger.log(this.logPrefix + 'audio finished.')
        })
    }
}
