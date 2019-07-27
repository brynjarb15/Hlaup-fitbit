import { vibration } from "haptics";
import document from "document";
import * as RT from "../data/data.js";
import * as util from "../common/utils";
import { me } from "appbit";
import clock from "clock";
import * as fs from "fs";
import { HeartRateSensor } from "heart-rate";




/*  TODO:
 *    Make run not done
 *    
 *
 *  Done:
 *    Leave to excersise page
 *    Pause/play button
 *    Keep track and show which excersies have been completed
 *    Show clock
 *    Show heartrate
 *    Hop forward/back 1 min
 *    Show popup when exercise is reattempted
 *
 *
 *  Skiped:
 *    Skip forward to next part of excersise (hægt væri að gera þetta með því að ýta oft á hoppa )
 *    Restart the current Run (Ég get opnað og lokað þannig þetta er í raun óþarfi)
 *    
*/


// Timer class which can be paused and then resumed again 
class Timer {
  constructor(callback, delay) {
    this.callback = callback;
    this.remaining = delay;
    this.timeID;
    this.start;
    
  }
  pause = function() {
    clearTimeout(this.timerId);
    this.remaining -= Date.now() - this.start;
  };

  resume = function() {
      this.start = Date.now();
      clearTimeout(this.timerId);
      this.timerId = setTimeout(this.callback, this.remaining);
  };

}

// Let all runs be not completed, they will then be set to true after reading the db
let runsCompleted = {
  "v8d1": false,
  "v8d2": false,
  "v8d3": false,
  "v9d1": false,
  "v9d2": false,
  "v9d3": false,
  "v10d1": false,
  "v10d2": false,
  "v10d3": false,
  "v11d1": false,
  "v11d2": false,
  "v11d3": false,
  "v12d1": false,
  "v12d2": false,
  "v12d3": false,
  "v13d1": false,
  "v13d2": false,
  "v13d3": false,
  "v14d1": false,
  "v14d2": false,
  "v14d3": false
}


// Try to read data from the db file
try {
  // Read the db file
  let jsonRunsCompleted = fs.readFileSync("db.txt", "json");
  // Set the runs to correct value
  runsCompleted.v8d1 = jsonRunsCompleted.v8d1;
  runsCompleted.v8d2 = jsonRunsCompleted.v8d2;
  runsCompleted.v8d3 = jsonRunsCompleted.v8d2;
  runsCompleted.v9d1 = jsonRunsCompleted.v9d1;
  runsCompleted.v9d2 = jsonRunsCompleted.v9d2;
  runsCompleted.v9d3 = jsonRunsCompleted.v9d3;
  runsCompleted.v10d1 = jsonRunsCompleted.v10d1;
  runsCompleted.v10d2 = jsonRunsCompleted.v10d2;
  runsCompleted.v10d3 = jsonRunsCompleted.v10d3;
  runsCompleted.v11d1 = jsonRunsCompleted.v11d1;
  runsCompleted.v11d2 = jsonRunsCompleted.v11d2;
  runsCompleted.v11d3 = jsonRunsCompleted.v11d3;
  runsCompleted.v12d1 = jsonRunsCompleted.v12d1;
  runsCompleted.v12d2 = jsonRunsCompleted.v12d2;
  runsCompleted.v12d3 = jsonRunsCompleted.v12d3;
  runsCompleted.v13d1 = jsonRunsCompleted.v13d1;
  runsCompleted.v13d2 = jsonRunsCompleted.v13d2;
  runsCompleted.v13d3 = jsonRunsCompleted.v13d3;
  runsCompleted.v14d1 = jsonRunsCompleted.v14d1;
  runsCompleted.v14d2 = jsonRunsCompleted.v14d2;
  runsCompleted.v14d3 = jsonRunsCompleted.v14d3;
} catch {
  console.log('Could not read file');
}


// Write the times into a file
function writeTimesToFile() {
  fs.writeFileSync("db.txt", runsCompleted, "json");
}

// Keep the app from closing after default amount of time
me.appTimeoutEnabled = false;

// Update the clock every second
clock.granularity = "seconds";

// Get visual elements which are kept in the index.gui file
let list = document.getElementById("my-list");
let tiles = list.getElementsByClassName("tile-list-item");
const stopwatchLabel = document.getElementById("stopWatch");
const clockLabel = document.getElementById("clockLabel");
const heartRateLabel = document.getElementById("heartRate");



