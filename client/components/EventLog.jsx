import { ArrowUp, ArrowDown } from "react-feather";
import { useState } from "react";

function Event({ event,msg,isClient, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  
  return (
    <div className="flex flex-col gap-1 p-2 rounded-md bg-gray-50 bg-opacity-70 opacity-70">
      <div
        className="flex items-center gap-1 cursor-pointer "
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isClient ? (
          <ArrowDown className="text-blue-400" />
        ) : (
          <ArrowUp className="text-green-400" />
        )}
        <div className="text-sm text-gray-500 gap-1">
          {isClient ? "client:" : "server:"}
          &nbsp;{event.type} | {timestamp}
          <br/> {msg}
        </div>
      </div>
      <div
        className={`text-gray-500 bg-gray-200 p-2 rounded-md overflow-x-auto ${
          isExpanded ? "block" : "hidden"
        }`}
      >
        <pre className="text-xs">{JSON.stringify(event, null, 2)}</pre>
      </div>
    </div>
  );
}

export default function EventLog({ events, visible }) {
  const eventsToDisplay = [];
  const messages = [];
  let deltaEvents = {};
  //console.log(events)
  events.forEach((event) => {
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
      msg= event.response.instructions
    }
    if(!isClient && event.transcript){
      msg=event.transcript
    }
    ////
    eventsToDisplay.push(
      <Event
        key={event.event_id}
        event={event}
        msg={msg}
        isClient={isClient}
        timestamp={new Date().toLocaleTimeString()}
      />,
    );
  });
  if(!visible){
    return (
    <div>
    </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 overflow-x-auto">
      {events.length === 0 ? (
        <div className="text-gray-500">Awaiting events...</div>
      ) : (
        eventsToDisplay
      )}
    </div>
  );
}


