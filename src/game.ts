export type ScorePlayer={id:string;score:number};

export function normalizeNumberSetting(value:string,min:number,max:number,fallback:number):number{
  const parsed=value.trim()===''?fallback:Number(value);
  return Number.isFinite(parsed)?Math.max(min,Math.min(max,Math.trunc(parsed))):fallback;
}

export function scoreVotes<T extends ScorePlayer>(players:T[],impostorId:string,votes:Record<string,string>):T[]{
  const voteCount=Object.values(votes).reduce<Record<string,number>>((counts,id)=>({...counts,[id]:(counts[id]??0)+1}),{});
  const impostorEscaped=(voteCount[impostorId]??0)<=Object.keys(votes).length/2;
  return players.map(player=>({...player,score:player.score+(votes[player.id]===impostorId?1:0)+(player.id===impostorId&&impostorEscaped?2:0)}));
}
