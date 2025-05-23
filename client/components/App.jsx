import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import SummaryPanel from "./SummaryPanel";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null); //RTCDataChannel
  const [messages, setMessages] = useState([]);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  const [inputSummaryPrompt, setInputSummaryPrompt] = useState(`
 この後のアシスタントとユーザの対話から、ユーザの情報に関して以下の項目を埋めて、箇条書きにしてください、データがない場合は「no data」としてください
大項目	小項目
基本情報	氏名
	生年月日
	年齢
	性別
	連絡先
身体基本情報	身長
	体重
	体重の増減
	ウエストサイズ
	血液型
現病歴	
家族歴	遺伝性疾患の家族歴
	疑う疾患に関連する家族歴
既往歴	現在の病名
	通院開始時期
	通院している医療機関
	過去の病名
	通院開始時期
	通院していた医療機関
	手術歴
	輸血歴
	健診異常の有無
内服歴	処方薬
	サプリメント
アレルギー	薬剤アレルギー
	食物アレルギー
	ペットアレルギー
	金属アレルギー
	喘息
	花粉症
	造影剤アレルギー
生活歴	飲酒
	喫煙
	ADL
	家族構成
	婚姻状態
	子供有無
	同居している家族
	職業歴
	居住歴
	信仰の有無
	ペット有無
	海外旅行有無
生殖歴	性交渉有無
	月経性状
	最終月経
	閉経有無と時期
	妊娠有無
  `)
  async function startSession() {
    // Get an ephemeral key from the Fastify server
    console.log("******")
    const tokenResponse = await fetch("/token");
    console.log("#######")
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
    const model = "gpt-4o-realtime-preview-2024-12-17";
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
      //console.log("---2---")
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
    //console.log("---0---")
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
      if(isClient && event.transcript && event.response.instructions){
        msg= "アシスタント「"+event.response.instructions+"」"

      }
      if(!isClient && event.transcript){
        msg="ユーザ「"+event.transcript+"」"
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
	//console.log("+++1+++")
        setEvents((prev) => [JSON.parse(e.data), ...prev]); //prevの前にe.dataのjsonオブジェクトを追加

      });

      // Set session active when the data channel is opened
      // open:  データチャネルが最初に開かれたとき、また再度開かれたときに送信されます。
      dataChannel.addEventListener("open", () => {
        //console.log("+++0+++")
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);
  //console.log(events)

  var mmm=events2messages(events)
  //console.log(mmm)
          //<section className="absolute top-0 left-0 right-0 bottom-[50%] px-4 overflow-y-auto">
  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>realtime console</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-[50%] flex overflow-y-auto">
		  <section className="w-[100%] top-0 left-0 right-0 bottom-0 px-4">
		    <img style={{ width: "100%" }} src="/assets/face01.jpg" />
		  </section><br />
		  <section className="w-[100%] h-0 top-0 left-0 right-0 bottom-0 px-4">
		    <EventLog events={events}/>
		  </section>
	  </section>
          <section className="absolute h-[50%] left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
	  <SummaryPanel
            messages={mmm}
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
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
	  */

