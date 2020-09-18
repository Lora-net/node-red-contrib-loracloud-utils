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

This has been developped with Node v12.14.1

# Development installation
```
npm install --only=dev
```

# Test
```
npm test
```

# Install in local Node-RED
In Node-Red installation path, enter:
```
npm install /path/to/cloned/repository/node-red-contrib-loracloud-utils
```

From Node-Red documentation:
```
In your node-red user directory, typically ~/.node-red, run:

npm install <location of node module>
```