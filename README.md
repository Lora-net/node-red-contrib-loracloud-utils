# Description
This package is a collection of nodes for [Node-RED](https://nodered.org/)
which helps connection to [LoRa Cloud](https://www.loracloud.com/).  An example
is included to demonstrate a LoRaWAN application server working with
[Semtech](https://www.semtech.com/) modems.

Detailed instructions are provided on
[online documentation](https://lora-developers.semtech.com/resources/tools/lora-basics/lora-basics-for-end-nodes/developer-walk-through/).

Provided nodes are:
* LoRa Network servers connectors, formatting payload from LNS for LoRa Cloud
  Device & Application services. Compatible with
   * TTN (V2, V3)
* Modem & Geolocation Services parser.

This has been developed with Node v12.14.1

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

# Security note
Node-RED has issued the security advisory [CVE-2021-21297](https://github.com/advisories/GHSA-xp9c-82x8-7f67). In result `node-red-contrib-loracloud-utils` has been updated in `v1.2.2` to set Node-RED minimal version to `v1.2.8`, which fix it. Please update your Node-RED installation.
