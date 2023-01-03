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

        // ask for status once we connect
        this.on('connected', () => {
            this.write('status')
        });

        // setup supported commands
        handlers['mailbox.reset']  = (s,cb) => { this.write('reset',  err => { if (err) { s.ref.update({ 'error': err }); } cb() }); }
        handlers['mailbox.drop']   = (s,cb) => { this.write('drop',   err => { if (err) { s.ref.update({ 'error': err }); } cb() }); }

        // setup supported device output parsing
        incoming.push(
        {
            pattern:/.*status=(.*)/,
            match: (m) => {
                m[1].split(',').forEach((s)=> {
                    let p = s.split(/:(.+)/);
                    switch(p[0]) {

                        case "state": 
                            let _state = p[1]
                            if (_state == "DONE" && !this.state != "DONE") {
                                this.allSolved()
                            }
                            this.state = _state
                            break
                        case "vacuum":
                            this.vacuum = (p[1] === 'on')
                            break
                    }
                })

                ref.child('info/build').update({
                    version: this.version,
                    date: this.buildDate,
                    gitDate: this.gitDate
                })

                ref.update({
                    state: this.state,
                    vacuum: this.vacuum,
                })
            }
        });

        this.audio = opts.audio

        this.state = "UNKNOWN"
        this.vacuum = false

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

        this.play("custom-mail-end-loudness.wav", () => {
            this.logger.log(this.logPrefix + 'audio finished.')
        })
    }
}
