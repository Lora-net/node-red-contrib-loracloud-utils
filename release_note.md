# v1.6.2 25/04/2022

Changes:
- Remove Actility connector
- Update modem and modem-E example for new LoRa Cloud services
- Update modem and modem-E example to set the LoRaCloud Geolocation URL and token
- Rename LoRa Cloud Devices & Application Services
- License to clear BSD

Fixes:
- Fix typos

# v1.4.0 02/09/2021
Changes:
- Update Modem-E example TLV parser to add sensors and new Wi-Fi format parsing
- Update minimum version of glob-parent, ws and path-parse

Fixes:
- Fix typos in downlink generator files

# v1.3.0 29/06/2021
Changes:
- Update minimum version of hosted-git-info, lodash and y18n following security advisories:
    - https://github.com/advisories/GHSA-43f8-2h32-f4cj
    - https://github.com/advisories/GHSA-35jh-r3h4-6jhm
    - https://github.com/advisories/GHSA-c4w7-xm78-47vh
- Add Network Server storage

Fixes:
- Fix naming for LoRa Cloud Device & Application Services

# v1.2.2 03/04/2021
Fixes:
- Update Node-RED minimum version to ensure https://github.com/advisories/GHSA-xp9c-82x8-7f67 fix

# v1.2.1 - 15/01/2021
Fixes:
- Fix bad Wi-Fi Json connection in modem-e example

# v1.2.0 - 16/10/2020
Changes:
- Add *Downlink Generator* that is in charge of the construction of downlink depending on LNS. It indeed remove this charge from *DAS Parser*
- Modify example to propagate response from DAS geolocation calls to *DAS Parser*
- Add GNSS multi-frame support and new world map

# v1.1.1 - 18/09/2020
Fixes:
- Fix v1.1.0 release notes

# v1.1.0 - 18/09/2020
Changes:
- Actility LNS update (automatically work with encrypted/decrypted payload, parse uplink messages)
- Readme update
- Add LoRa Basics Modem-E example
- Specify downlink MTU when calling DAS
- Modify TLV parser to add sensors and new Wi-Fi format

Fixes:
- Fix default DM port

# v1.0.2 - 10/06/2020
Changes:
- Update organization in NPM package name
- Rename LoRa Cloud Devices & Application Services

# v1.0.1 - 10/06/2020
Changes:
- Rename the *Force port to downlink GNSS assisted position*
- License update

Fixes:
- Fix bug with Wi-Fi http request output that is not converted to JSON

# v1.0.0 - 06/06/2020
Initial release
