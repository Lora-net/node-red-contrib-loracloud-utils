# v1.4.0 02/09/2021

Update Modem-E example TLV parser to add sensors and new Wi-Fi format parsing
Fix typos in downlink generator files
Update minimum version of glob-parent, ws and path-parse

# v1.3.0 29/06/2021
Fix naming for LoRa Cloud Device & Application Services
Update minimum version of hosted-git-info, lodash and y18n following security advisories:
https://github.com/advisories/GHSA-43f8-2h32-f4cj
https://github.com/advisories/GHSA-35jh-r3h4-6jhm
https://github.com/advisories/GHSA-c4w7-xm78-47vh

# v1.2.2 03/04/2021
Update Node-RED minimum version to ensure https://github.com/advisories/GHSA-xp9c-82x8-7f67 fix

# v1.2.1 - 15/01/2021
Fix bad Wi-Fi Json connection in modem-e example

# v1.2.0 - 16/10/2020
Add *Downlink Generator* that is in charge of the construction of downlink depending on LNS. It indeed remove this charge from *DAS Parser*
Modify example to propagate response from DAS geolocation calls to *DAS Parser*

# v1.1.1 - 18/09/2020
Fix v1.1.0 release notes

# v1.1.0 - 18/09/2020
Actility LNS update (automatically work with encrypted/decrypted payload, parse uplink messages)
Readme update
Fix default DM port
Add LoRa Basics Modem-E example
Specify downlink MTU when calling DAS

# v1.0.2 - 10/06/2020
Update organisation in NPM package name

# v1.0.1 - 10/06/2020
License update

# v1.0.0 - 06/06/2020
Initial release
