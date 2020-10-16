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

module.exports = function (RED) {

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

        node.on('input', function (msg, send, done) {
            var lora_packet = require("lora-packet");

            // Backward compatibity with Node-Red 0.x
            send = send || function () { node.send.apply(node, arguments) }

            try {
                var payload_in = (JSON.parse(msg.payload));
            } catch {
                errCompat(node, msg, done, "Unable to parse input as JSON string");
                return null;
            }


            // Handle error, if any
            if (typeof payload_in.error !== "undefined") {
                var msg_error = {
                    payload: payload_in.error,
                    topic: msg.topic
                }
                this.send([null, null, null, null, msg_error]);
                return;
            }

            // Handle results
            var result = payload_in.result;
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

            // Handle downlinks
            var msg_downlink = null;
            if ((typeof result.dnlink != "undefined") && (result.dnlink !== null)) {
                msg_downlink = {
                    "topic": msg.topic,
                    "uplink": msg.uplink,
                    "payload": {
                        "port": result.dnlink.port,
                        "payload": result.dnlink.payload,
                    },
                }
            }

            msg.payload = payload_data;

            this.send([msg, msg_file, msg_stream, msg_downlink, null]);
        });

        node.on("close", function () {
        });
    }

    RED.nodes.registerType("loracloud-utils-connectors-das-parser", DasParser);
};