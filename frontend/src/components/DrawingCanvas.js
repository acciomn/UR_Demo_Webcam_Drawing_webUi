// import React, { useRef, useEffect } from 'react';

// const DrawingCanvas = () => {
//     const canvasRef = useRef(null);

//     useEffect(() => {
//         const canvas = canvasRef.current;
//         canvas.width = window.innerWidth; // Set canvas width
//         canvas.height = window.innerHeight; // Set canvas height
//         const ctx = canvas.getContext('2d');

//         const draw = (e) => {
//             ctx.fillStyle = 'black';
//             ctx.fillRect(e.clientX, e.clientY, 5, 5); // Draw a small square
//         };

//         canvas.addEventListener('mousemove', draw);
//         return () => {
//             canvas.removeEventListener('mousemove', draw);
//         };
//     }, []);

//     return <canvas ref={canvasRef} style={{ border: '1px solid black' }} />;
// };

// export default DrawingCanvas;


// src/components/DrawingCanvas.js
import React, { useRef, useEffect } from 'react';

const DrawingCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth; // Set canvas width
        canvas.height = window.innerHeight; // Set canvas height
        const ctx = canvas.getContext('2d');

        const draw = (e) => {
            ctx.fillStyle = 'black';
            ctx.fillRect(e.clientX, e.clientY, 5, 5); // Draw a small square
        };

        canvas.addEventListener('mousemove', draw);
        return () => {
            canvas.removeEventListener('mousemove', draw);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ border: '1px solid black' }} />;
};

export default DrawingCanvas;
