/*!
* \file      ttn-v2-in.js
*
* \brief     Node-Red node for TTN v2 payload parsing
*
* Revised BSD License
* Copyright Semtech Corporation 2020. All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*     * Redistributions of source code must retain the above copyright
*       notice, this list of conditions and the following disclaimer.
*     * Redistributions in binary form must reproduce the above copyright
*       notice, this list of conditions and the following disclaimer in the
*       documentation and/or other materials provided with the distribution.
*     * Neither the name of the Semtech corporation nor the
*       names of its contributors may be used to endorse or promote products
*       derived from this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
* ARE DISCLAIMED. IN NO EVENT SHALL SEMTECH S.A. BE LIABLE FOR ANY DIRECT,
* INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
* LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
* ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
* SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

module.exports = function(RED) {
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

    function ttnV2In(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg, send, done) {
            // Backward compatibity with Node-Red 0.x
            send = send || function() { node.send.apply(node,arguments) }
            var msg_das = null;

            try {
                var payload_in = (JSON.parse(msg.payload));
            } catch {
                errCompat(node, msg, done, "Unable to parse input as JSON string");
                return null;
            }

            switch (msg.topic.split("/").pop()) {
                case "activations":     // JoinReq
                    if (typeof payload_in.dev_eui === "undefined") {
                        errCompat(node, msg, done, 'Unable to find "dev_eui" key. Payload not from TTN v2 ?');
                        return null;
                    }

                    msg_das = {
                        "payload": {
                            [payload_in.dev_eui.match( /.{1,2}/g ).join( '-' )]: {
                                "msgtype":   "joining",
                                "timestamp": parseInt(new Date(payload_in.metadata.time).getTime())/1000,
                            }
                        },
                        "topic": msg.topic,
                    };
                    msg = null;
                    break;

                case "up":             // Uplink
                    if (typeof payload_in.hardware_serial === "undefined") {
                        errCompat(node, msg, done, 'Unable to find "hardware_serial" key. Payload not from TTN v2 ?');
                        return null;
                    }

                    var spreading_factor = parseInt(payload_in.metadata.data_rate
                        .split("SF")[1].split("BW")[0], 10
                    );
                    var bandwith_hz = parseInt(payload_in.metadata.data_rate
                        .split("SF")[1].split("BW")[1], 10
                    ) * 1e3;
                    msg.uplink = {
                        "devEui": payload_in.hardware_serial,
                        "port": parseInt(payload_in.port, 10),
                        "f_counter": payload_in.counter,
                        "rx_timestamp": new Date(payload_in.metadata.time),
                        "frequency_hz": payload_in.metadata.frequency*1e6,
                        "spreading_factor": spreading_factor,
                        "bandwith_hz": bandwith_hz,
                        "airtime": payload_in.metadata.airtime,
                        "lns": {
                            "name": "ttn-v2",
                            "context": payload_in,
                        },
                        "payload_hex": new Buffer.from(payload_in.payload_raw || "", "base64").toString("hex"),
                        "payload_bytes": new Buffer.from(payload_in.payload_raw || "", "base64"),
                    };
                    msg.payload = new Buffer.from(payload_in.payload_raw || "", "base64").toString("hex");
                    
                    var devEui_das_format = msg.uplink.devEui.match( /.{1,2}/g ).join( '-' )
                    var request = {
                      [devEui_das_format]: {
                          "dn_mtu": 51,
                          "fcnt":      msg.uplink.f_counter,        // Required, frame counter
                          "payload":   "",
                          "timestamp": parseInt(msg.uplink.rx_timestamp.getTime())/1000,    // Required, timestamp, UTC, float
                        }
                    };

                    if (typeof msg.uplink.frequency !== 'undefined') {
                        request[devEui_das_format].freq = msg.uplink.frequency;
                    }
                    if (typeof msg.uplink.datarate !== 'undefined') {
                        request[devEui_das_format].dr = msg.uplink.datarate;
                    }

                    if (parseInt(config.port) === msg.uplink.port) {
                        request[devEui_das_format].payload = msg.payload || "";
                        request[devEui_das_format].msgtype = "modem";
                    } else {
                        request[devEui_das_format].msgtype = "updf";
                        request[devEui_das_format].port = msg.uplink.port;
                    }
                    
                    msg_das = {
                        "payload": JSON.stringify(request),
                        "topic": msg.topic,
                        "uplink": msg.uplink,
                    }
                    
                    break;
                default:
                    // Nothing to do in case of useless message (downlink, etc...)
                    break;
            }
            this.send([msg, msg_das]);
            return null;
        });

        node.on("close", function() {
        });
    }

    RED.nodes.registerType("loracloud-utils-connectors-ttn-v2-in", ttnV2In);
};