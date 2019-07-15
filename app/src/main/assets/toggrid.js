settings = {};
currentTask = null;
syncJob = null;
const settingsUrl = "https://gist.githubusercontent.com/mjaseem/a431be26cef5a6959417e56b83e62e2e/raw?ver=" + Date.now() //Cache bust

function getSettings() {
    return settings;

}

function fetchSettings() {
    return fetchWithTimeout(settingsUrl, 1500)
        .then(resp => resp.json())
        .then(fetchedSettings => {
            Cache.setSettings(JSON.stringify(fetchedSettings));
            return fetchedSettings;
        })
        .catch(err => {
            console.error("Couldn't fetch settings from server due to " + err + ". Fetching from Cache.");
            return JSON.parse(Cache.getSettings());
        })
        .then(fetchedSettings => {
            settings = fetchedSettings;
            console.debug("Loaded settings : " + JSON.stringify(fetchedSettings));
        })
        .catch(err => {
            console.error(err);
            alert("Couldn't load settings from either sources.");
        });
}

function fetchWithTimeout(url, timeout = 1500, options) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeout)
        )
    ]);
}

function getTasks() {
    return getSettings().tasks;;
}

function createTiles() {
    const wrapper = document.getElementById('wrapper');
    const tasks = getTasks();
    const colors = getSettings().colors;
    for (let i = 0; i < tasks.length; ++i) {
        const task = tasks[i];
        const tile = createTile(tasks[i], colors[i % colors.length]);//Just in case we don't have enough colors
        task.tile = tile;
        wrapper.appendChild(tile);
    }
}

function createTile(task, color) {
    const tile = document.createElement('div');
    const desc = document.createElement('div');
    desc.className = "desc"
    const dur = document.createElement('div');
    dur.className = "dur"
    tile.style.backgroundColor = color;
    desc.innerText = task.description;
    tile.appendChild(desc);
    tile.appendChild(dur);
    tile.onclick = debounce(() => toggleTask(task))
    return tile;
}

function debounce(fnReturningPromise) { //This will lead to error if called without promise
    let clickEnabled = true;
    return function () {
        if (clickEnabled) {
            clickEnabled = false;
            fnReturningPromise().then(_ => clickEnabled = true);
        }
    };
}

function toggleTask(task) {
    stopSync();
    return getCurrentTimeEntry()
        .then(function (resp) { //TODO check for duplicate logic with sync
            const data = resp.data;
            if (!isStateOfTaskConsistent(task, data)) {
                console.info("Inconsistent state when clicked. Ignoring.")
                return;
            }
            //Start tile immediately so that UI is responsive
            if (data !== null && task.description === data.description) {
                stopTile(task.tile)
                currentTask = null;
                return stopTimeEntry(data.id);
            } else {
                if (currentTask !== null) {
                    stopTile(currentTask.tile);
                }
                currentTask = task;
                startTile(task.tile)
                return startTask(task)
            }
        }).then(_ => startSync());
}

function isStateOfTaskConsistent(task, taskOnToggl) {
    const startedLocally = currentTask !== null && task.description === currentTask.description;

    if (startedLocally) {
        return taskOnToggl !== null && taskOnToggl.description === task.description; //toggl aggrees task is started
    } else {
        return taskOnToggl === null || taskOnToggl.description !== task.description //toggl agrees this task is not started
    }
}

function updateDuration(tile, dur) {
    const durNode = tile.getElementsByClassName("dur")[0];
    durNode.innerText = dur;
}

function authHead() {
    return "Basic " + btoa(Config.getApiToken() + ":api_token");
}

function defaultHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": authHead()
    }
}

function startTask(task) {
    const timeEntry = { "time_entry": { "description": task.description, "tags": task.tags, "created_with": "js" } };
    return startTimeEntry(timeEntry);
}

function startTimeEntry(timeEntry) {
    return fetch("https://www.toggl.com/api/v8/time_entries/start", {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(timeEntry)
    }).then(function (resp) {
        if (resp.status !== 200) {
            alert("Got " + resp.status + " while starting time entry");
            return;
        }
        return resp.json();
    }).then(json => {
        console.debug("Started " + json.data.id);
        currentTimeEntry = json.data;
        return json;
    });
}

function stopTimeEntry(id) {
    return fetch("https://www.toggl.com/api/v8/time_entries/" + id + "/stop", {
        method: 'PUT',
        headers: defaultHeaders()
    }).then(resp => {
        if (resp.status === 409) {
            console.info("Entry " + id + " already stopped. Duplicate call ignored by server");
            return;
        }
        console.debug("Stopped " + id);
    });
}

function getCurrentTimeEntry() {
    return fetch("https://www.toggl.com/api/v8/time_entries/current", {
        headers: defaultHeaders()
    }).then(resp => resp.json());
}

function polling(fn, predicate, delay, name) {
    const self = this;
    self.stopped = true;
    console.debug("Started polling " + name);
    const scheduleNext = function () {
        setTimeout(() => {
            if (self.stopped) {
                console.debug(name + " stopped");
                return;
            }
            console.debug("Not stopped. Running " + name);
            result = fn(self);
            if (predicate(result)) {
                console.debug("Predicate passed. Scheduling " + name);
                scheduleNext();
            } else {
                console.debug("Predicate failed. Stopping" + name);
            }
        }, delay);
    }
    self.stop = () => self.stopped = true;
    self.start = function () {
        if (self.stopped) {
            self.stopped = false;
            scheduleNext();
        }
    }
}


function startSync() {
    if (syncJob === null) {
        syncJob = new polling(sync, _ => true, 1000, "sync");
    }
    syncJob.start()
}

function stopSync() {
    syncJob.stop();
}


//TODO more responsive to input
//TODO polish the UI
//TODO js equals null !== or !=?
//TODO check duplicate tasks in settings

window.onload = function () {
    fetchSettings()
        .then(_ => createTiles())
        .then(_ => startSync())
}

function sync(polling) {
    return getCurrentTimeEntry()
        .then(function (currentTimeEntry) {
            /* When stopSync is called, current sync will continue to execute. 
            This check prevents the running sync from having any effect after stopping  */
            if (polling.stopped) {
                console.debug("Polling already stopped.")
                return;
            }

            currentData = currentTimeEntry.data;
            if (currentTask !== null && (currentData === null || currentData.description !== currentTask.description)) {
                stopTile(currentTask.tile);
                currentTask = null;
            }
            if (currentData !== null) {
                const matchingTask = findMatchingTask(currentData);
                if (matchingTask !== undefined) {
                    startTile(matchingTask.tile);
                    currentTask = matchingTask;
                    updateDuration(currentTask.tile, calculateDuration(currentData));
                }
            }

        })
}

function stopTile(tile) {
    tile.style.filter = "";
    updateDuration(tile, "");
}

function findMatchingTask(data) {
    return getTasks().filter(task => task.description === data.description)[0];
}
function startTile(tile) {
    tile.style.filter = "grayscale(100%)";
    updateDuration(tile, "00:00:00")
}

function calculateDuration(data) {
    const diff = Date.now() - Date.parse(data.start);

    let msec = diff;
    const hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    const mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    const ss = Math.floor(msec / 1000);
    return twoDigits(hh) + ":" + twoDigits(mm) + ":" + twoDigits(ss);
}

function twoDigits(xx) {
    return xx < 10 ? "0" + xx : xx
}