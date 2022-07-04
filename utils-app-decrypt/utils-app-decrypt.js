/*!
* \file      utils-app-decrypt.js
*
* \brief     Node-Red node for payload decryption
*
 * The Clear BSD License
 * Copyright Semtech Corporation 2020. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted (subject to the limitations in the disclaimer
 * below) provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Semtech corporation nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * NO EXPRESS OR IMPLIED LICENSES TO ANY PARTY'S PATENT RIGHTS ARE GRANTED BY
 * THIS LICENSE. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
 * CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT
 * NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL SEMTECH CORPORATION BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.

*/

module.exports = function(RED) {

    var lora_packet = require("lora-packet");

    function isValid(data) {
        return (typeof data !== "undefined") && (data !== null);
    }
    function isInteger(data) {
        return (isValid(data) && (data === parseInt(data, 10)));
    };

    function isString(data) {
        return (isValid(data) && (typeof data == "string"));
    };

    function errCompat(node, msg, done, text) {
        if (done) {
            // Node-RED 1.0 compatible
            done(text);
        } else {
            // Node-RED 0.x compatible
            node.error(text, msg);
        }
    }

    function decrypt(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg, send, done) {
            // Backward compatibility with Node-Red 0.x
            send = send || function() { node.send.apply(node,arguments) }

            var payload = msg.payload || msg.uplink.payload_hex || null;
            var dev_addr = msg.uplink.dev_addr;
            var f_counter = msg.uplink.f_counter;
            var port = msg.uplink.port;
            var appSKey = msg.uplink.appSKey

            // Check input types
            if (isString(payload) == false || (payload.match(/^[a-f0-9]+$/i) === null)) {
                errCompat(node, msg, done, "'payload_hex' must be an hexadecimal string");
                return null;
            }
            if (isString(dev_addr) == false || (dev_addr.match(/^[a-f0-9]+$/i) === null)) {
                errCompat(node, msg, done, "'dev_addr' must be an hexadecimal string");
                return null;
            }
            if (isInteger(f_counter) == false) {
                errCompat(node, msg, done, "'f_counter' must be a positive integer");
                return null;
            }
            if ((isInteger(port) == false) || (port <= 0) || (port > 255)) {
                errCompat(node, msg, done, "'port' must be a positive integer in [1-255] range");
                return null;
            }
            if (isString(appSKey) == false || (appSKey.match(/^[a-f0-9]+$/i) === null)) {
                errCompat(node, msg, done, "'appSKey' must be an hexadecimal string");
                return null;
            }

            var packet_fields = {
                DevAddr: new Buffer.from(dev_addr, 'hex'),
                FCnt:    f_counter,
                FPort:   port,
                payload: new Buffer.from(payload, 'hex'),
            }

            appSKey = new Buffer.from(appSKey, 'hex');
            var packet = lora_packet.fromFields(packet_fields);
            msg.payload = lora_packet.decrypt(packet, appSKey, appSKey).toString('HEX');

            this.send(msg);
        });

        node.on("close", function() {
        });
    }

    RED.nodes.registerType("loracloud-utils-app-decrypt", decrypt);
};
