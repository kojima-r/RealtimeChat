import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import SummaryPanel from "./SummaryPanel";
import summaryPrompt from './summary_prompt.txt?raw';

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [sessionToken, setSessionToken] = useState("dummy");
  const [messages, setMessages] = useState([]);
  const [messageLen, setMessageLen] = useState(0);
  const [dataChannel, setDataChannel] = useState(null); //RTCDataChannel
  const [face, setFace] = useState("/assets/02_eye.gif");
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  const [inputSummaryPrompt, setInputSummaryPrompt] = useState(summaryPrompt)
  async function startSession() {
    // Get an ephemeral key from the Fastify server
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;
    console.log(tokenResponse)
    console.log(EPHEMERAL_KEY)
    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const baseUrl = "https://api.openai.com/v1/realtime";
    //const model = "gpt-4o-realtime-preview-2024-12-17";
    const model = "gpt-4o-realtime-preview-2025-06-03";
    //console.log("??2??")
    //console.log(offer.sdp)
    //console.log("??2??")
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const responseText = await sdpResponse.text()
    //console.log("??2??")
    //console.log(responseText)
    //console.log("??2??")
    const answer = {
      type: "answer",
      sdp: responseText,
    };
    //console.log("??3??")
    //console.log(answer)
    //console.log("??3??")
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message)); //messageをJsonStringにしてDataChanelから送信
      setEvents((prev) => [message, ...prev]);   //ログに追加
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  function events2messages(event_list) {
    const msgs = [];
    let deltaEvents = {};
    //console.log(events)
    event_list.forEach((event) => {
      if (event.type.endsWith("delta")) {
        if (deltaEvents[event.type]) {
          // for now just log a single event per render pass
          return;
        } else {
          deltaEvents[event.type] = event;
        }
      }
      /////
      const isClient = event.event_id && !event.event_id.startsWith("event_");
      var msg =null;
      //if(isClient && event.transcript && event.response.instructions){
      if(event.transcript && event.type.startsWith("response.audio_transcript")){
	const s = event.transcript
        msg= "アシスタント「"+s.replace(/[\r\n]+/g, '')+"」\n"
      }
      if(event.transcript && event.type.startsWith("conversation.item.input_audio_transcription")){
        const s =event.transcript
	msg="ユーザ「"+s.replace(/[\r\n]+/g, '')+"」\n"
      }
      if(msg!= null){
     	msgs.push(msg)
      }

    });
    ////
    return msgs
  }
  // Attach event listeners to the data channel when a new one is created
  // useEffectで画面がレンダリングされた後に動作
  useEffect(() => {
    if (dataChannel) { //!=null
      // Append new server events to the list
      // message: リモート ピアからメッセージを受信したときに送信されます 
      dataChannel.addEventListener("message", (e) => {
        setEvents((prev) => [JSON.parse(e.data), ...prev]); //prevの前にe.dataのjsonオブジェクトを追加
      });

      // Set session active when the data channel is opened
      // open:  データチャネルが最初に開かれたとき、また再度開かれたときに送信されます。
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
	//var s=new Date().toLocaleTimeString());
	const date=new Date();
	var s=date.toLocaleDateString()+"_"+date.toLocaleTimeString();
	s=s.replaceAll("/","_");
	console.log(s);
        setSessionToken(s);
	
      });
    }
  }, [dataChannel]);
  //console.log(events)
  useEffect(() => {
    var mmm=events2messages(events)
    setMessages(mmm)
    if(messageLen<mmm.length){
        setMessageLen(mmm.length)
        console.log(mmm[0])

        if(mmm[0].startsWith("アシスタント")){
            var tt=mmm[0].length
            const rand_flag = Math.random() < 0.2;
	    if(rand_flag){
   	      setFace("/assets/03_talk.gif");
	    }else{
   	      setFace("/assets/05_handTalk.gif")
	    }
            setTimeout(() => {
              setFace("/assets/02_eye.gif");
            }, 100*tt);
        console.log(">>>","/assets/03_talk.gif")
	}
        //console.log(">>>","/assets/03_talk.gif")
	//
    }
  }, [events]);
  return (
    <>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-[0%] flex overflow-y-auto">
		  <section className="w-[100%] top-0 left-0 right-0 bottom-0 px-4">
		    <img style={{ width: "100%" }} src={face} />
		  </section><br />
		  <section className="w-[100%] h-0 top-0 left-0 right-0 bottom-0 px-4">
		    <EventLog events={events}
	                      visible={false}
	            />
		  </section>
	  </section>
          <section className="absolute h-[90%] left-0 right-0 bottom-0 px-0">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
	      visible={false}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto invisible">
	  <SummaryPanel
            messages={messages}
	    preprompt={inputSummaryPrompt}
            sessionToken={sessionToken}
          />

	    <section className="h-[50%] w-full flex flex-col gap-4">
	      <div className="h-full bg-gray-50 rounded-md p-4">
		<h2 className="text-lg font-bold">Summary Prompt</h2>
		<textarea className="w-full h-[90%]" value={inputSummaryPrompt} type="text" onChange={(e) => setInputSummaryPrompt(e.target.value)} />
	      </div>
	    </section>
        </section>
      </main>
    </>
  );
}
/*
		  <section className="w-[100%] top-0 left-0 right-0 bottom-0 px-4">
          <img style={{ width: "100%" }} src="/assets/face01.jpg" />
		  </section><br />
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />

	  </section>
          <section className="absolute h-[50%] left-0 right-0 bottom-0 p-4">
	  */