let typeOfRun = document.getElementById("typeOfRun");
let repitionsText = document.getElementById("repitions");
let finishText = document.getElementById("finish");

let returnButton = document.getElementById("btn-return");
let playButton = document.getElementById("btn-play");
let pauseButton = document.getElementById("btn-pause");
let skipBackButton = document.getElementById("btn-back");
let skipForwardButton = document.getElementById("btn-forward");

// Popup elements
let myPopup = document.getElementById("my-popup");
let popupLeft = myPopup.getElementById("btnLeft");
let popupRight = myPopup.getElementById("btnRight");


// Set some string constants
const warmUpMessage = 'Upphitun';
const runMessage = 'Hlaup';
const walkMessage = 'Walk';
const coolDownMessage = 'Róun';


let timeLeft;
let stopWatchPaused = false;

let runTimes = RT.runTimes;
let currentCountDown;
let showStopwatch = false;

// Set the warm up and cooldown times
let warmUpTime = 5.2*60*1000;
let coolDownTime = 5*60*1000;

// Create global current timer
let currentTimer;

// Show the heart rate
if (HeartRateSensor) {
   console.log("This device has a HeartRateSensor!");
   const hrm = new HeartRateSensor();
   hrm.addEventListener("reading", () => {
     heartRateLabel.text = hrm.heartRate;
   });
   hrm.start();
} else {
   console.log("This device does NOT have a HeartRateSensor!");
}


// Go through all the tiles and set the checkbox icon if run is done and create onclick event 
tiles.forEach((element, index) => {
  let touch = element.getElementById("touch-me");
  if (runsCompleted[element.id]) {
    element.getElementById("list-icon").href = "check.png";
    touch.onclick = (evt) => {
      myPopup.style.display = "inline";
      myPopup.tag = element.id;
    }
  } else {
    // When a tile is clicked warm up is started
    touch.onclick = (evt) => {
      list.style.display = "none";
      startWarmUp(runTimes[element.id]);
    }
  }
  
});

// Button on the popup that just closed the popup
popupLeft.onclick = function(evt) {
  myPopup.style.display = "none";
}

// Button on the popup that starts the workout
popupRight.onclick = function(evt) {
  myPopup.style.display = "none";
  list.style.display = "none";
  startWarmUp(runTimes[myPopup.tag]);
}

// When the return button is clicked
returnButton.onactivate = function(evt) {
  returnToList();
}

// When the pause button is clicked
pauseButton.onactivate = function(evt) {
  pauseCountDown();
}

// When the play button is clicked
playButton.onactivate = function(evt) {
  startCountDown();
}

skipBackButton.onactivate = function(evt) {
  skipBackOneMin();
}

skipForwardButton.onactivate = function(evt) {
  skipForwardOneMin();
}

function pauseCountDown() {
  // Pause the countdown
  currentTimer.pause();
  // pause the stopwatch from moving
  stopWatchPaused = true;
  // Toggle play and pause buttons
  playButton.style.display = "inline";
  pauseButton.style.display = "none";
}

function skipForwardOneMin() {
  currentTimer.remaining -= 1000*60;
  currentTimer.resume();
}

function skipBackOneMin() {
  currentTimer.remaining += 1000*60;
  currentTimer.resume();
}


function startCountDown() {
  // Resume the countdown
  currentTimer.resume();
  // Resume the stopwatch
  stopWatchPaused = false;
  // Toggle play and pause buttons
  playButton.style.display = "none";
  pauseButton.style.display = "inline";
}

// Return to the tile list with all the exercises
function returnToList() {
  // Show the list
  list.style.display = "inline";
  // Hide everything else
  stopwatchLabel.style.display = "none";
  typeOfRun.style.display = "none";
  repitionsText.style.display = "none";
  finishText.style.display = "none";
  
  returnButton.style.display = "none";
  playButton.style.display = "none";
  pauseButton.style.display = "none";
  skipBackButton.style.display = "none";
  skipForwardButton.style.display = "none";
  // Make sure the stopwatch is not stop
  stopWatchPaused = false;
}

