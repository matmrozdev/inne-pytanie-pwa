export type WireMessage={type:string;[key:string]:unknown};
const config:RTCConfiguration={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
const waitForIce=(pc:RTCPeerConnection)=>new Promise<void>(resolve=>{if(pc.iceGatheringState==='complete')return resolve();const done=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',done);resolve()}};pc.addEventListener('icegatheringstatechange',done);setTimeout(resolve,5000)});
export const pack=(value:RTCSessionDescriptionInit)=>JSON.stringify(value);
export const unpack=(value:string)=>JSON.parse(value.trim()) as RTCSessionDescriptionInit;

export class HostNetwork{
  peers=new Map<string,{pc:RTCPeerConnection;channel:RTCDataChannel}>();
  private roundRetryTimers=new Map<string,{key:string;timers:ReturnType<typeof setTimeout>[]}>();
  constructor(private onMessage:(peerId:string,message:WireMessage)=>void,private onStatus:(peerId:string,connected:boolean)=>void){}
  async createOffer(){const peerId=crypto.randomUUID();const pc=new RTCPeerConnection(config);const channel=pc.createDataChannel('game',{ordered:true});this.bind(peerId,pc,channel);await pc.setLocalDescription(await pc.createOffer());await waitForIce(pc);this.peers.set(peerId,{pc,channel});return{peerId,offer:pack(pc.localDescription!)}}
  async acceptAnswer(peerId:string,answer:string){const peer=this.peers.get(peerId);if(!peer)throw new Error('Nie znaleziono zaproszenia.');await peer.pc.setRemoteDescription(unpack(answer))}
  bind(peerId:string,pc:RTCPeerConnection,channel:RTCDataChannel){channel.onopen=()=>this.onStatus(peerId,true);channel.onclose=()=>{this.clearRoundRetries(peerId);this.onStatus(peerId,false)};channel.onmessage=event=>{try{const message=JSON.parse(event.data) as WireMessage;if(message.type==='round_ack'){const pending=this.roundRetryTimers.get(peerId);if(pending?.key===String(message.roundKey))this.clearRoundRetries(peerId);return}this.onMessage(peerId,message);if(message.type==='join')this.send(peerId,{type:'join_ack'})}catch{}}}
  send(peerId:string,message:WireMessage){const channel=this.peers.get(peerId)?.channel;if(channel?.readyState==='open')channel.send(JSON.stringify(message))}
  sendRound(peerId:string,message:WireMessage){const key=String(message.roundKey);this.clearRoundRetries(peerId);this.send(peerId,message);const timers=[250,750,1500,2500,5000,10000,20000].map(delay=>setTimeout(()=>this.send(peerId,message),delay));this.roundRetryTimers.set(peerId,{key,timers})}
  broadcast(message:WireMessage){for(const peerId of this.peers.keys())this.send(peerId,message)}
  private clearRoundRetries(peerId:string){const pending=this.roundRetryTimers.get(peerId);if(pending)for(const timer of pending.timers)clearTimeout(timer);this.roundRetryTimers.delete(peerId)}
  close(){for(const peerId of this.roundRetryTimers.keys())this.clearRoundRetries(peerId);for(const{pc}of this.peers.values())pc.close();this.peers.clear()}
}

export class JoinNetwork{
  pc=new RTCPeerConnection(config);channel:RTCDataChannel|null=null;
  private joinRetryTimers:ReturnType<typeof setTimeout>[]=[];
  constructor(private onMessage:(message:WireMessage)=>void,private onStatus:(connected:boolean)=>void,private onOpen:()=>void){this.pc.ondatachannel=event=>{this.channel=event.channel;let opened=false;const handleOpen=()=>{if(opened)return;opened=true;this.onOpen()};this.channel.onopen=handleOpen;this.channel.onclose=()=>{this.clearJoinRetries();this.onStatus(false)};this.channel.onmessage=e=>{try{const message=JSON.parse(e.data) as WireMessage;if(message.type==='join_ack'){this.clearJoinRetries();this.onStatus(true);return}this.onMessage(message)}catch{}};if(this.channel.readyState==='open')handleOpen()}}
  async createAnswer(offer:string){await this.pc.setRemoteDescription(unpack(offer));await this.pc.setLocalDescription(await this.pc.createAnswer());await waitForIce(this.pc);return pack(this.pc.localDescription!)}
  private clearJoinRetries(){for(const timer of this.joinRetryTimers)clearTimeout(timer);this.joinRetryTimers=[]}
  send(message:WireMessage){if(this.channel?.readyState==='open')this.channel.send(JSON.stringify(message));if(message.type==='join'){this.clearJoinRetries();for(const delay of[250,750,1500,2500])this.joinRetryTimers.push(setTimeout(()=>{if(this.channel?.readyState==='open')this.channel.send(JSON.stringify(message))},delay))}}
  close(){this.clearJoinRetries();this.channel?.close();this.pc.close()}
}
