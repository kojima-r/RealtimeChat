import { useEffect, useState } from "react";
import { OpenAI } from "openai";

const functionDescription = `
Call this function when a user asks for a user's task.
`;


export default function SummaryPanel({
  messages, preprompt, sessionToken
}) {
  const [out, setOut] = useState("");
  const [len, setLen] = useState(0);
  const [file, setFile] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [lines, setLines] = useState([]);

  const summary=messages

  const openai = new OpenAI({
	  //apiKey:apiKey,
	  apiKey: import.meta.env["VITE_API_KEY"],
	  dangerouslyAllowBrowser: true,
  });
  const handleSubmit = async () => {
    const host = window.location.hostname;
    const res = await fetch(`https://${host}/saveText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        filename: "summary_log",
        token: sessionToken,
        content: out,
      }),
    });

    const result = await res.json();
    console.log(result)
    //
    console.log(summary+lines)
    const res_msg = await fetch(`https://${host}/saveText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        filename: "message_log",
        token: sessionToken,
        content: summary+lines,
      }),
    });
	
    const result_msg = await res_msg.json();
    console.log(result_msg)
  };
 
  async function main(msg) {
	const completion = await openai.chat.completions.create({
		messages: [{ role: 'user', content: msg }],
		model: 'gpt-3.5-turbo',
	});
	
	let s=completion.choices[0].message.content;
        setOut(s);
	handleSubmit();
  }
  
  useEffect(() => {
    if(isActivating){
      return;
    }
    setIsActivating(true);
    const fetchText = async () => {
      try {
        const host = window.location.hostname;
        const res = await fetch(`https://${host}/readText`);
        const text = await res.text();

        // 改行で分割（Windows/Unix/Mac対応）
        const linesArray = text.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');

        console.log(linesArray);
	setLines(linesArray);
      } catch (error) {
        console.error('読み込みエラー:', error);
      }
    };

    fetchText();
  }, []);
  
  

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
