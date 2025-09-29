document.addEventListener("DOMContentLoaded", () => {
    console.log("Yoga Sathi: Trikonasana script loaded.");

    // --- DOM Elements (Same as other JS files) ---
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
    
    // --- Utility Functions ---
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
              rs = landmarks[12];
        const sYd = Math.abs(ls.y - rs.y);
        // Check for level shoulders 
        if (sYd > 0.10) { 
            feedback.m.push("कंधों को सीधा रखें।");
            feedback.s -= 10;
        }
    }
    // --- End Utility Functions ---


    // --- Pose Analysis Functions for Trikonasana ---
    function analyzeTrikonasanaLeft(landmarks) {
        const f = { m: [], s: 100 };
        // Points: Right Knee (26), Right Ankle (28); Left Shoulder (11), Left Hip (23), Left Knee (25)
        
        const rka = calculateAngle(landmarks[24], landmarks[26], landmarks[28]); 
        const lh_lk_ra = calculateAngle(landmarks[23], landmarks[25], landmarks[27]); 

        // 1. Front Leg (Left) must be straight (Knee angle near 180)
        if (lh_lk_ra < 160) {
            f.m.push("बाएँ घुटने को सीधा करें।");
            f.s -= 30;
        }

        // 2. Back Leg (Right) must be straight (Knee angle near 180)
        if (rka < 160) {
            f.m.push("दाएँ घुटने को सीधा करें।");
            f.s -= 30;
        }

        // 3. Torso Bend Check 
        const sideAngle = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
        
        if (sideAngle < 120 || sideAngle > 170) {
             f.m.push("धड़ को और झुकाएं, या पैर फैलाएं।");
             f.s -= 30;
        }

        // 4. Arms vertical alignment (Right hand up)
        const rightArmAngle = calculateAngle(landmarks[14], landmarks[12], landmarks[24]);
        if (rightArmAngle < 160) {
            f.m.push("ऊपर वाले (दाएँ) हाथ को सीधा आसमान की ओर उठाएं।");
            f.s -= 20;
        }
        
        analyzeOverallAlignment(landmarks, f);
        return f;
    }
    
    // Reverse logic for the right side
    function analyzeTrikonasanaRight(landmarks) {
        const f = { m: [], s: 100 };
        // Points: Left Knee (25), Left Ankle (27); Right Shoulder (12), Right Hip (24), Right Knee (26)
        
        const lka = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
        const rh_rk_la = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);

        // 1. Front Leg (Right) must be straight
        if (rh_rk_la < 160) {
            f.m.push("दाएँ घुटने को सीधा करें।");
            f.s -= 30;
        }

        // 2. Back Leg (Left) must be straight
        if (lka < 160) {
            f.m.push("बाएँ घुटने को सीधा करें।");
            f.s -= 30;
        }
        
        // 3. Torso Bend Check 
        const sideAngle = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
        
        if (sideAngle < 120 || sideAngle > 170) {
             f.m.push("धड़ को और झुकाएं, या पैर फैलाएं।");
             f.s -= 30;
        }

        // 4. Arms vertical alignment (Left hand up)
        const leftArmAngle = calculateAngle(landmarks[13], landmarks[11], landmarks[23]);
        if (leftArmAngle < 160) {
            f.m.push("ऊपर वाले (बाएँ) हाथ को सीधा आसमान की ओर उठाएं।");
            f.s -= 20;
        }
        
        analyzeOverallAlignment(landmarks, f);
        return f;
    }
    // --- End Pose Analysis Functions ---


    // --- Trikonasana Sequence ---
    const trikonasanaSequence = [
        {
            name: "1. Trikonasana (Left Side)",
            duration: 30, // Hold for 30 seconds
            imageSrc: "images/asanas/Trikonasana.png",
            analysisFn: analyzeTrikonasanaLeft, 
            instruction: "बाएँ पैर को आगे करके त्रिकोणासन (Trikonasana) की मुद्रा में 30 सेकंड के लिए आएं।"
        },
        {
            name: "2. Trikonasana (Right Side)",
            duration: 30, // Hold for 30 seconds
            imageSrc: "images/asanas/Trikonasana.png",
            analysisFn: analyzeTrikonasanaRight,
            instruction: "मुद्रा बदलकर, दाएँ पैर को आगे करके त्रिकोणासन की मुद्रा में 30 सेकंड के लिए आएं।"
        },
    ];

    const currentSequence = trikonasanaSequence; // Set the current sequence

    // --- Core Application Logic (Copied from sudarshan_kriya.js) ---

    function updatePoseUI(sequence) {
        const p = sequence[currentPoseIndex];
        poseNameEl.textContent = p.name;
        referenceImageEl.src = p.imageSrc;
        timeLeftForPose = p.duration;
        poseTimerEl.textContent = `${timeLeftForPose}s`;
        feedbackBox.className = "feedback-box";
        feedbackBox.textContent = p.instruction;
        speak(`${p.name} के लिए तैयार हो जाएं।`);
    }
    
    function advanceToNextPose() {
        clearInterval(poseTimerInterval);
        isPoseTiming = false;
        currentPoseIndex++;
        if (currentPoseIndex >= currentSequence.length) {
            feedbackBox.className = "feedback-box success";
            feedbackBox.textContent = "Trikonasana Complete! 🎉";
            speak("बधाई हो! आसन पूरा हुआ।");
            stopSequence();
        } else {
            updatePoseUI(currentSequence);
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
        
        if (results.poseLandmarks && sessionActive) {
            totalFrames++;
            const p = currentSequence[currentPoseIndex];
            const pf = p.analysisFn(results.poseLandmarks);
            const fs = Math.max(0, pf.s);
            accuracyBar.style.width = `${fs}%`;
            
            if (fs === 100) {
                feedbackBox.textContent = "उत्कृष्ट! मुद्रा बनाए रखें।";
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
    
    async function startSequence() {
        try {
            await camera.start();
            backgroundMusic.play();

            initialMessageEl.style.display = "none";
            videoElement.classList.add("visible");
            canvasElement.classList.add("visible");
            sessionActive = true;
            currentPoseIndex = 0;
            totalFrames = 0;
            badFrames = 0;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            updatePoseUI(currentSequence);
            startSessionTimer();
        } catch (error) {
            console.error("Failed to start camera:", error);
            initialMessageEl.innerHTML = `<h2>Camera Error</h2><p>Please check permissions.</p>`;
        }
    }
    
    function stopSequence() {
        if (camera.video) camera.stop();
        if (backgroundMusic) {
             backgroundMusic.pause();
             backgroundMusic.currentTime = 0;
        }
        
        // TODO: Implement Django session save logic here

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
        feedbackBox.className = "feedback-box";
        feedbackBox.textContent = "Session Stopped. Well done!";
        speak("Session stopped. Well done!");
    }
    
    // Add event listeners for start/stop buttons
    startBtn.addEventListener("click", startSequence);
    stopBtn.addEventListener("click", stopSequence);
    
    // Add tilt effect logic if needed
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

});