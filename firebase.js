let firebase = require('firebase')

module.exports = class Firebase {
    constructor(opts) {

        // init firebase
        //let config = { databaseURL: "https://exitpuzzles-admin-dev.firebaseio.com" }
        let config = { databaseURL: "https://exitpuzzles-admin.firebaseio.com" }
        this.db = firebase.initializeApp(config).database()
    }
}