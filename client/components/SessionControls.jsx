import { useEffect, useRef, useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";
import promptTextData from './prompt.txt?raw';



function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  return (
    <div className="flex items-left justify-center w-[50%] h-full">
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

function SessionActive({ stopSession, sendTextMessage, sendClientEvent, visible}) {
  const [message, setMessage] = useState("");
  const [inputText, setInputElement] = useState(promptTextData);
  const [isActivating, setIsActivating] = useState(false);

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }
  //console.log(promptTextData);
  const init_response = {
            "type": "session.update",
            "session": {
                "modalities": ["audio", "text"],
                "instructions": inputText,
		"voice": "shimmer",
                "input_audio_transcription": {
                      "model": "whisper-1",
                      "language": "ja",
                },
            }
        }
  function handleStartSession() {
    if (isActivating) return;
    setIsActivating(true);
    sendClientEvent(init_response);
  }
  useEffect(() => {
    handleStartSession();
  });
  if(!visible){
  	return (
		<div>
		</div>
	);
  }
  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
    <div className="flex items-center justify-center w-full h-32 gap-2">
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
    <div className="flex items-center justify-center w-full h-full gap-4">
      <textarea className="w-full h-full" value={inputText} onChange={(e) => setInputElement(e.target.value)} type="text" />
    </div>
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
  visible,
}) {
  return (
    <div>
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
          visible={visible}
        />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </div>
  );
}
