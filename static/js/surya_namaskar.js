document.addEventListener("DOMContentLoaded", () => {
  // Check if MediaPipe libraries are available. If not, wait for the window load event.
  if (typeof Pose === 'undefined' || typeof Camera === 'undefined') {
      console.warn("MediaPipe libraries not fully defined yet. Waiting for window load.");
      window.addEventListener('load', initializeYogaSathi);
  } else {
      initializeYogaSathi();
  }
});

function initializeYogaSathi() {
  console.log("Yoga Sathi : Page loaded and script running.");

  const videoElement = document.getElementById("webcam");
  const canvasElement = document.getElementById("output_canvas");
  const canvasCtx = canvasElement.getContext("2d");
  const poseNameEl = document.getElementById("poseName");
  const referenceImageEl = document.getElementById("referenceImage");
  const feedbackBox = document.getElementById("feedbackBox");
  const durationEl = document.getElementById("duration");
  const qualityEl = document.getElementById("quality");
  const startBtn = document.getElementById("startButton");
  const stopBtn = document.getElementById("stopButton");
  const poseTimerEl = document.getElementById("poseTimer");
  const initialMessageEl = document.getElementById("initialMessage");
  const accuracyBar = document.getElementById("accuracyBar");
  const mainContent = document.querySelector(".main-content");
  const webcamPanel = document.getElementById("webcamContainer");
  const backgroundMusic = document.getElementById("background-music");

  // Check if critical elements exist before proceeding
  if (!startBtn || !stopBtn || !videoElement) {
      console.error("Critical HTML elements missing. Cannot initialize.");
      return;
  }
    
  let sessionActive = false;
  let currentPoseIndex = 0;
  let poseTimerInterval = null;
  let isPoseTiming = false;
  let timeLeftForPose = 0;
  let sessionTimerInterval = null;
  let totalFrames = 0;
  let badFrames = 0;
  const synth = window.speechSynthesis;
  let lastSpokenMessage = "",
    lastSpokenTime = 0;

  function speak(text) {
    if (synth.speaking) return;
    if (text === lastSpokenMessage && Date.now() - lastSpokenTime < 5000)
      return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    synth.speak(utterance);
    lastSpokenMessage = text;
    lastSpokenTime = Date.now();
  }

  const suryaNamaskarSequence = [
    {
      name: "1. Pranamasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/1_Pranamasana.png",
      analysisFn: analyzePranamasana,
    },
    {
      name: "2. Hastauttanasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/2_Hastauttanasana.png",
      analysisFn: analyzeHastauttanasana,
    },
    {
      name: "3. Hastapadasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/3_Hastapadasana.png",
      analysisFn: analyzeHastapadasana,
    },
    {
      name: "4. Ashwa Sanchalanasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/4_Ashwa_Sanchalanasana.png",
      analysisFn: analyzeAshwaSanchalanasana,
    },
    {
      name: "5. Parvatasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/5_Parvatasana.png",
      analysisFn: analyzeParvatasana,
    },
    {
      name: "6. Ashtanga Namaskara",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/6_Ashtanga_Namaskara.png",
      analysisFn: analyzeAshtangaNamaskara,
    },
    {
      name: "7. Bhujangasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/7_Bhujangasana.png",
      analysisFn: analyzeBhujangasana,
    },
    {
      name: "8. Parvatasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/8_Parvatasana.png",
      analysisFn: analyzeParvatasana,
    },
    {
      name: "9. Ashwa Sanchalanasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/9_Ashwa_Sanchalanasana.png",
      analysisFn: analyzeAshwaSanchalanasana,
    },
    {
      name: "10. Hastapadasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/10_Hastapadasana.png",
      analysisFn: analyzeHastapadasana,
    },
    {
      name: "11. Hastauttanasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/11_Hastauttanasana.png",
      analysisFn: analyzeHastauttanasana,
    },
    {
      name: "12. Pranamasana",
      duration: 5,
      imageSrc: "/static/images/surya_namaskar/12_Pranamasana.png",
      analysisFn: analyzePranamasana,
    },
  ];

  function calculateAngle(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return 0;
    const r =
      Math.atan2(p3.y - p2.y, p3.x - p2.x) -
      Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let a = Math.abs((r * 180.0) / Math.PI);
    if (a > 180.0) a = 360 - a;
    return a;
  }
  function analyzeOverallAlignment(landmarks, feedback) {
    const ls = landmarks[11],
      rs = landmarks[12],
      lh = landmarks[23],
      rh = landmarks[24],
      n = landmarks[0];
    const sYd = Math.abs(ls.y - rs.y);
    if (sYd > 0.05) {
      feedback.m.push("अपने कंधों को एक सीध में रखें।");
      feedback.s -= 20;
    }
    const hYd = Math.abs(lh.y - rh.y);
    if (hYd > 0.05) {
      feedback.m.push("अपने कूल्हों को संतुलित रखें।");
      feedback.s -= 20;
    }
    const sCx = (ls.x + rs.x) / 2;
    const hXd = Math.abs(n.x - sCx);
    if (hXd > 0.05) {
      feedback.m.push("अपनी गर्दन सीधी रखें, सिर को बीच में रखें।");
      feedback.s -= 10;
    }
  }
  function analyzePranamasana(landmarks) {
    const f = { m: [], s: 100 };
    const lw = landmarks[15],
      rw = landmarks[16],
      n = landmarks[0];
    if (lw && rw && n) {
      const d = Math.abs(lw.x - rw.x);
      if (d > 0.1 || lw.y < n.y) {
        f.m.push("हाथों को छाती के सामने नमस्ते मुद्रा में लाएं।");
        f.s -= 50;
      }
    }
    analyzeOverallAlignment(landmarks, f);
    return f;
  }
  function analyzeHastauttanasana(landmarks) {
    const f = { m: [], s: 100 };
    const ls = landmarks[11],
      le = landmarks[13],
      lw = landmarks[15],
      rs = landmarks[12],
      re = landmarks[14],
      rw = landmarks[16];
    const la = calculateAngle(ls, le, lw),
      ra = calculateAngle(rs, re, rw);
    if (la < 160 || ra < 160) {
      f.m.push("हाथों को सीधा ऊपर उठाएं।");
      f.s -= 50;
    }
    if (lw.y > ls.y || rw.y > rs.y) {
      f.m.push("भुजाओं को पीछे की ओर झुकाएं।");
      f.s -= 50;
    }
    analyzeOverallAlignment(landmarks, f);
    return f;
  }
  function analyzeHastapadasana(landmarks) {
    const f = { m: [], s: 100 };
    const ls = landmarks[11],
      lh = landmarks[23],
      lk = landmarks[25];
    const lka = calculateAngle(lh, lk, landmarks[27]),
      ta = calculateAngle(ls, lh, lk);
    if (lka < 160) {
      f.m.push("घुटनों को सीधा रखने की कोशिश करें।");
      f.s -= 50;
    }
    if (ta > 80) {
      f.m.push("कमर से और नीचे झुकें।");
      f.s -= 50;
    }
    return f;
  }
  function analyzeAshwaSanchalanasana(landmarks) {
    const f = { m: [], s: 100 };
    const fk = landmarks[25],
      fh = landmarks[23],
      fa = landmarks[27],
      bk = landmarks[26],
      bh = landmarks[24],
      ba = landmarks[28];
    const fka = calculateAngle(fh, fk, fa),
      bla = calculateAngle(bh, bk, ba);
    if (fka < 80 || fka > 110) {
      f.m.push("आगे वाले घुटने को 90 डिग्री पर मोड़ें।");
      f.s -= 50;
    }
    if (bla < 150) {
      f.m.push("पीछे वाले पैर को सीधा फैलाएं।");
      f.s -= 50;
    }
    analyzeOverallAlignment(landmarks, f);
    return f;
  }
  function analyzeParvatasana(landmarks) {
    const f = { m: [], s: 100 };
    const ls = landmarks[11],
      lh = landmarks[23],
      la = landmarks[27],
      le = landmarks[13],
      lw = landmarks[15],
      lk = landmarks[25];
    const aa = calculateAngle(ls, le, lw),
      laa = calculateAngle(lh, lk, la),
      ba = calculateAngle(ls, lh, la);
    if (aa < 160 || laa < 160) {
      f.m.push("हाथ और पैर सीधे रखें।");
      f.s -= 50;
    }
    if (ba < 60 || ba > 110) {
      f.m.push("शरीर से उल्टा 'V' आकार बनाएं।");
      f.s -= 50;
    }
    return f;
  }
  function analyzeAshtangaNamaskara(landmarks) {
    const f = { m: [], s: 100 };
    const ls = landmarks[11],
      lh = landmarks[23];
    if (lh.y > ls.y) {
      f.m.push("कूल्हों को थोड़ा ऊपर उठाएं।");
      f.s -= 50;
    }
    if (ls.y < 0.6) {
      f.m.push("शरीर को ज़मीन के करीब लाएं।");
      f.s -= 50;
    }
    return f;
  }
  function analyzeBhujangasana(landmarks) {
    const f = { m: [], s: 100 };
    const ls = landmarks[11],
      lh = landmarks[23],
      le = landmarks[13];
    const ea = calculateAngle(ls, le, landmarks[15]);
    if (ls.y > lh.y) {
      f.m.push("छाती को ऊपर उठाएं।");
      f.s -= 50;
    }
    if (ea < 100) {
      f.m.push("कोहनियों को थोड़ा सीधा करें।");
      f.s -= 50;
    }
    return f;
  }


  // NEW FUNCTION: To get Django's CSRF cookie (required for POST requests)
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
  }

  // NEW FUNCTION: To handle saving data to the backend
  function saveSession(duration, totalFrames, badFrames) {
    const csrfToken = getCookie('csrftoken'); 
    
    fetch('/save_session/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken 
        },
        body: JSON.stringify({
            duration: duration,
            totalFrames: totalFrames,
            badFrames: badFrames
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Session saved response:', data);
        if (data.status === 'error') {
            console.error('Backend save error:', data.message);
        }
    })
    .catch(error => {
        console.error('Failed to send session data:', error);
    });
  }


  async function startSequence() {
    console.log("Start button clicked. Attempting to start sequence.");
    if (sessionActive) return; 

    try {
      // Step 1: Attempt to start the camera
      await camera.start();
      
      // Step 2: Only proceed if camera starts successfully
      if (backgroundMusic) backgroundMusic.play().catch(e => console.error("Audio playback failed:", e));

      initialMessageEl.style.display = "none";
      videoElement.classList.add("visible");
      canvasElement.classList.add("visible");
      sessionActive = true;
      currentPoseIndex = 0;
      totalFrames = 0;
      badFrames = 0;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      updatePoseUI();
      startSessionTimer();
      console.log("Sequence started successfully.");
    } catch (error) {
      // Step 3: Handle errors (e.g., user denying camera access)
      console.error("Failed to start camera:", error);
      initialMessageEl.style.display = "flex";
      initialMessageEl.innerHTML = `<h2>Camera Error</h2><p>Failed to start webcam. Please check permissions and ensure you are using HTTPS or localhost.</p>`;
      startBtn.disabled = false; 
      stopBtn.disabled = true;
    }
  }
  
  function stopSequence() {
    console.log("Stop button clicked. Attempting to stop sequence.");
    if (!sessionActive) return;

    if (camera.video) camera.stop();
    
    // FIX: Use standard pause() and reset currentTime
    if (backgroundMusic) {
        backgroundMusic.pause(); 
        backgroundMusic.currentTime = 0;
    }
    
    // Calculate final stats
    const finalDuration = parseInt(durationEl.textContent.replace('s', '')) || 0;
    const finalTotalFrames = totalFrames;
    const finalBadFrames = badFrames;
    const finalQuality = finalTotalFrames > 0
        ? Math.round(((finalTotalFrames - finalBadFrames) / finalTotalFrames) * 100)
        : 100;

    // Save session data to Django backend
    if (finalDuration > 0) {
        saveSession(finalDuration, finalTotalFrames, finalBadFrames);
    }

    // Update UI elements
    videoElement.classList.remove("visible");
    canvasElement.classList.remove("visible");
    initialMessageEl.style.display = "flex";
    sessionActive = false;
    clearInterval(poseTimerInterval);
    clearInterval(sessionTimerInterval);
    isPoseTiming = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    synth.cancel();
    feedbackBox.className = "feedback-box success"; 
    feedbackBox.textContent = `Session Stopped! Duration: ${finalDuration}s, Quality: ${finalQuality}%`;
    speak("Session stopped. Well done!");
    
    // Reset stats for the next session
    durationEl.textContent = "0s";
    qualityEl.textContent = "--%";
    accuracyBar.style.width = "0%";
    console.log("Sequence stopped and data saved (if duration > 0).");
  }

  function updatePoseUI() {
    const p = suryaNamaskarSequence[currentPoseIndex];
    poseNameEl.textContent = p.name;
    referenceImageEl.src = p.imageSrc;
    timeLeftForPose = p.duration;
    poseTimerEl.textContent = `${timeLeftForPose}s`;
    feedbackBox.className = "feedback-box";
    feedbackBox.textContent = `Get into ${p.name.split(".")[1].trim()} pose.`;
    speak(`अगला आसन: ${p.name.split(".")[1].trim()}`);
  }
  function advanceToNextPose() {
    clearInterval(poseTimerInterval);
    isPoseTiming = false;
    currentPoseIndex++;
    if (currentPoseIndex >= suryaNamaskarSequence.length) {
      feedbackBox.className = "feedback-box success";
      feedbackBox.textContent = "Surya Namaskar Complete! 🎉";
      speak("बधाई हो! आपने सूर्य नमस्कार पूरा कर लिया है।");
      stopSequence();
    } else {
      updatePoseUI();
    }
  }
  function startSessionTimer() {
    let s = 0;
    durationEl.textContent = "0s";
    qualityEl.textContent = "--%";
    sessionTimerInterval = setInterval(() => {
      if (!sessionActive) {
        clearInterval(sessionTimerInterval);
        return;
      }
      s++;
      durationEl.textContent = `${s}s`;
      const q =
        totalFrames > 0
          ? Math.round(((totalFrames - badFrames) / totalFrames) * 100)
          : 100;
      qualityEl.textContent = `${q}%`;
    }, 1000);
  }
  
  // ------------------------------------------
  // POSE AND CAMERA SETUP (Requires MediaPipe to be defined)
  // ------------------------------------------
  const pose = new Pose({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.poseLandmarks) {
      // Drawing logic removed for brevity but can be uncommented later
      if (sessionActive) {
        totalFrames++;
        const p = suryaNamaskarSequence[currentPoseIndex];
        const pf = p.analysisFn(results.poseLandmarks);
        const fs = Math.max(0, pf.s);
        accuracyBar.style.width = `${fs}%`;
        if (fs === 100) {
          feedbackBox.textContent = "बहुत बढ़िया! आसन बनाए रखें।";
          feedbackBox.className = "feedback-box success";
          if (!isPoseTiming) {
            isPoseTiming = true;
            speak("टाइमर शुरू।");
            poseTimerInterval = setInterval(() => {
              timeLeftForPose--;
              poseTimerEl.textContent = `${timeLeftForPose}s`;
              if (timeLeftForPose <= 0) {
                advanceToNextPose();
              }
            }, 1000);
          }
        } else {
          badFrames++;
          if (isPoseTiming) {
            clearInterval(poseTimerInterval);
            isPoseTiming = false;
            speak("मुद्रा गलत, टाइमर रुका।");
            timeLeftForPose = p.duration;
            poseTimerEl.textContent = `${timeLeftForPose}s`;
          }
          const fm = pf.m.join(" ");
          if (feedbackBox.textContent !== fm) {
            feedbackBox.textContent = fm || "Adjust your posture.";
            if (fm) speak(fm);
          }
          feedbackBox.className = "feedback-box warning";
        }
      }
    }
    canvasCtx.restore();
  }

  pose.onResults(onResults);
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      await pose.send({ image: videoElement });
    },
    width: 1280,
    height: 720,
  });

  //Effect for Webcam Panel
  mainContent.addEventListener("mousemove", (e) => {
    if (window.innerWidth <= 768) return; 

    const { width, height, left, top } = mainContent.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const centerX = width / 2;
    const centerY = height / 2;

    const deltaX = x - centerX;
    const deltaY = y - centerY;

    const rotateY = (deltaX / centerX) * 10; 
    const rotateX = -(deltaY / centerY) * 10;

    webcamPanel.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
  });

  mainContent.addEventListener("mouseleave", () => {
    
    webcamPanel.style.transform = "rotateY(0deg) rotateX(0deg)";
  });

  // Event Listeners (This part will now execute after initialization)
  startBtn.addEventListener("click", startSequence);
  stopBtn.addEventListener("click", stopSequence);
  console.log("Setup complete. Waiting for user to start.");
}