import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });
const port = Number(process.env.PORT ?? 3001);

createApp().listen(port, () => {
  console.log(`chikameshi API listening on port ${port}`);
});
