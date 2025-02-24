import Cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { promises as fs } from "fs";

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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Allow larger image uploads
    },
  },
};

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { image, sensitivity = 50 } = req.body;

  if (!image) {
    return res.status(400).json({ message: "No image provided" });
  }

  try {
    // Remove base64 prefix and convert to buffer
    const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), "base64");

    const outputDir = path.resolve("./public/images");
    await fs.mkdir(outputDir, { recursive: true });

    const originalPath = path.join(outputDir, "original.png");
    const adjustedPath = path.join(outputDir, "adjusted.png");
    const svgPath = path.join(outputDir, "adjusted.svg");
    const gcodePath = path.join(outputDir, "output.ncc");

    // Save the original image
    await fs.writeFile(originalPath, buffer);

    // Call process_image.py using the virtual environment's Python
    const pyScript = path.join(process.cwd(), "scripts", "process_image.py");
    const venvPython = path.join(process.cwd(), "venv", "bin", "python3"); // Path to virtual env Python
    const py = spawn(venvPython, [pyScript, originalPath, adjustedPath, svgPath, gcodePath, sensitivity.toString()], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => {
      stdout += data.toString();
      console.log(`Python stdout: ${data}`);
    });

    py.stderr.on("data", (data) => {
      stderr += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    py.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({ message: "Processing pipeline failed", error: stderr });
      }

      try {
        const result = JSON.parse(stdout);
        if (result.status === "error") {
          return res.status(500).json({ message: result.message });
        }

        // Verify all files exist
        const files = [
          result.original_path,
          result.adjusted_path,
          result.svg_path,
          result.gcode_path,
        ];
        for (const file of files) {
          if (!fs.existsSync(file)) {
            return res.status(500).json({ message: `File not saved: ${file}` });
          }
        }

        res.status(200).json({
          message: "Processing successful",
          original: "/images/original.png",  // Original PNG
          adjusted: "/images/adjusted.png",  // Background-removed + edges PNG
          svg: "/images/adjusted.svg",
          gcode: "/images/output.ncc",
        });
      } catch (e) {
        console.error(`Invalid Python output: ${stdout}`);
        res.status(500).json({ message: "Invalid Python output", error: e.message });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
}