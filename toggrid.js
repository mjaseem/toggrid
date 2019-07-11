function getSettings() {

    return {
        "api-token": "***REMOVED***",
        "wid": 0,
        "tasks": [
            {
                "description": "Toggle Client",
                "tags": [
                    "testTag1"
                ],
            },
            {
                "description": "Time Entry 2",
                "tags": [
                    "testTag1",
                    "testTag3"
                ],
            },
            {
                "description": "Time Entry 3",
                "tags": [
                    "testTag1",
                    "testTag3"
                ],
            },
            {
                "description": "Time Entry 4",
                "tags": [
                    "testTag1",
                    "testTag3"
                ],
            },
            {
                "description": "Time Entry 5",
                "tags": [
                    "testTag1",
                    "testTag3"
                ],
            },
            {
                "description": "Time Entry 6",
                "tags": [
                    "testTag1",
                    "testTag3"
                ],
            },
        ],
        "colors": ["#962752", "#dab827", "#f26e6b", "#171717", "#375359", "#29e5af", "#7b47ba"]
    }
}

currentTimeEntry = null;

function getTasks () {
    return getSettings().tasks;
}

function createTiles() {
    const wrapper = document.getElementById('wrapper');
    const tasks = getTasks();
    const colors = getSettings().colors;
    for (let i = 0; i < tasks.length; ++i) {
        let task = tasks[i];
        const tile = document.createElement('div');
        tile.style.backgroundColor = colors[i % colors.length] //Just in case we don't have enough colors
        tile.innerHTML = task.description;
        let buttonEnabled = true;
        tile.onclick = (e) => {
            if (buttonEnabled) {
                buttonEnabled = false;
                toggleTimeEntry(task, tile).then(_ => buttonEnabled = true); //Debounce
            }
        }
        wrapper.appendChild(tile);
    }
}

function toggleTimeEntry(task, tile) {
    let promise;
    if (currentTimeEntry != null && currentTimeEntry.description === task.description) {
        promise = stopTimeEntry(currentTimeEntry.id);
        currentTimeEntry = null;
        tile.style.filter = "";
    } else {
        promise = startTask(task);
        tile.style.filter = "grayscale(100%)";
    }
    return promise;
}

function authHead() {
    return "Basic " + btoa(getSettings()["api-token"] + ":api_token");
}

function defaultHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": authHead()
    }
}

function startTask(task) {
    const request = { "time_entry": { "description": task.description, "tags": task.tags, "created_with": "js" } };
    return fetch("https://www.toggl.com/api/v8/time_entries/start", {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(request)
    }).then(function (resp) {
        if (resp.status !== 200) {
            alert("Got " + resp.status + " while starting time entry")
            return;
        }
        return resp.json();
    }).then(json => {
        console.log("Started " + json.data.id);
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
            console.log("Entry " + id + " already stopped");
            return;
        }
        console.log("Stopped " + id);
    });
}

function getCurrentTimeEntry() {
    return fetch("https://www.toggl.com/api/v8/time_entries/current", {
        headers: defaultHeaders()
    }).then(resp => resp.json());
}

function stopCurrentEntry() {
    return currentTimeEntry()
        .then(resp => {
            if (resp.data != null) {
                stopTimeEntry(resp.data.id);
            }
        });
}

function polling(fn, predicate, delay, name) {
    const self = this;
    self.cancelled = false;
    console.log("Started polling " + name);
    const scheduleNext = function () {
        setTimeout(() => {
            if (self.cancelled) {
                console.log(name + " cancelled");
                return;
            }
            console.log("Not cancelled. Running " + name);
            result = fn();
            if (predicate(result)) {
                console.log("Predicate passed. Scheduling " + name);
                scheduleNext();
            } else {
                console.log("Predicate failed. Stopping" + name);
            }
        }, delay);
    }
    self.cancel = () => self.cancelled = true;
    scheduleNext();
}

//TODO display time
//TODO change color of running task
//TODO handle inconsistency
//TODO fullscreen on android
window.onload = function () {
    createTiles();
    getCurrentTimeEntry().then(entry => {
        currentTimeEntry = entry.data;
    })
}
