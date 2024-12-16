import Cors from "cors";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const cors = Cors({
  origin: "*",
  methods: ["POST"],
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method === "POST") {
    const { image, sensitivity } = req.body;

    try {
      const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), "base64");

      const outputDir = path.resolve("./public/images");
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const originalPath = path.join(outputDir, "original.png");
      const adjustedPath = path.join(outputDir, "adjusted.png");
      const svgPath = path.join(outputDir, "adjusted.svg");
      const gcodePath = path.join(outputDir, "output.ncc");

      fs.writeFileSync(originalPath, buffer);

      const pythonProcess = spawn("python3", [
        "./scripts/process_image.py",
        originalPath,
        adjustedPath,
        svgPath,
        gcodePath,
        sensitivity.toString(),
      ]);

      pythonProcess.stdout.on("data", (data) => console.log(`Python stdout: ${data}`));
      pythonProcess.stderr.on("data", (data) => console.error(`Python stderr: ${data}`));

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          return res.status(500).json({ message: "Processing pipeline failed." });
        }
        res.status(200).json({
          message: "Processing successful.",
          original: "/images/original.png",
          adjusted: "/images/adjusted.png",
          svg: "/images/adjusted.svg",
          gcode: "/images/output.ncc",
        });
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "An error occurred.", error: error.toString() });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