// Close the list and show the stop watch
function openStopWatch() {
  // Hide the list
  list.style.display = "none";
  // Show everything else
  stopwatchLabel.style.display = "inline";
  typeOfRun.style.display = "inline";
  repitionsText.style.display = "inline";
  // Still hide the finish text
  finishText.style.display = "none";
  
  returnButton.style.display = "inline";
  // Still hide the play button
  playButton.style.display = "none";
  pauseButton.style.display = "inline";
  skipBackButton.style.display = "inline";
  skipForwardButton.style.display = "inline";
}

// Start the stopwatch with new times
function restartStopWatch(time, message) {
  currentCountDown = time;
  // Add 1 sec to time to make the first time more visible
  if (currentCountDown > 0) {
    currentCountDown += 1000;
  }
  typeOfRun.text = message;
  vibration.start("confirmation");
}


// Start the warm up time
function startWarmUp(currentRunTimes) {
  // Show the stop watch which also hides the exercise menu
  openStopWatch();
  // Start the warm up
  showStopwatch = true;
  restartStopWatch(warmUpTime, warmUpMessage);
  // Start the timer
  currentTimer = new Timer(function(){ 
    runProcess(currentRunTimes, currentRunTimes.repeat)
  }, currentCountDown)
  currentTimer.resume();
}

// Run and walk process
function runProcess(currentRunTimes, repeatsLeft) {
  // If no repeats are left we go to cooldown
  if (repeatsLeft <= 0) {
    repitionsText.text = '';
    coolDown(currentRunTimes);
    return;
  }
  // Show repitions status on the form '1 of 4'
  repitionsText.text = (currentRunTimes.repeat+1-repeatsLeft) + ' of ' + currentRunTimes.repeat;
  // Start the run timer
  restartStopWatch(currentRunTimes.run*60*1000, runMessage);
  currentTimer = new Timer(function(){
    // Start the walk timer after the run timer has finished
    restartStopWatch(currentRunTimes.walk*60*1000, walkMessage);
    currentTimer = new Timer(function() {
      runProcess(currentRunTimes, repeatsLeft-1);  
    }, currentCountDown);
    currentTimer.resume();
  }, currentCountDown);
  currentTimer.resume();
}

// Take start the cooldown timer
function coolDown(currentRunTimes) {
  restartStopWatch(coolDownTime, coolDownMessage);
  // Extra vibration because of final run
  vibration.start("confirmation-max");
  currentTimer = new Timer(function() {
    finishUpAfterCooldown(currentRunTimes);
  }, currentCountDown);
  currentTimer.resume();
}

// Do thing after the cooldown stope
function finishUpAfterCooldown(currentRunTimes) {
  // Vibrate to let know that the cooldown is finished
  vibration.start("confirmation");
  // Write to file that this run is finished
  runsCompleted[currentRunTimes.id] = true;
  writeTimesToFile();
  // Hide the stop watch and type of run text
  showStopwatch = false;
  typeOfRun.text = '';
  // Show finished text
  finishText.style.display = "inline";
  // Make checkbox for current run checked if return is clicked
  tiles.forEach((element, index) => { 
    if (element.id === currentRunTimes.id) {
      element.getElementById("list-icon").href = "check.png";
    }
  });
}

// Happens once every second
clock.ontick = (evt) => {
  // If the stop watch is paused we will do nothing
  // 
  if (stopWatchPaused) {
  }
  // Show the stop watch
  else if (showStopwatch) {
    // Get the current time
    let currentTime = new Date();
    // Get the start time from the timer
    let startTime = currentTimer.start;
    // Gt how much is left of the timer
    timeLeft = new Date(startTime - currentTime + currentTimer.remaining);
  
    // Turn time left into numbers
    let secs = util.zeroPad(timeLeft.getSeconds());
    let mins = util.zeroPad(timeLeft.getMinutes());
    let hours = util.zeroPad(timeLeft.getHours());
    
    // Show the stopwatch
    stopwatchLabel.text = '';
    if (hours === '00') {
      stopwatchLabel.text = `${mins}:${secs}`;
    } else {
      stopwatchLabel.text = `${hours}:${mins}:${secs}`;
    }
      

  }
  else {
    // If the stop watch is neither paused or showing we empty the stopwatch
    stopwatchLabel.text = '';
  }
  // Normal clock
    let today = evt.date;
    let hours = util.zeroPad(today.getHours());
    let mins = util.zeroPad(today.getMinutes());
    let sec = util.zeroPad(today.getSeconds());

    clockLabel.text = `${hours}:${mins}`;
  
  

}

