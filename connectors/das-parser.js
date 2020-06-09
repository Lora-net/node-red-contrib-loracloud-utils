/*!
* \file      das-parser.js
*
* \brief     Node-Red node for to convert output of DAS to downlink
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

    function DasParser(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg, send, done) {
            var lora_packet = require("lora-packet");

            // Backward compatibity with Node-Red 0.x
            send = send || function() { node.send.apply(node,arguments) }

            try {
                var payload_in = (JSON.parse(msg.payload));
            } catch {
                errCompat(node, msg, done, "Unable to parse input as JSON string");
                return null;
            }

            
            for (const eui in payload_in.result) {
                // Handle error, if any
                var payload = payload_in.result[eui];
                if (typeof payload.error !== "undefined") {
                    var msg_error = {
                        payload: payload.error,
                        topic: msg.topic
                    }
                    this.send([null, null, null, null, msg_error]);
                    return;
                }

                // Handle results
                var result = payload.result;
                var payload_data = {
                    "info_fields": result.info_fields,
                    "fulfilled_requests": result.fulfilled_requests,
                    "log_messages": result.log_messages,
                    "pending_requests": result.pending_requests,
                }
                
                var msg_file = null;
                if (result.file !== null) {
                    msg_file = {
                        "topic": msg.topic,
                        "payload": result.file,
                        "uplink": msg.uplink,
                    }
                }

                var msg_stream = null;
                if ((result.stream_records !== null) && (result.stream_records.length > 0)) {
                    msg_stream = {
                        "topic": msg.topic,
                        "payload": result.stream_records,
                        "uplink": msg.uplink,
                    }
                }

                var msg_downlink = null;
                if ((typeof result.dnlink != "undefined") && (result.dnlink !== null)) {
                    switch (msg.uplink.lns.name) {
                        case "ttn-v2":
                            payload = Buffer.from(result.dnlink.payload, "hex");
                            msg_downlink = {
                                "payload": {
                                    // TODO: Use port from DAS when fixed (result.dnlink.port)
                                    "port": result.dnlink.port,
                                    "confirmed": false,
                                    "payload_raw": payload.toString("base64"),
                                },
                                "uplink": msg.uplink,
                            }
                            msg_downlink.topic = `${msg.uplink.lns.context.app_id}/devices/${msg.uplink.lns.context.dev_id}/down`;
                            break;
                        case "ttn-v3":
                            payload = Buffer.from(result.dnlink.payload, "hex");
                            msg_downlink = {
                                "payload": {
                                    "downlinks": [{
                                        // TODO: Use port from DAS when fixed (result.dnlink.port)
                                        "f_port": result.dnlink.port,
                                        "frm_payload": payload.toString("base64"),
                                        "priority": "NORMAL"
                                    }]
                                },
                                "uplink": msg.uplink,
                            }
                            // ApplicationId is not guaranted to be user's applicationId topic for TTI hosted
                            // instances, instead it is applicationId@instance, so get if from MQTT topic
                            const application_id = msg.topic.split("/")[1];
                            const device_id = msg.uplink.lns.context.end_device_ids.device_id;
                            msg_downlink.topic = `v3/${application_id}/devices/${device_id}/down/push`;
                            break;
                        case "actility":
                            payload = Buffer.from(result.dnlink.payload, "hex");

                            // Encode downlink
                            var packet = lora_packet.fromFields({
                                    MType: 'Unconfirmed Data Down',
                                    DevAddr: new Buffer(msg.uplink.dev_addr, 'hex'), // big-endian
                                    FCtrl: {
                                        ADR: false,
                                        ACK: false,
                                        ADRACKReq: false,
                                        FPending: false,
                                    },
                                    FCnt: parseInt(msg.uplink.lns.context.FCntDn, 10), // can supply a buffer or a number
                                    payload: new Buffer(payload, 'hex'),
                                }
                                , new Buffer(msg.uplink.appSKey, 'hex') // AppSKey
                                , new Buffer("00000000000000000000000000000000", 'hex') // NwkSKey
                            );
                            const payload_encoded = packet.getBuffers().FRMPayload.toString('hex').toUpperCase();

                            var date_validity = new Date();
                            date_validity.setDate(date_validity.getDate() + 15);
                            msg_downlink = {
                                "payload": {
                                    "DevEUI_downlink": {
                                        "Time": (new Date()).toISOString(),
                                        "DevEUI": msg.uplink.devEui,
                                        // TODO: Use port from DAS when fixed (result.dnlink.port)
                                        "FPort": result.dnlink.port.toString(),
                                        "payload_hex": payload_encoded,
                                        "Confirmed": "0",
                                        "ValidityTime": date_validity.toISOString(),
                                        "FlushDownlinkQueue": "1",
                                    }
                                },
                                "uplink": msg.uplink,
                            }
                            msg_downlink.topic = `${msg.topic.slice(0, msg.topic.length-3)}/DL`;
                            break;
                        default:
                            errCompat(node, msg, done, `Unable to generate downlink: LNS "${msg.uplink.lns.name}" not known`);
                            break;
                    }
                }
            }

            msg.payload = payload_data;
            
            this.send([msg, msg_file, msg_stream, msg_downlink, null]);
        });

        node.on("close", function() {
        });
    }

    RED.nodes.registerType("loracloud-utils-connectors-das-parser", DasParser);
};