document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');
    const captureButton = document.getElementById('capture-button');
    const exitButton = document.getElementById('exit-button');
    const clearButton = document.getElementById('clear-button');
    const video = document.getElementById('video');
    const capturedImage = document.getElementById('captured-image');
    const processedImage = document.getElementById('processed-image');
    const savePath = document.getElementById('save-path');
    const loadButton = document.getElementById('load-button');
    const imageFile = document.getElementById('image-file');
    const processButton = document.getElementById('process-button');

    startButton.addEventListener('click', function() {
        fetch('/start_camera', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'Camera started') {
                    video.style.visibility = 'visible'; // Make video visible
                    capturedImage.style.display = 'none'; // Hide captured image
                    video.src = '/video_feed'; // Reset video feed source
                }
            })
            .catch(error => console.error('Error:', error));
    });

    stopButton.addEventListener('click', function() {
        fetch('/stop_camera', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'Camera stopped') {
                    video.style.visibility = 'hidden'; // Hide video but keep its space
                }
            })
            .catch(error => console.error('Error:', error));
    });

    captureButton.addEventListener('click', async function() {
        try {
            const response = await fetch('/capture_image', { method: 'POST' }); // Capture image
            const result = await response.json(); // Convert response to JSON
            if (result.status === 'Image captured successfully') {
                // Stop the camera
                await fetch('/stop_camera', { method: 'POST' });

                // Update the video container with the captured image
                video.src = result.image_url;

                capturedImage.src = result.image_url; // Update the captured image container
            } else {
                console.error(result.status);
            }
        } catch (error) {
            console.error('Error capturing image:', error);
        }
    });

    exitButton.addEventListener('click', function() {
        fetch('/exit', { method: 'POST' })
            .then(response => response.text())
            .then(data => {
                video.src = ''; // Reset video feed source
                video.style.visibility = 'hidden'; // Hide video but keep its space
                capturedImage.src = ''; // Reset captured image source
                capturedImage.style.visibility = 'visible'; // Hide captured image but keep its space
                savePath.textContent = '';
                console.log(data);
            })
            .catch(error => console.error('Error:', error));
    });

    clearButton.addEventListener('click', function() {
        fetch('/clear_images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'All images cleared successfully') {
                alert('All images have been cleared.');
                // Optionally, you can add code here to update the UI
            } else {
                alert('Error clearing images: ' + data.status);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while clearing images.');
        });
    });

    loadButton.addEventListener('click', function() {
        imageFile.click();
    });

    imageFile.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('image_path', file.name);

            fetch('/load_image', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'Image loaded successfully') {
                    capturedImage.src = data.image_url;
                    capturedImage.style.display = 'block';
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });

    processButton.addEventListener('click', async function() {
        try {
             // Get the image path from the captured image element
            const capturedImage = document.getElementById('captured-image');
            const imagePath = capturedImage.src;

            // Send the image path in the POST request
            const response = await fetch('/process_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image_path: imagePath })
            });

            // Convert the response to JSON
            const result = await response.json();

            if (result.status === 'Image converted to SVG successfully') {
                // Get the processed image element
                const processedImage = document.getElementById('captured-image');
                // Update the captured image with the converted image
                processedImage.src = result.svg_url;
                // Show the converted image
                processedImage.visibility = 'visible';
                processedImage.style.display = 'block';

                // Display the saved path
                const savePath = document.getElementById('save-path');
                savePath.textContent = `Saved Path: ${result.svg_url}`;

            } else {
                console.error(result.status);
            }
        } catch (error) {
            console.error('Error processing image:', error);
        }
    });
});
