"use strict";
addEventListener("message",event=>{
  if(event.source!==parent||event.data?.type!=="nexora-lab-run")return;
  const requestId=String(event.data.requestId||"");
  if(!requestId)return;
  const logs=[];
  const safeConsole={log:(...args)=>logs.push(args.map(value=>{try{return typeof value==="string"?value:JSON.stringify(value,null,2)}catch{return String(value)}}).join(" "))};
  try{
    new Function("console",`"use strict";\n${String(event.data.code||"")}`)(safeConsole);
    parent.postMessage({type:"nexora-lab-result",requestId,ok:true,output:logs.join("\n")||"Código executado sem saída."},"*");
  }catch(error){
    parent.postMessage({type:"nexora-lab-result",requestId,ok:false,output:`Erro: ${error instanceof Error?error.message:String(error)}`},"*");
  }
});
