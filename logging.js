var winston = require('winston')
var WinstonFirebase = require('./logging.winston.firebase')

module.exports = class Logger {
    constructor(opts) {

        // initialize winston (logger)
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.simple(),
            transports: [
                new winston.transports.Console()
            ]
        });

        // log to disk when not in production mode
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.File({ filename: 'logs/pi.output.log' }));
        }
    }

    // add firebase logger if asked
    enableFirebase(db, path) {
        // this.logger.add(new WinstonFirebase({ db: db, path:path }))
    }

    log(msg) {
        this.logger.info(msg);
    }
}