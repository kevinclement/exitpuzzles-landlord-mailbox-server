const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

module.exports = class SerialDirect {
    constructor(opts) {
        this.logger = opts.logger;
        this.outputCallback = undefined;
        this.logPrefix = 'direct: ' + opts.name + ': ';
        this.connectTimeout = opts.connectTimeout ? opts.connectTimeout : 500;

        this.open = false;
        this.connectionStartTime = null;
        this.onLine = this.onLine.bind(this);
        this.buffer = new (require('./buffer'))(this.onLine);

        this.port = new SerialPort(opts.dev, { baudRate:opts.baudRate });
        this.parser = new Readline({ delimiter: '\r\n' })
        this.dataReceived = this.dataReceived.bind(this);
        this.port.on('data', this.dataReceived);
        this.port.pipe(this.parser);
    }

    dataReceived(d) {
        var textChunk = d.toString('utf8');
        this.buffer.onData(textChunk);
    }

    connect(cb) {
        this.connectionStartTime = new Date();
        this.buffer.reset();
        
        setTimeout(() => {
            this.logger.log(this.logPrefix + 'Connected.');
            this.open = true;
            this.connectionStartTime = null;
            if (cb) cb();
        }, this.connectTimeout)
    }

    setOutputCallback(cb) {
        this.outputCallback = cb;
    }

    isConnecting() {
        if (!this.connectionStartTime) return false;

        return true;
    }

    isOpen() {
        return this.open;
    }

    onLine(line) {
        this.logger.log(this.logPrefix + '< ' + line);
        if (this.outputCallback) {
            this.outputCallback(line);
        }
    }

    write(msg, cb) {
        if (!this.isOpen()) {
            this.logger.logger.error(this.logPrefix + 'Trying to write to device but not yet connected.');
        }

        this.logger.log(this.logPrefix + '> ' + msg);

        this.port.write(msg + '\n')

        // fake it
        setTimeout(() => {
            if (cb) cb();
        }, 100);
    }

    log(msg) {
        this.logger.log(this.logPrefix + msg);
    }

    inquire() {
    }
}


