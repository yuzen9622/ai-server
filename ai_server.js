const http = require("http");
const dotenv = require("dotenv");
dotenv.config(); /** 讀取.env檔案 */
/** 創建web server
 * 設定跨來源資源共用
 * 當收到data時以Buffer接收
 * 當data接收完畢時，將data轉成JSON格式
 * 設定ai_config
 * 發送post請求到api.aimlapi.com
 * 獲取回應後，將回應轉成JSON格式
 * 判斷回應是否為429，如果是則回傳500錯誤
 * 使用正則表達式取得回應中的JSON格式資料
 * 如果有取得JSON格式資料，回傳200並回傳JSON格式資料
 * 如果沒有取得JSON格式資料，回傳500錯誤
 */
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  /** 當url是/play時以及method是post才能進入 */
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
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: `Play tic-tac-toe with me. Current board: ${board}, you are X. Reply only in JSON:{ "position": number}(0~8)`,
          },
        ],
        temperature: 1,
        max_tokens: 50,
      };
      const response = await fetch("https://api.aimlapi.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BEARER_AUTH_KEY}`,
        },
        body: JSON.stringify(ai_config),
      });
      const data = await response.json();
      console.log(data);
      if (data.statusCode === 429) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "AI limit" }));
      }
      console.log(data.choices[0].message);
      const regex = /```json\n([\s\S]*?)\n```/;
      const match = data?.choices[0]?.message?.content?.match(regex);
      if (match) {
        const resBoard = JSON.parse(match[1].replace(/'/g, '"'));
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(resBoard));
      } else if (data?.choices[0]?.message) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(data?.choices[0]?.message.content);
      }
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "AI error" }));
    });
  } else {
    res.end("404 Not found");
  }
});
/**
 * 設定系統端口
 * 開始監聽port
 */
let port = process.env.PORT || 5000;
server.listen(port, () => console.log(`server is run at port ${port}`));
