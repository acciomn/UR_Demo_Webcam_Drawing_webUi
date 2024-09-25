document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');
    const captureButton = document.getElementById('capture-button');
    const exitButton = document.getElementById('exit-button');
    const video = document.getElementById('video');
    const capturedImage = document.getElementById('captured-image');
    const savePath = document.getElementById('save-path');
    const loadButton = document.getElementById('load-button');
    const imageFile = document.getElementById('image-file');

    startButton.addEventListener('click', function() {
        fetch('/start_camera', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'Camera started') {
                    video.style.visibility = 'visible'; // Make video visible
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

    captureButton.addEventListener('click', function() {
        fetch('/capture_image', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'Image captured successfully') {
                    capturedImage.src = data.image_url;
                    capturedImage.style.display = 'block';
                    savePath.textContent = `Image saved at: ${data.image_url}`;
                } else {
                    console.error('Error:', data.status);
                }
            })
            .catch(error => console.error('Error:', error));
    });

    exitButton.addEventListener('click', function() {
        fetch('/exit', { method: 'POST' })
            .then(response => response.text())
            .then(data => {
                video.style.visibility = 'hidden'; // Hide video but keep its space
                capturedImage.src = '';
                savePath.textContent = '';
                console.log(data);
            })
            .catch(error => console.error('Error:', error));
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
});
