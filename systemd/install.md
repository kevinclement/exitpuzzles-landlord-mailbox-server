### Auto start node app
```
sudo cp exitpuzzles.mailbox.service /etc/systemd/system/

# install service
sudo systemctl enable exitpuzzles.mailbox.service

# start service
sudo systemctl start exitpuzzles.mailbox.service

# to check status
sudo systemctl status exitpuzzles.mailbox.service

```

Afterwards, should be able to 'shutdown -r now' and see it come online with ssh and node service

### Start/Stop to run by hand
```
sudo systemctl stop exitpuzzles.mailbox.service
```

### udev
#### to get udev rule info 
```sudo udevadm info /dev/ttyUSB1```

#### to restart without reboot
```sudo udevadm control --reload-rules && sudo udevadm trigger```


