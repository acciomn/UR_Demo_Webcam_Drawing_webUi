// // import { spawn } from "child_process";
// // import path from "path";
// // import { promises as fs } from "fs";

// // export const config = {
// //   api: {
// //     bodyParser: {
// //       sizeLimit: "50mb",
// //     },
// //   },
// // };

// // export default async function handler(req, res) {
// //   if (req.method !== "POST") {
// //     return res.status(405).json({ error: "Method not allowed" });
// //   }

// //   const { image, sensitivity = 50 } = req.body;

// //   const imagesDir = path.join(process.cwd(), "public", "images");
// //   await fs.mkdir(imagesDir, { recursive: true });

// //   const pyScript = path.join(process.cwd(), "scripts", "process_final.py");

// //   const py = spawn("python3", [pyScript], { stdio: ["pipe", "pipe", "pipe"] });

// //   let stdout = "";
// //   let stderr = "";

// //   py.stdout.on("data", (data) => {
// //     stdout += data.toString();
// //   });

// //   py.stderr.on("data", (data) => {
// //     stderr += data.toString();
// //   });

// //   py.on("close", (code) => {
// //     if (code !== 0) {
// //       return res.status(500).json({ error: stderr });
// //     }
// //     try {
// //       const result = JSON.parse(stdout);
// //       res.status(200).json(result);
// //     } catch (e) {
// //       res.status(500).json({ error: "Invalid Python output" });
// //     }
// //   });

// //   py.stdin.write(JSON.stringify({ image, sensitivity, output_dir: imagesDir }));
// //   py.stdin.end();
// // }
// // // 

// import { spawn } from "child_process";
// import path from "path";
// import { promises as fs } from "fs";

// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: "50mb",
//     },
//   },
// };

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   const { image, sensitivity = 50 } = req.body;

//   const imagesDir = path.join(process.cwd(), "public", "images");
//   await fs.mkdir(imagesDir, { recursive: true });

//   const pyScript = path.join(process.cwd(), "scripts", "process_final.py");

//   const py = spawn("python3", [pyScript], { stdio: ["pipe", "pipe", "pipe"] });

//   let stdout = "";
//   let stderr = "";

//   py.stdout.on("data", (data) => {
//     stdout += data.toString();
//   });

//   py.stderr.on("data", (data) => {
//     stderr += data.toString();
//   });

//   py.on("close", (code) => {
//     if (code !== 0) {
//       return res.status(500).json({ error: stderr });
//     }
//     try {
//       const result = JSON.parse(stdout);
//       res.status(200).json(result);
//     } catch (e) {
//       res.status(500).json({ error: "Invalid Python output" });
//     }
//   });

//   py.stdin.write(JSON.stringify({ image, sensitivity, output_dir: imagesDir }));
//   py.stdin.end();
// }


import { spawn } from "child_process";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { edgesPath } = req.body;

    const process = spawn("python3", [
      "./scripts/process_final.py",
      edgesPath,
    ]);

    let result = "";
    process.stdout.on("data", (data) => {
      result += data.toString();
    });

    process.on("close", () => {
      const output = JSON.parse(result);
      res.status(200).json(output);
    });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
