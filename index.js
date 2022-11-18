let fb = new (require('./firebase'))
let logger = new (require('./logging'))
let audio = new (require('./audio'))({ logger: logger })

let managers = [];
// managers.push(new (require('./manager.coin'))({ name: 'zoltar', logger: logger, fb: fb, audio: audio }))
// managers.push(new (require('./manager.hands'))({ name: 'hands', logger: logger, fb: fb }))

// might want to turn this off while doing dev, so I have a flag for it
let ENABLE_FIREBASE_LOGS = true;
if (ENABLE_FIREBASE_LOGS) {
    logger.enableFirebase(fb.db, 'landlord/logs/mailbox');
}

logger.log('mailbox: Started ExitPuzzles Mailbox server.');

// track firebase connect and disconnects and log them so we can see how often it happens
let _connecting = true;
fb.db.ref('.info/connected').on('value', function(connectedSnap) {
  if (connectedSnap.val() === true) {
    logger.log('mailbox: firebase connected.');
  } else {
    // dont print an error while its still connecting on first start
    if (_connecting) {
      _connecting = false;
    } else {
      logger.log('mailbox: firebase dropped connection!');
    }
  }
});

// listen for control operations in the db, filter only ops not completed
fb.db.ref('landlord/operations').orderByChild('completed').equalTo(null).on("child_added", function(snapshot) {
    logger.log('mailbox: received op ' + snapshot.val().command);

    managers.forEach((m) => {
        m.handle(snapshot);
    });
 });

// update started time and set a ping timer
fb.db.ref('landlord/status/mailbox').update({
    started: (new Date()).toLocaleString(),
    ping: (new Date()).toLocaleString()
})

// heartbeat timer
setInterval(()  => {
    fb.db.ref('landlord/status/mailbox').update({
      ping: (new Date()).toLocaleString()
    })
}, 30000)
