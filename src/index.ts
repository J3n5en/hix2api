import * as uuid from "uuid";
import crypto from "node:crypto";
import { CookieJar } from "tough-cookie";
import { gotScraping } from "got-scraping";

const genDeviceId = async () => {
  const deviceId = crypto.createHash("md5").update(uuid.v4()).digest("hex");
  const f = "nvKTEonFAll-in-One AI Writing CopilotwNLf2plwvtlcCxam";
  const e = [
    crypto.createHash("md5").update(f).digest("hex"),
    deviceId,
    "xJ7fTJBgQ55/9r|",
  ].join("");
  const t = new TextEncoder().encode(e);
  const r = await crypto.subtle.digest("SHA-256", t);
  const n = Array.from(new Uint8Array(r));
  const s = n.map((e) => e.toString(16).padStart(2, "0")).join("");
  return {
    deviceId,
    deviceNumber: s,
  };
};

const chat = async () => {
  const cookieJar = new CookieJar();
  const http = gotScraping.extend({ cookieJar, responseType: "json" });
  const { deviceId, deviceNumber } = await genDeviceId();
  const { csrfToken } = await http
    .get("https://hix.ai/api/auth/csrf")
    .json<{ csrfToken: string }>();

  const response = await http
    .post("https://hix.ai/api/auth/callback/anonymous-user", {
      form: {
        redirect: false,
        version: "v1",
        deviceId,
        deviceNumber,
        csrfToken,
        callbackUrl: "https://hix.ai",
        json: true,
      },
    })
    .json();

  console.log(response);

  const chatResponse = await http
    .post("https://hix.ai/api/trpc/hixChat.createChat?batch=1", {
      // 85426 deepSeek-r1
      //85427 deepSeek-v3
      json: { "0": { json: { title: "test", botId: 85427 } } },
    })
    .json<any>();
  const chatId = chatResponse[0].result.data.json.id;

  let chat = await http.post("https://hix.ai/api/hix/chat", {
    responseType: "text",
    isStream: true,
    json: {
      chatId,
      question: "你好,我是Jason",
      fileUrl: "",
    },
  });
  let content = "";

  // 处理 SSE 数据流
  for await (const chunk of chat) {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data?.content) {
            console.log(data.content);
            content += data.content;
          }
        } catch (error) {
          // console.log(line, error);
          // 忽略解析错误
        }
      }
    }
  }

  console.log(content);

  chat = await http.post("https://hix.ai/api/hix/chat", {
    responseType: "text",
    isStream: true,
    json: {
      chatId,
      question: "我叫什么名字来着？",
      fileUrl: "",
    },
  });
  content = "";

  // 处理 SSE 数据流
  for await (const chunk of chat) {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data?.content) {
            console.log(data.content);
            content += data.content;
          }
        } catch (error) {
          // console.log(line, error);
          // 忽略解析错误
        }
      }
    }
  }

  console.log(content);
};
chat();
