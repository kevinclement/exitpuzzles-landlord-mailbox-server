## Testing 

### View devices and volumes
```amixer```

### Test device
```speaker-test -D hw -c 0 -twav -s 1```

## Make a new soft device
### sudo nano /etc/asound.conf
```
pcm.softvol {
    type            softvol
    slave {
        pcm         "hw"
    }
    control {
        name        "SoftMaster"
        card        0
    }
}
```

## Control volume

### Set primary volume to 88%
```amixer sset PCM 88%```

### Set volume of soft to 80%
```amixer -D softvol -c 0 sset SoftMaster 80%```

## Playback

### normal 
``` aplay audio/coin.wav ```

### soft
``` aplay -D softvol audio/coin.wav ```
