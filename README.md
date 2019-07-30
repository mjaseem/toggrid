# Toggrid


Toggrid is a minimal Android Client for [Toggl](https://toggl.com/). It features a grid layout with each item in the Grid corresponding to a *task*. The app is made for my personal use, has minimal features and may not work for you.

# Table of Contents

- [Toggrid](#toggrid)
- [Table of Contents](#table-of-contents)
  - [How it works](#how-it-works)
  - [Build](#build)
    - [Prerequisites](#prerequisites)
    - [Changing hardcoded settings](#changing-hardcoded-settings)


## How it works

The app features a single page containing a grid of tasks. Tapping on a task's cell will start (or stop if it is already running) recording a time entry for that task. Each Task's description and currently running Task's duration is displayed in its cell.

Tasks are started and stopped by making API calls to Toggl and no time entry is stored locally.

The tasks and the color scheme are configurable using a json file which should be hosted on a server. Url for this file is given by **settingsUrl** variable in [toggrid.js](./app/src/main/assets/toggrid.js) This might seem like an odd way to configure an app and it is. I wanted an easy way to edit the tasks from my PC instead of doing it on the mobile device. Hosting settings.json file as a Github Gist seemed like the easiest way to achieve this.

The app is written purely for my personal use and probably breaks a few Android best practices.

## Build

### Prerequisites

To build and use the app you need 
1. Android Studio
2. Toggl Account
3. Android device/emulator

The project is built using Android Studio and you should have it installed. Once imported to Android Studio, you can follow [official Android documentation](https://developer.android.com/studio/run) on building and running the project.

### Changing hardcoded settings

There are two things you have to change for the app to work for you.

1. Toggl API Token

Each user in Toggl.com has an API token. You can find it under "My Profile" in their Toggl account.

Replace **\*\*\*REMOVED\*\*\*** in [Config.java](app\src\main\java\com\mjaseem\toggrid\Config.java) with the API token you got from your Toggl account.

2. Settings file

The task configuration and color scheme should be given in a json file hosted on a server. 

Change the value of **settingsUrl** in [toggrid.js](app\src\main\assets\toggrid.js) to the URL of your settings file.
I host my settings file as a gist. You can find it [here](https://gist.github.com/mjaseem/a431be26cef5a6959417e56b83e62e2e).
