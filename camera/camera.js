// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    const videoElement = document.getElementById("webcam");
    const statusElement = document.getElementById("status");
    const resolutionSelect = document.getElementById("resolution-select");
    const cameraToggle = document.getElementById("camera-toggle");

    let currentStream; // To hold the current active stream

    // Function to stop the current video stream
    function stopCurrentStream() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
        videoElement.srcObject = null; // Clear the video display
    }

    // Function to start the video stream with given constraints
    async function startStream(constraints) {
        stopCurrentStream(); // Stop any existing stream first
        statusElement.textContent = "Requesting camera access...";
        statusElement.classList.remove("text-danger");

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStream = stream; // Store the new stream

            // Success: Attach the stream to the video element
            videoElement.srcObject = stream;

            // Update status with actual resolution once metadata is loaded.
            videoElement.onloadedmetadata = () => {
                if (!currentStream) return; // Stream might have been stopped in the meantime
                const track = currentStream.getVideoTracks()[0];
                const settings = track.getSettings();
                statusElement.textContent = `Camera feed active. Resolution: ${settings.width}x${settings.height}`;
            };

        } catch (error) {
            // Error: Display an error message
            console.error("Error accessing the webcam: ", error);
            statusElement.innerHTML = `<strong>Error accessing webcam:</strong> ${error.name} - ${error.message}.<br>The selected resolution might not be supported by your camera.`;
            statusElement.classList.add("text-danger");
            cameraToggle.checked = false; // Toggle off on error
            resolutionSelect.disabled = true;
        }
    }

    // Central handler for control changes
    function handleControlsChange() {
        if (cameraToggle.checked) {
            resolutionSelect.disabled = false;
            const selectedValue = resolutionSelect.value;
            let constraints = { video: true }; // Default

            if (selectedValue !== "default") {
                const [width, height] = selectedValue.split('x').map(Number);
                constraints = { video: { width: { ideal: width }, height: { ideal: height } } };
            }
            startStream(constraints);
        } else {
            stopCurrentStream();
            statusElement.textContent = "Camera is off.";
            resolutionSelect.disabled = true;
        }
    }

    // Add event listeners for the controls
    cameraToggle.addEventListener("change", handleControlsChange);
    resolutionSelect.addEventListener("change", handleControlsChange);

    // Check if the browser supports the MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not supported by this browser.");
        statusElement.textContent = "Sorry, your browser does not support camera access.";
        statusElement.classList.add("text-danger");
        resolutionSelect.disabled = true;
        cameraToggle.disabled = true;
        return;
    }

    // Set initial state on page load
    handleControlsChange();
});

// Send a "ready" message to Cockpit
cockpit.ready();