let model, webcam, ctx, labelContainer, maxPredictions;
let gameStarted = false;
let currentInstruction = "";
let score = 0;

async function init() {
    const URL = "./my_model/";
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const size = 200;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

    gameStarted = true;
    generateInstruction();
    document.getElementById("startButton").style.display = "none";
    document.getElementById("stopButton").style.display = "block";
}

async function loop(timestamp) {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
        
        // Check if the prediction matches the instruction and has a high probability
        if(gameStarted && prediction[i].probability.toFixed(2) > 0.75) {
            if(currentInstruction === prediction[i].className) {
                increaseScore();
                generateInstruction();
            }
        }
    }

    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}

function generateInstruction() {
    const instructions = ["RIGHT", "LEFT"];
    currentInstruction = instructions[Math.floor(Math.random() * instructions.length)];
    document.getElementById("instruction").innerText = `현재 명령: ${currentInstruction}`;
}

function increaseScore() {
    score += 1;
    document.getElementById("score-display").innerText = `점수: ${score}`;
}

function stopGame() {
    gameStarted = false; // 게임 정지
    alert(`총점: ${score}`); // 총점을 시스템 메세지로 띄우기
    score = 0; // 점수 초기화
    document.getElementById("score-display").innerText = `점수: ${score}`; // 화면에 표시된 점수 업데이트
    
    // 정지 버튼을 숨기고 시작 버튼을 표시
    document.getElementById("startButton").style.display = "block";
    document.getElementById("stopButton").style.display = "none";
}
