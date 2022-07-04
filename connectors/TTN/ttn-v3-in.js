/*!
* \file      ttn-v3-in.js
*
* \brief     Node-Red node for TTN v3 payload parsing
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

    function ttnv3In(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg, send, done) {
            // Backward compatibility with Node-Red 0.x
            send = send || function() { node.send.apply(node,arguments) }
            var msg_mgs = null;
            var msg_uplink = null;

            try {
                var payload_in = (JSON.parse(msg.payload));
            } catch {
                errCompat(node, msg, done, "Unable to parse input as JSON string");
                return null;
            }

            if (typeof payload_in.end_device_ids === "undefined") {
                errCompat(node, msg, done, 'Unable to find "end_device_ids" key. Payload not from TTN v3 ?');
                return null;
            }
            devEui_mgs_format = payload_in.end_device_ids.dev_eui.match( /.{1,2}/g ).join( '-' );
            var timestamp = new Date(payload_in.received_at)


            switch (msg.topic.split("/").pop()) {
                case "join":           // JoinReq
                    msg_mgs = {
                        "payload": {
                            "deveui":devEui_mgs_format,
                            "uplink": {
                                "msgtype":   "joining",
                                "timestamp": parseInt(timestamp.getTime())/1000,
                            }
                        },
                        "topic": msg.topic,
                    };
                    msg = null;
                    break;

                case "up":             // Uplink
                    msg_uplink = msg;
                    msg.uplink = {
                        "devEui": payload_in.end_device_ids.dev_eui,
                        "port": payload_in.uplink_message.f_port,
                        "f_counter": payload_in.uplink_message.f_cnt,
                        "rx_timestamp": timestamp,
                        "frequency_hz": payload_in.uplink_message.settings.frequency,
                        "spreading_factor": payload_in.uplink_message
                                .settings.data_rate.lora.spreading_factor,
                        "bandwidth_hz": payload_in.uplink_message
                                .settings.data_rate.lora.bandwidth,
                        // "airtime": payload_in.metadata.airtime,
                        "lns": {
                            "name": "ttn-v3",
                            "context": payload_in,
                        },
                        "payload_hex": new Buffer.from(payload_in.uplink_message.frm_payload || "", "base64").toString("hex"),
                        "payload_bytes": new Buffer.from(payload_in.uplink_message.frm_payload || "", "base64"),
                    };
                    msg.payload = new Buffer.from(payload_in.uplink_message.frm_payload || "", "base64").toString("hex");


                    var request = {
                        "deveui": devEui_mgs_format,
                        "uplink": {
                            "dn_mtu": 51,
                            "fcnt":      msg.uplink.f_counter || 0,
                            "payload":   "",
                            "timestamp": parseInt(timestamp.getTime())/1000,    // Required, timestamp, UTC, float
                        }
                    };

                    if (typeof msg.uplink.frequency !== 'undefined') {
                        request.uplink.freq = msg.uplink.frequency;
                    }

                    if (parseInt(config.port) === msg.uplink.port) {
                        request.uplink.payload = msg.payload || "";
                        request.uplink.msgtype = "modem";
                    } else {
                        request.uplink.msgtype = "updf";
                        request.uplink.port = msg.uplink.port;
                    }

                    msg_mgs = {
                        "payload": JSON.stringify(request),
                        "topic": msg.topic,
                        "uplink": msg.uplink,
                    }

                    break;
                default:
                    // Nothing to do in case of useless message (downlink, etc...)
                    break;
            }

            this.send([msg_uplink, msg_mgs]);
            return null;
        });

        node.on("close", function() {
        });
    }

    RED.nodes.registerType("loracloud-utils-connectors-ttn-v3-in", ttnv3In);
};
