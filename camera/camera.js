// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    const videoElement = document.getElementById("webcam");
    const statusElement = document.getElementById("status");
    const resolutionSelect = document.getElementById("resolution-select");
    const cameraToggle = document.getElementById("camera-toggle");
    const snapshotButton = document.getElementById("snapshot-button");

    // A predefined list of common resolutions to check against.
    const STANDARD_RESOLUTIONS = [
        { label: "640x480 (VGA)", width: 640, height: 480 },
        { label: "1280x720 (HD)", width: 1280, height: 720 },
        { label: "1920x1080 (Full HD)", width: 1920, height: 1080 },
        { label: "3840x2160 (4K)", width: 3840, height: 2160 },
    ];

    let currentStream; // To hold the current active stream
    let resolutionsPopulated = false; // Flag to check if we've populated the list

    // Function to stop the current video stream
    function stopCurrentStream() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
        videoElement.srcObject = null; // Clear the video display
        resolutionSelect.value = 'default'; // Reset dropdown
        snapshotButton.disabled = true;
    }

    // Populates the resolution dropdown based on the device's capabilities
    function populateResolutionSelector(track) {
        // Clear existing options except the first one ("Default")
        while (resolutionSelect.options.length > 1) {
            resolutionSelect.remove(1);
        }

        // Check if the browser can report capabilities
        if (typeof track.getCapabilities !== 'function') {
            console.warn("getCapabilities() not supported, falling back to a standard list.");
            STANDARD_RESOLUTIONS.forEach(res => {
                const option = document.createElement("option");
                option.value = `${res.width}x${res.height}`;
                option.textContent = res.label;
                resolutionSelect.appendChild(option);
            });
            return;
        }

        const capabilities = track.getCapabilities();
        STANDARD_RESOLUTIONS.forEach(res => {
            // Check if the resolution is within the camera's supported range
            if (capabilities.width && capabilities.height &&
                res.width <= capabilities.width.max && res.height <= capabilities.height.max) {
                const option = document.createElement("option");
                option.value = `${res.width}x${res.height}`;
                option.textContent = res.label;
                resolutionSelect.appendChild(option);
            }
        });
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

            // Populate the resolution selector if it hasn't been done yet
            if (!resolutionsPopulated) {
                const videoTrack = currentStream.getVideoTracks()[0];
                if (videoTrack) {
                    populateResolutionSelector(videoTrack);
                    resolutionsPopulated = true;
                }
            }

            // Update status with actual resolution once metadata is loaded.
            videoElement.onloadedmetadata = () => {
                if (!currentStream) return; // Stream might have been stopped in the meantime
                const track = currentStream.getVideoTracks()[0];
                const settings = track.getSettings();
                let statusText = `Camera feed active. Resolution: ${settings.width}x${settings.height}`;
                if (settings.frameRate) {
                    statusText += ` @ ${settings.frameRate} fps`;
                }
                statusElement.textContent = statusText;
            };

        } catch (error) {
            // Error: Display an error message
            console.error("Error accessing the webcam: ", error);
            statusElement.innerHTML = `<strong>Error accessing webcam:</strong> ${error.name} - ${error.message}.<br>The selected resolution might not be supported by your camera.`;
            statusElement.classList.add("text-danger");
            cameraToggle.checked = false; // Toggle off on error
            resolutionSelect.disabled = true;
            snapshotButton.disabled = true;
        }
    }

    // Function to take a snapshot
    function takeSnapshot() {
        if (!currentStream) {
            console.warn("Cannot take snapshot, stream is not active.");
            return;
        }

        // Create a canvas element dynamically to process the image
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Create a temporary link to trigger the download
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `snapshot-${timestamp}.png`;

        // Programmatically click the link to start the download and then remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            snapshotButton.disabled = false;
        } else {
            stopCurrentStream();
            statusElement.textContent = "Camera is off. Toggle on to see available resolutions.";
            resolutionSelect.disabled = true;
        }
    }

    // Add event listeners for the controls
    cameraToggle.addEventListener("change", handleControlsChange);
    resolutionSelect.addEventListener("change", handleControlsChange);
    snapshotButton.addEventListener("click", takeSnapshot);

    // Check if the browser supports the MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not supported by this browser.");
        statusElement.textContent = "Sorry, your browser does not support camera access.";
        statusElement.classList.add("text-danger");
        resolutionSelect.disabled = true;
        cameraToggle.disabled = true;
        snapshotButton.disabled = true;
        return;
    }

    // Set initial state on page load
    handleControlsChange();
});

// Send a "ready" message to Cockpit
cockpit.ready();