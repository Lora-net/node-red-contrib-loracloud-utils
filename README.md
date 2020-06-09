# Description
This package is a collection of nodes for [Node-RED](https://nodered.org/)
which helps connection to [LoRa Cloud](https://www.loracloud.com/).  An example
is included to demonstrate a LoRaWAN application server working with
[Semtech](https://www.semtech.com/) modems.

Provided nodes are:
* LoRa Network servers connectors, formating payload from LNS for LoRa Cloud
  Device & Application services. Compatible with
   * TTN (V2, V3)
   * Actility Thingspark
* LoRa Cloud Device & Application services parser.

# Development installation
```
npm install --only=dev
```

# Test
```
npm test
```

# Install in local Node-RED
```
npm install /path/to/cloned/repository/node-red-contrib-loracloud-utils
```