createMethod = function () {
    console.log("Called method")
}

getSettings = function () {
    // self.settings = null
    // if (self.settings == null) {
    //     (async function (self) {
    //         await fetch("settings.json")
    //             .then(resp => {
    //                 return resp.json()
    //             })
    //     })();

    // }
    // return self.settings TODO
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
                "description": "Time Entry 2",
                "tags": [
                    "testTag1",
                    "testTag3"
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
                "description": "Time Entry 2",
                "tags": [
                    "testTag1",
                    "testTag3"
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
                "description": "Time Entry 7",
                "tags": [
                    "testTag1",
                    "testTag3"
                ],
            },
        ]
    }
}

currentTimeEntry = null;

getTasks = function () {
    return getSettings().tasks;
}

createTiles = function () {
    const wrapper = document.getElementById('wrapper');
    const tasks = getTasks();
    const colors = getSettings().colors;
    tasks.forEach(task => {
        const tile = document.createElement('div');
        tile.innerHTML = task.description;
        let buttonEnabled = true;
        tile.onclick = (e) => {
            if (buttonEnabled) {
                buttonEnabled = false;
                toggleTimeEntry(task).then(_ => buttonEnabled = true); //Debounce
            }
        }
        wrapper.appendChild(tile);
    });
}

toggleTimeEntry = function (task) {
    let promise;
    if (currentTimeEntry != null && currentTimeEntry.description === task.description) {
        promise = stopTimeEntry(currentTimeEntry.id);
        currentTimeEntry = null;
    } else {
        promise = startTask(task);
    }
    return promise;
}

authHead = function () {
    return "Basic " + btoa(getSettings()["api-token"] + ":api_token");
}

defaultHeaders = function () {
    return {
        "Content-Type": "application/json",
        "Authorization": authHead()
    }
}

startTask = function (task) {
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

stopTimeEntry = function (id) {
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

getCurrentTimeEntry = async function () {
    return fetch("https://www.toggl.com/api/v8/time_entries/current", {
        headers: defaultHeaders()
    }).then(resp => resp.json());
}

getTimeEntry = function (id) {
    fetch("https://www.toggl.com/api/v8/time_entries/" + id)
}

stopCurrentEntry = function () {
    return currentTimeEntry()
        .then(resp => {
            if (resp.data != null) {
                stopTimeEntry(resp.data.id);
            }
        });
}

polling = function (fn, predicate, delay, name) {
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

//TODO color scheme
//TODO display time
//TODO change color of running task
//TODO handle inconsistency
fetchSettings =
    window.onload = function () {
        createTiles();
        getCurrentTimeEntry().then(entry => {
            currentTimeEntry = entry.data;
        })
    }
