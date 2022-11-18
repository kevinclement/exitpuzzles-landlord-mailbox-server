let Manager = require('./manager')

module.exports = class CoinManager extends Manager {
    constructor(opts) {
        let incoming = [];
        let handlers = {};

        let ref = opts.fb.db.ref('museum/devices/zoltar')

        super({ 
            ...opts,
            ref: ref,
            dev:'/dev/ttyCOIN',
            baudRate: 9600,
            handlers: handlers,
            incoming:incoming,
        })
        this.forced = false
        this.printer = new (require('./printer'))({ logger: opts.logger })

        // setup supported commands
        handlers['zoltar.increment'] = (s,cb) => {
            this.forced = true
            this.write('increment', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['zoltar.decrement'] = (s,cb) => { 
            this.write('decrement', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['zoltar.reboot'] = (s,cb) => {
            this.forced = false
            this.write('reboot', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['zoltar.printFeed'] = (s,cb) => {
            this.printer.feed(cb)
        }

        // setup supported device output parsing
        incoming.push(
        {
            pattern:/.*status=(.*)/,
            match: (m) => {
                m[1].split(',').forEach((s)=> {
                    let p = s.split(/:(.+)/);
                    switch(p[0]) {
                        case "version": 
                            this.version = p[1]
                            break
                        case "gitDate": 
                            this.gitDate = p[1]
                            break 
                        case "buildDate": 
                            this.buildDate = p[1]
                            break

                        case "solved": 
                            this.solved = (p[1] === 'true')
                            break
                        case "coins": 
                            let nCoins = parseInt(p[1]);
                            if (this.coins != nCoins && this.coins < nCoins) {
                                this.coinChange()
                            }
                            this.coins = nCoins
                            break
                        case "donations": 
                            let nDonations = parseInt(p[1])
                            if (this.donations != nDonations && this.donations < nDonations) {
                                this.donationChange()
                            }
                            this.donations = nDonations
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
                    coins: this.coins,
                    donations: this.donations
                })
            }
        });

        this.audio = opts.audio

        this.solved = false
        this.version = "unknown"
        this.gitDate = "unknown"
        this.buildDate = "unknown"
        this.coins = 0
        this.donations = 0

        // now connect to serial
        this.connect()
    }

    coinChange() {
        this.logger.log(this.logPrefix + 'detected coin change...')
        var _solved = this.solved
        this.play("coin.wav", () => {
            if (_solved) {
                this.allCoins()
            }
        })
    }

    donationChange() {
        this.logger.log(this.logPrefix + 'detected donation...')
        this.play(["error.wav", "donation.wav"])
    }

    allCoins() {
        this.logger.log(this.logPrefix + 'solved.')
        this.play("solve-long.wav")

        // print after a period of time so the success can play
        setTimeout(() => {
            this.printer.print(() => {})
        },2000)
    }

    play(fName, cb) {
        this.audio.play(fName, (err) => {
            if (cb) {
                cb()
            }
        })
    }
}
