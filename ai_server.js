const http = require("http");
const dotenv = require("dotenv");
const { error } = require("console");
dotenv.config();

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/play" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString(); // chunk 是 Buffer，需要轉成字串
    });
    req.on("end", async () => {
      console.log(JSON.parse(body).board);

      body = JSON.parse(body);
      const board = body.board;
      const ai_config = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Play tic-tac-toe with me. Current board: ${board}, you are X. Reply only in JSON:{ "position": number}`,
          },
        ],
        temperature: 1,
        max_tokens: 50,
      };
      const response = await fetch("https://api.aimlapi.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 8b9638d52dd940cd886b2cb8008a9b25",
        },
        body: JSON.stringify(ai_config),
      });
      const data = await response.json();
      console.log(data);
      if (data.statusCode === 429) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "AI limit" }));
      }

      const regex = /```json\n([\s\S]*?)\n```/;
      const match = data?.choices[0]?.message?.content?.match(regex);
      if (match) {
        const resBoard = JSON.parse(match[1].replace(/'/g, '"'));
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(resBoard));
        console.log(resBoard); // Output: ['O', 'X', 'X', '', '', '', '', 'O', '']
      }
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "AI error" }));
    });
  } else {
    res.end("404 Not found");
  }
});
let port = process.env.PORT || 5000;
server.listen(port, () => console.log(`server is run at port ${port}`));
