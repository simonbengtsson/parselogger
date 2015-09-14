var DomService = new function () {

    var logsArr = [];

    var noLogsElem = document.getElementById('no-logs');
    var appIdElem = document.getElementById('app-id');
    var apiKeyElem = document.getElementById('api-key');
    var logsElem = document.querySelector('.logs');
    var spinnerElem = document.querySelector('.spinner');

    appIdElem.value = localStorage['appId'] || '';
    apiKeyElem.value = localStorage['apiKey'] || '';

    this.init = function () {
        configChanged();

        var configInputs = document.querySelectorAll('.app-config input');
        for (var i = 0; i < configInputs.length; i++) {
            configInputs[i].oninput = configChanged;
        }

        var filterInputs = document.querySelectorAll('.log-filter input');
        for (var j = 0; j < filterInputs.length; j++) {
            if (localStorage['loaded_site_before']) {
                filterInputs[j].checked = !!localStorage['checkbox_' + filterInputs[j].id];
            }
            filterInputs[j].onchange = function (ev) {
                localStorage['checkbox_' + ev.srcElement.id] = ev.srcElement.checked ? 'checked' : '';
                filterChanged();
            };
        }
        localStorage['loaded_site_before'] = 'loaded';
    };

    function filterChanged() {
        logsElem.innerHTML = '';
        addLogsToDom(logsArr);
    }

    function configChanged() {
        var appId = appIdElem.value.trim();
        var apiKey = apiKeyElem.value.trim();

        if (appId && apiKey && appId.length >= 40 && apiKey.length >= 40) {
            localStorage['appId'] = appId;
            localStorage['apiKey'] = apiKey;

            fetchLogs(appId, apiKey);
        }
    }

    function fetchLogs(appId, apiKey) {
        spinnerElem.style.display = 'block';
        var service = new Logs();
        service.fetch(appId, apiKey).then(function (logs) {
            logsArr = logs;
            filterChanged();
        }).catch(function () {
        }).then(function () {
            noLogsElem.style.display = logsArr.length > 0 ? 'none' : 'block';
            logsElem.style.display = logsArr.length > 0 ? 'table' : 'none';
            spinnerElem.style.display = 'none';
        });
    }

    function addLogsToDom(logs) {
        var even = true;
        for (var i = 0; i < logs.length; i++) {
            var log = logs[i];

            var logTypeElem = document.querySelector('.log-filter #' + log.type);
            if (!logTypeElem.checked) {
                continue;
            }
            even = !even;

            var level = document.createElement('span');
            level.style.background = log.level === 'E' ? '#e74c3c' : '#37d077';
            level.className = 'level';
            level.textContent = log.level === 'E' ? 'ERROR' : 'INFO';

            var type = document.createElement('span');
            if (log.type === 'other') type.style.background = '#9b59b6';
            type.className = 'type';
            type.textContent = log.type.charAt(0);

            var timestamp = document.createElement('span');
            timestamp.className = 'timestamp';
            timestamp.textContent = formatDate(new Date(log.timestamp.iso));

            var info = document.createElement('span');
            info.className = 'info';
            info.appendChild(level);
            info.appendChild(type);
            info.appendChild(timestamp);

            var text = document.createElement('span');
            text.textContent = log.header;
            text.className = 'text';

            var logElem = document.createElement("li");
            logElem.appendChild(info);
            logElem.appendChild(text);

            logElem.onclick = console.log.bind(console, log);

            if (!even) logElem.className += ' odd';

            logsElem.appendChild(logElem);

        }
    }

    function formatDate(date) {
        var year = date.getFullYear();
        var month = '' + (date.getMonth() + 1);
        var day = '' + date.getDate();

        var hour = ("0" + date.getHours()).slice(-2);
        var min = ("0" + date.getMinutes()).slice(-2);
        var sec = ("0" + date.getSeconds()).slice(-2);

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-') + ' ' + hour + ':' + min + ':' + sec;
    }

};