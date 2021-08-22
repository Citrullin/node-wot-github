/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import express = require("express");

const app = express();
const PORT = 3000;

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("nodejs - express + typescript");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
