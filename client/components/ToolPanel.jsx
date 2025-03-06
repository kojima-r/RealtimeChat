import { useEffect, useState } from "react";

const functionDescription = `
Call this function when a user asks for a user's task.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_tasks",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            theme: {
              type: "string",
              description: "Description of the task.",
            },
            desc: {
              type: "string",
              description: "Contents of the task.",
            },
	    time: {
              type: "string",
              description: "deadline or time of the task.",
            },
          },
          required: ["theme", "desc"],
        },
      },
    ],
    tool_choice: "auto",
    input_audio_transcription: {
      model: "whisper-1",
      language: "ja",
    },
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  const { theme, desc, time } = JSON.parse(functionCallOutput.arguments);
  
  //const colorBoxes = (task) => (
  const colorBoxes = (
    <div
      key={theme}
      className="w-full h-16 rounded-md flex items-center justify-center border border-gray-200"
      style={{ backgroundColor: "#ffcccc" }}
    >
      <p className="text-sm font-bold text-black bg-slate-100 rounded-md p-2 border border-black">
        {time}:{desc}
      </p>
    </div>
  );

      //<pre className="text-xs bg-gray-100 rounded-md p-2 overflow-x-auto">
      //  {JSON.stringify(functionCallOutput, null, 2)}
      //</pre>
  return (
    <div className="flex flex-col gap-2">
      <p>Task: {theme}</p>
      {colorBoxes}
    </div>
  );
}

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);
  const [tasks, setTasks] = useState([]);
	//setEvents((prev) => [message, ...prev]);   //ログに追加
  // レンダリング後に実行
  useEffect(() => {
    if (!events || events.length === 0) return;
    
    // 最初に一回sessionUpdateを送る  
    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    // 最近のイベントがresponse.doneの時に毎回実行する
    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (
          output.type === "function_call" &&
          output.name === "display_tasks"
        ) {
          console.log(output);
          setFunctionCallOutput(output);
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: `
                ask for feedback about the tasks - don't repeat 
                the tasks, just ask if they performed the task.
              `,
              },
            });
          }, 500);
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  useEffect(() => {
    if (functionCallOutput) {
	  msg= ( <FunctionCallOutput functionCallOutput={functionCallOutput} /> );
	  setTasks((prev) => [msg, ...prev]);   //Tasksに追加
          setFunctionCallOutput(null);
    }
  });
	var msg="";
	if(isSessionActive){
	  if(functionCallOutput){
	    //msg= ( <FunctionCallOutput functionCallOutput={functionCallOutput} /> );
	    //setTasks((prev) => [msg, ...prev]);   //Tasksに追加
	  }else{
	    msg= ( <p>Ask for advice on tasks..</p> );
	  }
	}else{
	  msg= ( <p>Start the session to use this tool...</p> );
	}
	
        console.log(tasks);
        //const tasksToDisplay=[]
        //tasks.forEach((msg) => {
	//	tasksToDisplay.push(msg)
	//});
        //console.log(tasksToDisplay);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Task list</h2>
        {tasks}
      </div>
    </section>
  );
}
