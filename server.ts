import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API endpoint to save the personalization configuration to defaultConfig.ts
  app.post("/api/save-config", (req, res) => {
    try {
      const config = req.body;
      if (!config || !config.herName || !config.specialDate) {
        return res.status(400).json({ error: "Invalid configuration structure." });
      }

      const filePath = path.join(process.cwd(), "src/data/defaultConfig.ts");
      
      // Generate clean TypeScript code for defaultConfig.ts
      const fileContent = `import { AppConfig } from '../types';

export const defaultConfig: AppConfig = ${JSON.stringify(config, null, 2)};
`;

      fs.writeFileSync(filePath, fileContent, "utf-8");
      console.log("Successfully saved configuration to src/data/defaultConfig.ts!");
      return res.json({ success: true, message: "Configuration saved to src/data/defaultConfig.ts successfully!" });
    } catch (error: any) {
      console.error("Error saving config:", error);
      return res.status(500).json({ error: error.message || "Failed to save configuration." });
    }
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
