document.addEventListener("DOMContentLoaded", () => {
    console.log("Yoga Sathi: Sudarshan Kriya script loaded.");

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

    // --- Utility Functions (for angle and general alignment checks) ---
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
        
        // Check for level shoulders (Y-difference)
        const sYd = Math.abs(ls.y - rs.y);
        if (sYd > 0.05) {
            feedback.m.push("अपने कंधों को एक सीध में रखें।");
            feedback.s -= 15;
        }
        // Check for vertical spine alignment (Nose vs midpoint of hips) - Simplified for seated pose
        const hCx = (lh.x + rh.x) / 2;
        const nCx = n.x;
        const xOffset = Math.abs(nCx - hCx);
        if (xOffset > 0.05) {
            feedback.m.push("रीढ़ सीधी रखें, शरीर को बीच में संतुलित करें।");
            feedback.s -= 15;
        }
    }
    // --- End Utility Functions ---


    // --- Pose Analysis Functions for Sudarshan Kriya (Placeholders) ---
    function analyzeSeatedHandsOnLap(landmarks) {
        const f = { m: [], s: 100 };
        const rs = landmarks[12];
        const rh = landmarks[24];
        
        // Check for seated position (Simplified check)
        if (rh.y < 0.6) {
             f.m.push("आसन में ठीक से बैठें (वज्रासन या सुखासन)।");
             f.s -= 30;
        }

        // Check if hands are near the lap/knees
        if (landmarks[15].y < landmarks[23].y - 0.05 || landmarks[16].y < landmarks[24].y - 0.05) {
             f.m.push("हाथों को गोद में या घुटनों पर रखें।");
             f.s -= 20;
        }
        
        analyzeOverallAlignment(landmarks, f);
        return f;
    }
    
    function analyzeSeatedHandsToChest(landmarks) {
        const f = { m: [], s: 100 };
        const le = landmarks[13];
        const re = landmarks[14];
        const ls = landmarks[11];
        const rs = landmarks[12];
        
        // Check if arms are bent and hands are in front of the chest
        const chestX = (ls.x + rs.x) / 2;
        const avgWristX = (landmarks[15].x + landmarks[16].x) / 2;
        
        if (Math.abs(le.y - ls.y) > 0.1 || Math.abs(re.y - rs.y) > 0.1) {
            f.m.push("कोहनियों को फर्श के समानांतर (parallel) रखें।");
            f.s -= 30;
        }
        if (Math.abs(avgWristX - chestX) > 0.1) {
            f.m.push("हाथों को छाती के सामने लाएं।");
            f.s -= 30;
        }
        
        analyzeOverallAlignment(landmarks, f);
        return f;
    }
    
    function analyzeSeatedHandsBehindHead(landmarks) {
        const f = { m: [], s: 100 };
        const lw = landmarks[15];
        const rw = landmarks[16];
        const n = landmarks[0];
        const le = landmarks[13];
        const re = landmarks[14];

        // Check if hands are behind the head (y-coord of hands is higher than the nose)
        if (lw.y > n.y || rw.y > n.y) {
            f.m.push("हाथों को सिर के पीछे इंटरलॉक करें।");
            f.s -= 30;
        }
        
        // Check if arms are wide (Elbows should be wide apart)
        if (Math.abs(le.x - re.x) < 0.2) {
            f.m.push("कोहनियों को चौड़ा खोलें।");
            f.s -= 30;
        }

        analyzeOverallAlignment(landmarks, f);
        return f;
    }

    function analyzeSeatedFistsToShoulders(landmarks) {
        const f = { m: [], s: 100 };
        const ls = landmarks[11];
        const rs = landmarks[12];
        const lw = landmarks[15];
        const rw = landmarks[16];
        
        // Check if hands are near shoulders (Vertical alignment)
        if (Math.abs(lw.y - ls.y) > 0.1 || Math.abs(rw.y - rs.y) > 0.1) {
             f.m.push("मुट्ठी को कंधों के पास रखें।");
             f.s -= 30;
        }
        
        // Check if arms are close to the body/elbows pointing down (Horizontal alignment)
        if (Math.abs(lw.x - ls.x) > 0.1 || Math.abs(rw.x - rs.x) > 0.1) {
             f.m.push("कोहनियों को नीचे की ओर रखें।");
             f.s -= 30;
        }

        analyzeOverallAlignment(landmarks, f);
        return f;
    }

    function analyzeSeatedHandsOverhead(landmarks) {
        const f = { m: [], s: 100 };
        const la = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
        const ra = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
        
        // Check if arms are straight (angle near 180)
        if (la < 160 || ra < 160) {
            f.m.push("हाथों को पूरी तरह ऊपर की ओर सीधा करें।");
            f.s -= 30;
        }
        
        // Check if hands are over the head (y-coord of hands is very low, near the top of the frame)
        if (landmarks[15].y > 0.1 || landmarks[16].y > 0.1) {
            f.m.push("हथेलियों को छत की ओर रखें।");
            f.s -= 30;
        }

        analyzeOverallAlignment(landmarks, f);
        return f;
    }
    // --- End Pose Analysis Functions ---


    // --- Sudarshan Kriya Sequence ---
    const sudarshanKriyaSequence = [
        {
            name: "1. Seated Base Pose",
            duration: 5,
            imageSrc: "/static/images/sudarshan_kriya/1.png", // Using uploaded image 1.png
            analysisFn: analyzeSeatedHandsOnLap,
            instruction: "सीधे बैठें, रीढ़ सीधी, हाथ कमर पर रखें।"
        },
        {
            name: "2. Hands to Chest",
            duration: 5,
            imageSrc: "/static/images/sudarshan_kriya/2.png",
            analysisFn: analyzeSeatedHandsToChest,
            instruction: "हाथों को छाती के सामने, कोहनियों को बाहर निकालें।"
        },
        {
            name: "3. Hands Behind Head",
            duration: 5,
            imageSrc: "/static/images/sudarshan_kriya/3.png",
            analysisFn: analyzeSeatedHandsBehindHead,
            instruction: "हाथों को सिर के पीछे इंटरलॉक करें, कोहनियां चौड़ी रखें।"
        },
        {
            name: "4. Fists to Shoulders",
            duration: 5,
            imageSrc: "/static/images/sudarshan_kriya/4.png",
            analysisFn: analyzeSeatedFistsToShoulders,
            instruction: "मुट्ठी को कंधों के पास लाएं। तेज़ श्वास लें और छोड़ें।"
        },
        {
            name: "5. Hands Overhead",
            duration: 5,
            imageSrc: "/static/images/sudarshan_kriya/5.png",
            analysisFn: analyzeSeatedHandsOverhead,
            instruction: "हाथों को सीधा ऊपर उठाएं, श्वास को शांत करें।"
        },
    ];

    const currentSequence = sudarshanKriyaSequence; // Set the current sequence

    // --- Core Application Logic (Adapted from main.js) ---

    function updatePoseUI(sequence) {
        const p = sequence[currentPoseIndex];
        poseNameEl.textContent = p.name;
        referenceImageEl.src = p.imageSrc;
        timeLeftForPose = p.duration;
        poseTimerEl.textContent = `${timeLeftForPose}s`;
        feedbackBox.className = "feedback-box";
        feedbackBox.textContent = p.instruction;
        speak(`अगला चरण: ${p.name.split(".")[1].trim()}`);
    }
    
    function advanceToNextPose() {
        clearInterval(poseTimerInterval);
        isPoseTiming = false;
        currentPoseIndex++;
        if (currentPoseIndex >= currentSequence.length) {
            feedbackBox.className = "feedback-box success";
            feedbackBox.textContent = "Sudarshan Kriya Complete! 🎉";
            speak("बधाई हो! आपने क्रिया पूरी कर ली है।");
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