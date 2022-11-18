module.exports = class Buffer {
    constructor(onLineCallback) {
        this.onLineCallback = onLineCallback
        this.dataBuffer = ''
        this.onData = this.onData.bind(this);
    }

    reset() {
        this.dataBuffer = ''
    }

    onData(buffer) {
        this.dataBuffer = this.dataBuffer + buffer.toString('utf-8');

        // only callback once we get a newline
        if(this.dataBuffer.indexOf("\r\n") != -1){
            let lines = this.dataBuffer.split('\r\n')
            for(var i=0; i < lines.length; i++) {
                if (i < lines.length - 1) {
                    this.onLineCallback(lines[i])
                } else {
                    // save the last split to be combined with next data set when it arrives
                    this.dataBuffer = lines[i]
                }
            }
        }
    }
}