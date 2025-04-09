import { spawn } from "child_process";
import path from "path";
import { promises as fs } from "fs";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Allow larger image uploads
    },
  },
};

export default async function handler(req, res) {
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

    const inputPath = path.join(outputDir, "input.png");
    const outputPath = path.join(outputDir, "edges.png");

    // Save the input image
    await fs.writeFile(inputPath, buffer);

    // Call process_final.py
    const pyScript = path.join(process.cwd(), "scripts", "process_final.py");
    const py = spawn("python3", [pyScript, inputPath, outputPath, sensitivity.toString()], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    py.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    py.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python stderr: ${stderr}`);
        return res.status(500).json({ message: "Edge detection failed", error: stderr });
      }

      try {
        const result = JSON.parse(stdout);
        if (result.status === "error") {
          return res.status(500).json({ message: result.message });
        }

        res.status(200).json({
          message: "Edge detection successful",
          edges: "/images/edges.png",
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

