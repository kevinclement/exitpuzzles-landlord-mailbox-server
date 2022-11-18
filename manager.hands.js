let Manager = require('./manager')

module.exports = class HandsManager extends Manager {
    constructor(opts) {
        let incoming = [];
        let handlers = {};

        let ref = opts.fb.db.ref('museum/devices/hands')

        super({ 
            ...opts,
            ref: ref,
            dev:'/dev/ttyHANDS',
            baudRate: 9600,
            handlers: handlers,
            incoming:incoming,
        })

        // setup supported commands
        handlers['hands.reboot'] = (s,cb) => { 
            this.write('reboot');
            cb();
        }
        
        handlers['hands.toggle'] = (s,cb) => { 
            this.toggle = !this.toggle

            // optimistic update to db, so it doesn't flip back and forth
            ref.update({ toggle: this.toggle })
            cb();
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

                        case "touching": 
                            this.touching = (p[1] === 'true')
                            break
                        case "mock": 
                            this.toggle = (p[1] === 'true')
                            break
                    }
                })

                ref.child('info/build').update({
                    version: this.version,
                    date: this.buildDate,
                    gitDate: this.gitDate
                })

                ref.update({
                    touching: this.touching,
                    toggle: this.toggle
                })
            }
        });

        this.version = "unknown"
        this.gitDate = "unknown"
        this.buildDate = "unknown"

        this.touching = false
        this.toggle = false

        // now connect to serial
        this.connect()
    }
}