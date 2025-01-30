let btn = document.querySelector("#btn");
let content = document.querySelector("#content");
let voice = document.querySelector("#voice")

function speak(text) {
  // Create a SpeechSynthesisUtterance object
  let text_speak = new SpeechSynthesisUtterance(text);
  text_speak.rate = 1;
  text_speak.pitch = 1;
  text_speak.volume = 1;
  text_speak.lang = "hi-GB"; // Corrected to use a valid language code
  window.speechSynthesis.speak(text_speak);
}

function wishMe() {
  let day = new Date();
  let hours = day.getHours();
  if (hours >= 0 && hours < 12) {
    speak("Good Morning, Sir");
  } else if (hours >= 12 && hours < 16) {
    speak("Good Afternoon, Sir");
  } else {
    speak("Good Evening, Sir");
  }
}

// Greet user on page load
window.addEventListener("load", () => {
  wishMe();
});

let speechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new speechRecognition();

recognition.onresult = (event) => {
  let currentIndex = event.resultIndex;
  let transcript = event.results[currentIndex][0].transcript.trim(); // Ensure trimmed text
  content.innerText = transcript;
  console.log("User said:", transcript); // Debugging log
  takeCommand(transcript.toLowerCase()); // Normalize text for case-insensitive match
};

btn.addEventListener("click", () => {
  recognition.start();
  btn.style.display="none"
  voice.style.display="block"
});

function takeCommand(message) {
  btn.style.display="flex"
  voice.style.display="none"
  console.log("Processing command:", message); // Debugging log
  if (message.includes("hello") || message.includes("hey")) {
    speak("Hello sir, what can I help you with?");
  } else if (message.includes("who are you")) {
    speak("I am your virtual assistant, created by Rohit sir.");
  }
    else if (message.includes("How are you ")) {
      speak("I am fine ");
  } else if (message.includes("open youtube")) {
    speak("Opening YouTube");
    window.open("https://www.youtube.com/", "_blank");
  }
  else if (message.includes("open google")) {
    speak("Opening google");
    window.open("https://www.google.com/", "_blank");
  }
  else if (message.includes("open facebook")) {
    speak("Opening facebook");
    window.open("https://www.facebook.com/", "_blank");
  }
  else if (message.includes("open instagram")) {
    speak("Opening instagram");
    window.open("https://www.instagram.com/", "_blank");
  }
  else if (message.includes("open chatgpt")) {
    speak("Opening chatgpt");
    window.open("https://www.chatgpt.com/", "_blank");
  }
  
  else if (message.includes("open calculator")) {
    speak("Opening calculator");
    window.open("calculator://");
  }
  else if (message.includes("time")) {
    let time=new Date().toLocaleString(undefined,{hour:"numeric",minute:"numeric"})
    speak(time)
  }
  else if (message.includes("date")) {
    let date=new Date().toLocaleString(undefined,{day:"numeric",month:"short",year:"numeric"})
    speak(date)
  }
   
  else{ 
    let finalText="This is what i found on internet regarding"+message.replace("shipra","")|| message.replace("shifra","")
    speak(finalText)
    window.open(`https://www.google.com/search?q=${message.replace("shipra","")}`,"_blank")
  }
}
