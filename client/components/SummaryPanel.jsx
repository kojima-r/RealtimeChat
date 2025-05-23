import { useEffect, useState } from "react";
import { OpenAI } from "openai";

const functionDescription = `
Call this function when a user asks for a user's task.
`;


export default function SummaryPanel({
  messages, preprompt
}) {
  const [out, setOut] = useState("");
  const [len, setLen] = useState(0);
  const summary=messages

  const openai = new OpenAI({
	  //apiKey:apiKey,
	  apiKey: import.meta.env["VITE_API_KEY"],
	  dangerouslyAllowBrowser: true,
  });
  async function main(msg) {
	const completion = await openai.chat.completions.create({
		messages: [{ role: 'user', content: msg }],
		model: 'gpt-3.5-turbo',
	});
	
	let s=completion.choices[0].message.content;
	//console.log(completion.choices[0].message.content);
	//console.log(msg+"=>"+s);
        setOut(s);
  }
  


  //setEvents((prev) => [message, ...prev]);   //ログに追加
  // レンダリング後に実行
  useEffect(() => {
    if (!summary || summary.length === 0) return;
    if(summary.length>len){
      setLen(summary.length)
      main(preprompt+"\n：\n"+summary);
    }
  });
    
  return (
    <section className="h-[50%] w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">message list</h2>
        <textarea className="w-full h-[90%]" value={out} type="text" readOnly />
      </div>
    </section>
  );
}
