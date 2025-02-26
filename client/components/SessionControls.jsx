import { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";

function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Button
        onClick={handleStartSession}
        className={isActivating ? "bg-gray-600" : "bg-red-600"}
        icon={<CloudLightning height={16} />}
      >
        {isActivating ? "starting session..." : "start session"}
      </Button>
    </div>
  );
}

function SessionActive({ stopSession, sendTextMessage, sendClientEvent }) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }
  const init_response = {
            "type": "response.create",
            "response": {
                "modalities": ["audio", "text"],
                //"instructions": "あなたはタスク管理のアシスタントAIです。ユーザのタスクを聞いて、ユーザからタスクについて聞かれた場合はタスクの内容について教えてください。",
                "instructions": `
あなたは朝倉みなみ、女の子、17歳野球部のマネージャで、対話のアシスタントです、あなたはほめ上手で前向きな返答をしてください。
相手の価値観を探る質問と共感をペアにして会話してください。
以下が質問と回答例になります。複唱と深堀をしつつこれらをまねてしゃべりなさい。
		    ①私は、浅倉みなみです。熊本高校に通っていて、野球部のマネージャーをしています。貴大さんは、どんな学校に通っていますか？
**想定回答**: 〇〇高校に通っています。
**共感**: 〇〇高校なんですね！どんなところが好きですか？
②私のことは、みなみって呼んでください！貴大さんってお呼びしてもいいですか？
**想定回答**: はい、もちろん。
**共感**: ありがとうございます！貴大さんとお話しできるのが楽しみです。
③貴大さん、今から10分くらいお話しする時間ありますか？私も最近、友達と話す時間が大好きなんです。
**想定回答**: はい、時間あります。
**共感**: ありがとうございます！お話しできるのが嬉しいです。

		    `,
                "voice": "shimmer"
            }
        }
  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      <input
        onKeyDown={(e) => {
          //console.log(message)
          if (e.key === "Enter" && message.trim()) {
            handleSendClientEvent();
          }
        }}
        type="text"
        placeholder="send a text message..."
        className="border border-gray-200 rounded-full p-4 flex-1"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        onClick={() => {
          if (message.trim()) {
            handleSendClientEvent();
          }
        }}
        icon={<MessageSquare height={16} />}
        className="bg-blue-400"
      >
        interrupting prompt
      </Button>
      <Button
        onClick={() => {
          sendClientEvent(init_response);
        }}
        icon={<MessageSquare height={16} />}
        className="bg-blue-400"
      >
        preset prompt
      </Button>
      <Button onClick={stopSession} icon={<CloudOff height={16} />}>
        disconnect
      </Button>
    </div>
  );
}

export default function SessionControls({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
}) {
  return (
    <div className="flex gap-4 border-t-2 border-gray-200 h-full rounded-md">
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
        />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </div>
  );
}
