/* MIT License

Copyright (c) 2023 Kåre Nejmann post@kan.dk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

var framerate = 25;

function convert() {
  var textInput = document.getElementById("input").value;
  var showFrames = document.getElementById("showFrames").checked;
  var showSeconds = document.getElementById("showSeconds").checked;
  // var noteFilterText = document.getElementById("noteFilterText").value; //TODO filter
  var timelineClipNotesText;
  var diagnose = "";
  var anwId = [];
  var timelineClipNotes = {};
  var assets = {};
  var totalDuration = 0;

  // create tables for list and sum
  sumTable = document.createElement("table");
  listTable = document.createElement("table");

  timelineClipNotesText = textInput.split("\n"); // split the list into an array - one Clip Note per line

  for (const timelineClipNoteLine of timelineClipNotesText) {
    // iterate over the array
    if (timelineClipNoteLine != "") {
      var columns = timelineClipNoteLine.split(/\t/); // splits each line into an array; delim: tab

      clipName = columns[0];
      beginTC = columns[1];
      endTC = columns[2];
      durMCRand = columns[3];
      track = columns[4];
      comment = columns[5];
      durFrames = durToFrames(durMCRand);

      /* 
      timelineClipNotes collects timeline clip notes as an array of arrays
        |-- Clip name
          |-- note data: in, out, duration, track, comment
          |-- note data: in, out, duration, track, comment
        |-- Clip name
          |-- note data: in, out, duration, track, comment
      */
      if (!timelineClipNotes[clipName]) {
        // if the clip name has not been seen create an empty array for it
        timelineClipNotes[clipName] = [];
      }
      timelineClipNotes[clipName].push({
        in: TCtoFrames(beginTC),
        out: TCtoFrames(endTC) + 1,
        dur: durFrames,
        track: track,
        comment: comment,
      });

      //TODO filter out notes matching noteFilterText
      // if (noteFilterText != "") {
      // }
      addToClipList(); // Renders "Notes and timecodes"
    }
    // console.table(clipNotes)
  }
  for (const clipName in timelineClipNotes) {
    //TODO add filter
    clipNameSegments = timelineClipNotes[clipName]; // clipNameSegments is an array of each segment with source name clipName

    clipNameSegments.sort(function (a, b) {
      return a.in - b.in;
    }); // sort the ClipNameSegments by start frame

    // look for overlapping timecode. Segments with overlapping timecodes are consolidated to one segment.
    n = 0; // number of segment being examined
    while (clipNameSegments.length > 1 + n) {
      // console.log(n + ": " + clipNameSegments[n])
      // console.log(n+1 + ": " + clipNameSegments[n + 1])
      if (clipNameSegments[n].out >= clipNameSegments[n + 1].in) {
        //if the end framenumber of the clip is larger than the start framenumber of the next segment (clips overlap) set the end framenumber to that of the next segment.
        clipNameSegments[n].out = clipNameSegments[n + 1].out;
        clipNameSegments.splice(n + 1, 1); // remove the next segment from the array of segments
      } else {
        n++;
      }
    }
    // when overlaps have been removed use the sumDuration functionen to sum up the duration of segments.
    for (segment in clipNameSegments) {
      clip = clipNameSegments[segment];
      // console.log(a + " konsolideret in: " + clip.in + " out: " + clip.out);
      sumDuration(clipName, clip.out - clip.in);
    }
  }

  // Populate table with summed durations of assets

  for (var asset in assets) {
    row = sumTable.insertRow();
    row.insertCell().innerHTML = asset;
    if (showFrames) {
      row.insertCell().innerHTML = assets[asset];
    }
    if (showSeconds) {
      row.insertCell().innerHTML = Math.ceil(assets[asset] / framerate);
    }
    row.insertCell().innerHTML = framesToMinSec(assets[asset]);
    anwId = asset.match(/^ANW\d{3,5}_\d{1,4}/);
    uprId = asset.match(/^_UPRIGHT\S*/);
    drId = asset.match(/^\d{3,8}-\d{1,2}-\d{1,3}/);
    if (anwId) {
      row.insertCell().innerHTML =
        "<a href=https://www.audionetwork.com/track/searchkeyword?keyword=" +
        encodeURIComponent(anwId) +
        " target='_blank' rel='noreferrer'>link</a>";
    } else if (uprId) {
      row.insertCell().innerHTML =
        "<a href=https://search.upright-music.com/search?phrase[]=" +
        encodeURIComponent(uprId) +
        " target='_blank' rel='noreferrer'>link</a>";
    } else if (drId) {
      row.insertCell().innerHTML =
        "<a href=http://diskoteket/#section=track&id=" +
        encodeURIComponent(drId) +
        " target='new' rel='noreferrer'>link</a>";
    } else {
      row.insertCell().innerHTML = "";
    }
    row.insertCell().innerHTML = "";
  }

  //  Add headers to the tables
  header = sumTable.createTHead();
  row = header.insertRow();
  row.insertCell().innerHTML = "Name";
  if (showFrames) {
    row.insertCell().innerHTML = "Duration in frames";
  }
  if (showSeconds) {
    row.insertCell().innerHTML = "Duration in seconds <br /> (rounded up)";
  }
  row.insertCell().innerHTML = "Duration in min:sec";
  row.insertCell().innerHTML = "Link";
  row.insertCell().innerHTML = "Other metadata";

  header = listTable.createTHead();
  row = header.insertRow();
  row.insertCell().innerHTML = "Name";
  row.insertCell().innerHTML = "Note";
  row.insertCell().innerHTML = "Start TC";
  row.insertCell().innerHTML = "End TC";
  row.insertCell().innerHTML = "Duration (m:ss)";

  // push the resulting tables to the html page
  document.getElementById("sums").firstChild.replaceWith(sumTable);
  document.getElementById("list").firstChild.replaceWith(listTable);
  document.getElementById("diagnose").innerHTML = "Diagnose: " + diagnose;
  // console.log("totalDuration = " + totalDuration)
  document.getElementById("statistics").innerHTML =
    "<p>Total duration of all clips: " +
    totalDuration +
    " frames = " +
    framesToMinSec(totalDuration) +
    " min:sec</p>";

  function addToClipList() {
    // Create HTML table of Timeline Clip Notes
    row = listTable.insertRow();
    row.insertCell().innerHTML = clipName;
    row.insertCell().innerHTML = comment;
    row.insertCell().innerHTML = beginTC;
    row.insertCell().innerHTML = endTC;
    row.insertCell().innerHTML = framesToMinSec(durFrames);
  }

  function sumDuration(cName, cDur) {
    // Checks if the clipName has been seen before - if not a variable is created
    if (!assets[cName]) {
      assets[cName] = 0;
      // console.log(cName + " created")
    }
    // Add duration to name's duration assets
    assets[cName] += cDur;
    // console.log(cName + " dur = " + assets[cName])
    totalDuration += cDur;
  }
}
function durToFrames(durRand) {
  durMCRandArr = durRand.split(/:/).map(toNumber);
  durMCRandArr.splice(0, 0, 0, 0, 0);
  // console.log(durMCRandArr)
  durF = durMCRandArr.pop();
  durF += durMCRandArr.pop() * framerate;
  durF += durMCRandArr.pop() * framerate * 60;
  durF += durMCRandArr.pop() * framerate * 60 * 60;
  return durF;
}

