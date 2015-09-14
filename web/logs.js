var Logs = function () {

    var apiUrl = 'https://api.parse.com/1/scriptlog';

    this.fetch = function (appId, apiKey) {
        return fetch(apiUrl + '?n=10000', {
            headers: {
                'X-Parse-Application-Id': appId,
                'X-Parse-REST-API-Key': apiKey
            }
        }).then(checkStatus).then(parseJSON).then(parseLogMessages).then(function (res) {
            return res;
        });
    };

    function checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response;
        } else {
            var error = new Error(response.statusText);
            error.response = response;
            throw error;
        }
    }

    function parseJSON(response) {
        return response.json()
    }

    function parseLogMessages(response) {
        var logs = [];
        for (var i = 0; i < response.length; i++) {
            var log = response[i];
            log.text = log.message.substring(log.message.indexOf(']') + 1);
            if (log.text) {
                log.level = log.message.charAt(0);
                var type = parseLogMessageType(log.text, i);
                for (var prop in type) {
                    if (type.hasOwnProperty(prop)) {
                        log[prop] = type[prop];
                    }
                }
                logs.push(log);
            }
        }
        return logs;
    }

    // TODO Sometimes the 'Result:' contains a stacktrace. Right now it is just ignored however.
    function parseLogMessageType(logText) {
        var deployRegEx = /Deployed v\d+ with triggers/;
        var triggerRegEx = /v\d+ \w+ triggered for/;
        var cloudFunctionRegEx = /v\d+ Ran cloud function \w+/;
        var endpointRegEx = /v\d+ Ran custom endpoint/;

        var parts = logText.split('\n');
        var header = parts.shift().replace(':', '');

        var type = '',
            typeName = '',
            input = '',
            result = '',
            triggers = null,
            cloudFunctions = null,
            deployedVersion = null,
            user = null;

        if (header.match(deployRegEx)) {
            type = 'deploy';
            deployedVersion = parseInt(header.match(/\d+/)[0]);
            triggers = {};
            var lastClass = '';
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i].trim();
                if (part) {
                    if (part.substring(part.length - 1) === ':') {
                        lastClass = part.replace(':', '');
                        triggers[lastClass] = [];
                    } else {
                        triggers[lastClass].push(part);
                    }
                }
            }
            cloudFunctions = triggers['Cloud Functions'];
            delete triggers['Cloud Functions'];
        } else if (header.match(triggerRegEx)) {
            type = 'trigger';
            typeName = header.split(' ')[1];
            deployedVersion = parseInt(header.match(/\d+/)[0]);

            input = parts[0].replace('Input:', '').trim();
            try { input = JSON.parse(input); } catch (e) {}

            result = parts[1].replace('Result:', '').trim();
            result = result.replace('Update changed to', '');
            try { result = JSON.parse(result); } catch (e) {}
        } else if (header.match(cloudFunctionRegEx)) {
            type = 'cloudFunction';
            deployedVersion = parseInt(header.match(/\d+/)[0]);

            var words = header.split(' ');
            typeName = words[4];
            user = words[7] || null;

            input = parts[0].replace('Input:', '').trim();
            try { input = JSON.parse(input); } catch (e) {}

            result = parts[1].replace('Result:', '').trim();
            result = result.replace('Update changed to', '');
            try { result = JSON.parse(result); } catch (e) {}
        } else if (header.match(endpointRegEx)) {
            type = 'endpoint';
            deployedVersion = parseInt(header.match(/\d+/)[0]);

            input = parts[0].replace('Input:', '').trim();
            try { input = JSON.parse(input); } catch (e) {}

            result = parts[1].replace('Result:', '').trim();
            try { result = JSON.parse(result); } catch (e) {}
        } else {
            type = 'other';
        }
        return {
            'type': type,
            'typeName': typeName,
            'header': header,
            'deployedVersion': deployedVersion,
            'input': input,
            'result': result,
            'triggers': triggers,
            'cloudFunctions': cloudFunctions,
            'user': user
        };
    }
};