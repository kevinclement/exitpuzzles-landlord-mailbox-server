module.exports = class Manager {
    constructor(opts) {
        this.logger = opts.logger
        this.bt = opts.bt
        this.bluetoothEnabled = opts.bt != null
        this.fb = opts.fb
        this.handlers = opts.handlers
        this.incoming = opts.incoming
        this.name = opts.name
        this.logPrefix = 'handler: ' + opts.name + ': '
        this.created = (new Date()).getTime()

        // only run one operation at a time to reduce bluetooth craziness
        this.runningOp = null

        // queue for operations to execute
        this.operations = []

        // bind this proper for timer
        this.loop = this.loop.bind(this)
        this.output = this.output.bind(this)

        // hookup buffer line parser
        if (this.bluetoothEnabled) { 
            this.bt.setOutputCallback(this.output);
        }

        // main loop to process operations
        setInterval(this.loop, 100)
    }

    loop() {
        try {
            // check if we need to connect to bluetooth
            //   either because its the first time or because we had a timeout
            if (this.bluetoothEnabled && !this.bt.isOpen() && !this.bt.isConnecting()) {
                this.connecting();

                this.bt.connect(() => {
                    // callback for connected
                    this.connected();

                    // remove any pending operations (by design/user ask)
                    this.clearOperations()
                })
                return;
            }

            if (this.operations.length === 0 || 
                this.runningOp || 
                (this.bluetoothEnabled && this.bt.isConnecting())) return

            // this means we're connected and have operations to run
            let snapshot = this.operations.shift()
            let op = snapshot.val()

            // if the operation was in the db before we started, clear it out
            if (op.created < this.created) {
                this.cancelOperation(snapshot, 'older')
                return
            }

            Object.keys(this.handlers).forEach((hp) => {
                if (snapshot.val().command == hp) {
                  this.runningOp = snapshot
                  this.logger.log(this.logPrefix + 'handling ' + op.command + ' ...')

                  // mark it received since all handlers would need to do it
                  snapshot.ref.update({ 'received': (new Date()).toString() });

                  this.handlers[hp](snapshot, () => {
                    this.activity()
                    snapshot.ref.update({ 'completed': (new Date()).toString() });
                    this.runningOp = null;
                  })
                }
            })
        } catch(e) {
            this.logger.logger.error(this.logPrefix + 'Exception: ' + e.message);
        }
    }

    clearOperations() {
        if (this.runningOp) {
            this.cancelOperation(this.runningOp, 'running')
            this.runningOp = null
        }

        // mark all pending operations as canceled as well
        this.operations.forEach(snapshot => {
            this.cancelOperation(snapshot, 'pending')
        })
        this.operations = []
    }

    cancelOperation(snapshot, src) {
        let now = (new Date()).toString()

        this.logger.log(this.logPrefix + 'canceling ' + src + ' op \'' + snapshot.val().command + '\'.')
        snapshot.ref.update({ 'completed': now, 'canceled': now })
    }

    output(line) {
        try {
            this.activity()

            // handle the line now
            let lineHandled = false

            this.incoming.forEach(p => {
                let match = p.pattern.exec(line)
                if (match) {
                    p.match(match)
                    lineHandled = true;
                }
            })

            if (!lineHandled && process.env.DEBUG) {
                this.logger.log(this.logPrefix + 'WARN: no handler processed line \'' + line + '\' ...')
            }
        } catch(e) {
            this.logger.logger.error(this.logPrefix + 'Exception during ouput: ' + e.message);
        }
    }

    handle(snapshot) {

        // only push operations that can be handled by this manager
        Object.keys(this.handlers).forEach((hp) => {
            if (snapshot.val().command == hp) {
                this.operations.push(snapshot)
            }
        })
    }
}