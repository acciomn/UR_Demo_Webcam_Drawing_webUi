// Assuming you are using plain JavaScript. If you are using React or another framework, the implementation will differ.

// Add this function to handle the button click
function sendToRobot(filename) {
    fetch('/send-to-robot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filename })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('File sent to robot successfully!');
        } else {
            alert('Failed to send file: ' + data.error);
        }
    })
    .catch(err => {
        alert('Error: ' + err);
    });
}

// Add this button to your render/UI logic (adjust as needed for your framework)
// Example for plain JS:
const button = document.createElement('button');
button.innerText = 'Send to Robot';
button.onclick = function() {
    // Replace 'yourfile.nc' with the actual filename or make it dynamic
    sendToRobot('yourfile.nc');
};
document.body.appendChild(button);