function framesToMinSec(fr) {
  // Convert frames to mm:ss.
  let st = Math.ceil(fr / framerate);
  let m = Math.trunc(st / 60);
  let s = st - m * 60;
  return String(m) + ":" + String(s).padStart(2, "0");
}

/* USE THIS INSTEAD - Maybe stored in another file.
function TCtoFrames(tc, fps) {
  // from timecode to frames
  fields = tc.split(/:/);
  // convert strings to numbers
  fields[0] = parseInt(fields[0]);
  fields[1] = parseInt(fields[1]);
  fields[2] = parseInt(fields[2]);
  fields[3] = parseInt(fields[3]);
  // check if timecode values are within the expected
  if (
    fields.length == 4 &&
    0 <= fields[0] &&
    fields[0] < 24 &&
    0 <= fields[1] &&
    fields[1] < 60 &&
    0 <= fields[2] &&
    fields[2] < 60 &&
    0 <= fields[3] &&
    fields[3] < fps
  ) {
    // calculate frames
    frames =
      fields[0] * 60 * 60 * fps +
      fields[1] * 60 * fps +
      fields[2] * fps +
      fields[3] * 1;
    return frames;
  } else {
    warningMessages += "Defekt tidskode " + tc;
  }
  // console.log("TCtoFrames: " , tc , fields, frames)
}
 */

function TCtoFrames(tc) {
  // from timecode to frames
  fields = tc.split(/:/);
  if (fields.length != 4) {
    diagnose += "Invalid tidskode" + tc;
  }
  frames =
    fields[0] * 60 * 60 * framerate +
    fields[1] * 60 * framerate +
    fields[2] * framerate +
    fields[3] * 1;
  // console.log("TCtoFrames: " , tc , fields, frames)
  return frames;
}
// https://github.com/reidransom/timecode.js/blob/master/lib/timecode.js

// Function to read the text file.
window.onload = function () {
  //Check the support for the File API support
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var fileSelected = document.getElementById("txtfiletoread");
    fileSelected.addEventListener(
      "change",
      function (e) {
        //Set the extension for the file
        var fileExtension = /text.*/;
        //Get the file object
        var fileTobeRead = fileSelected.files[0];
        //Check of the extension match
        if (fileTobeRead.type.match(fileExtension)) {
          //Initialize the FileReader object to read the 2file
          var fileReader = new FileReader();
          fileReader.onload = function (e) {
            var fileContents = document.getElementById("input");
            fileContents.value = fileReader.result;
            convert();
          };
          // fileReader.readAsText(fileTobeRead, "windows-1252");
          fileReader.readAsText(fileTobeRead, "macintosh");
        } else {
          alert("Please select text file");
        }
      },
      false
    );
  } else {
    alert("Files are not supported");
  }
};

function toNumber(value) {
  return Number(value);
}

// Check om siden åbnes i Chrome
var isChromium = window.chrome;
var winNav = window.navigator;
var vendorName = winNav.vendor;
var isOpera = typeof window.opr !== "undefined";
var isIEedge = winNav.userAgent.indexOf("Edge") > -1;
var isIOSChrome = winNav.userAgent.match("CriOS");

if (isIOSChrome) {
  // is Google Chrome on IOS
} else if (
  isChromium !== null &&
  typeof isChromium !== "undefined" &&
  vendorName === "Google Inc." &&
  isOpera === false &&
  isIEedge === false
) {
  // is Google Chrome
} else {
  // not Google Chrome
  document.getElementById("warn").innerHTML =
    "Siden her virker kun korrekt i Chrome";
  alert(
    "Brug venligst Chrome til at åbne denne side.\nI andre browsere fungerer den sandsynligvis ikke."
  );
}

// end;
