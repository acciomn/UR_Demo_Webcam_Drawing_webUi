// import React, { useRef } from 'react';
// import Webcam from 'react-webcam';

// const Camera = ({ onCapture }) => {
//     const webcamRef = useRef(null);

//     const capture = () => {
//         const imageSrc = webcamRef.current.getScreenshot();
//         onCapture(imageSrc); // Send captured image to parent component
//     };

//     return (
//         <div>
//             <Webcam
//                 audio={false}
//                 ref={webcamRef}
//                 screenshotFormat="image/jpeg"
//                 width={400}
//                 height={300}
//             />
//             <button onClick={capture}>Capture Image</button>
//         </div>
//     );
// };

// export default Camera;

// // // src/components/Camera.js
// // import React, { useRef } from 'react';
// // import Webcam from 'react-webcam';

// // const Camera = ({ onCapture }) => {
// //     const webcamRef = useRef(null);

// //     const capture = () => {
// //         const imageSrc = webcamRef.current.getScreenshot();
// //         onCapture(imageSrc); // Send captured image to parent component
// //     };

// //     return (
// //         <div>
// //             <Webcam
// //                 audio={false}
// //                 ref={webcamRef}
// //                 screenshotFormat="image/jpeg"
// //                 width={400}
// //                 height={300}
// //             />
// //             <button onClick={capture}>Capture Image</button>
// //         </div>
// //     );
// // };

// // export default Camera;


import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import { Button, Box } from '@mui/material';

const Camera = ({ onCapture }) => {
    const webcamRef = useRef(null);

    const capture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        onCapture(imageSrc); // Send captured image to parent component
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={400}
                height={300}
            />
            <Button variant="contained" color="secondary" onClick={capture} sx={{ mt: 2 }}>
                Capture Image
            </Button>
        </Box>
    );
};

export default Camera;
