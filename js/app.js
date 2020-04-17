const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;

const canvas = document.querySelector('canvas');
const audio = document.getElementById('audio_player');


const recordButton = document.querySelector('button#record');
const playButton = document.querySelector('button#play');
const downloadButton = document.querySelector('button#download');

recordButton.onclick = toggleRecording;
playButton.onclick = play;
downloadButton.onclick = download;


const worker = new Worker('./js/worker.js');

console.log(worker);





const stream = audio.captureStream(); 
console.log('Started stream capture from canvas element: ', stream);


function createNewElement(divId, blobUrl){
  $('<audio class="recoded-audio" controls id='+divId+' src='+ blobUrl +'></audio>').appendTo('#file_name');
}

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
  console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  var divId = new Date().valueOf().toString();
  
  console.log('Recorder stopped: ', event);
  

  var recordedAudio = document.getElementById(divId);
  const superBuffer = new Blob(recordedBlobs, {type: 'audio/mpeg'});
  recordedAudio = window.URL.createObjectURL(superBuffer);

  createNewElement(divId, recordedAudio);
  console.log(recordedAudio);
 
}

function toggleRecording() {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
}

// The nested try blocks will be simplified when Chrome 47 moves to Stable
function startRecording() {
  let options = {mimeType: 'audio/mpeg'};
  recordedBlobs = [];
    try {
  //  mediaRecorder = new MediaRecorder(stream, options);
  mediaRecorder = new window.mp3MediaRecorder.Mp3MediaRecorder(stream, { worker });
    } catch (e0) {
    console.log('Unable to create MediaRecorder with options Object: ', e0);
    try {
      options = {mimeType: 'audio/mpeg'};
        //  mediaRecorder = new MediaRecorder(stream, options);
       mediaRecorder = new window.mp3MediaRecorder.Mp3MediaRecorder(stream, { worker });
    } catch (e1) {
      console.log('Unable to create MediaRecorder with options Object: ', e1);
      try {
        options = 'audio/mpeg'; // Chrome 47
         //  mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorder = new window.mp3MediaRecorder.Mp3MediaRecorder(stream, { worker });
      } catch (e2) {
        alert('MediaRecorder is not supported by this browser.\n\n' +
          'Try Firefox 29 or later, or Chrome 47 or later, ' +
          'with Enable experimental Web Platform features enabled from chrome://flags.');
        console.error('Exception while creating MediaRecorder:', e2);
        return;
      }
    }
  }
  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(100); // collect 100ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedBlobs);
  var line = document.createElement('a');
  
  var fileName = $('#file_name');
  $( "<p>The file is ready! Listen below</p>" ).appendTo(fileName);
  
}

function play() {
  audio.play();
}

function download() {
  const blob = new Blob(recordedBlobs, {type: 'audio/mpeg'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  var name = a.href.toString().split("-").reverse()[0];
  a.download = name + '.mp3';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}