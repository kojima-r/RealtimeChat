import { useEffect, useState } from "react";
import { OpenAI } from "openai";

const functionDescription = `
Call this function when a user asks for a user's task.
`;


export default function SummaryPanel({
  messages, apiKey
}) {
  const [out, setOut] = useState("");
  const [len, setLen] = useState(0);
  const summary=messages

  const openai = new OpenAI({
	  apiKey:apiKey,
	  dangerouslyAllowBrowser: true,
  });
  const preprompt=`
  この後の対話からユーザの情報に関して以下の項目を埋めて、箇条書きにしてください、データがない場合は「no data」としてください
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
	妊娠数
	`
  async function main(msg) {
	const completion = await openai.chat.completions.create({
		messages: [{ role: 'user', content: msg }],
		model: 'gpt-3.5-turbo',
	});
	
	let s=completion.choices[0].message.content;
	//console.log(completion.choices[0].message.content);
	console.log(msg+"=>"+s);
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
