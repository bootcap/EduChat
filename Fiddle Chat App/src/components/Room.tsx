// Room.tsx
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import TextField from '@mui/material/TextField';
import { motion } from "framer-motion";
import {
  leave_room, sendmsg_LM, sendmsg_DM,
  room_LM, room_DM, user_LM, user_DM, emoji_DM, emoji_LM,
  settings_LM, settings_DM, close_LM, close_DM
} from "../projectAssets";
import { MessageBubbleRoom, RoomMember, RoomLLMPanel } from './sub_components';
import "../styles/Room.scss";
import { useRef, useEffect, useState, FunctionComponent } from "react";
import { useAuth } from '../contexts/Authcontext';
import { 
  doc, collection, query, orderBy, onSnapshot, limit, getDoc, 
  DocumentReference, DocumentData, Unsubscribe, DocumentSnapshot, 
  Query, QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { handleSendingRoomMessage, handleLeaveRoom } from "../contexts/AccessDB";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import useLocalStorage from 'use-local-storage';
import { authProviderType, LLMRole } from '../types';
import { setupHeartbeatInterval } from '../contexts/HeartbeatService';
import { checkLLMAPIAvailability, loadUserAPIKeys, processLLMRequest } from '../contexts/LLMService';

// 定义动画变体
const variants = {
  open: { opacity: 1, y: "0px"},
  closed: { opacity: 0, y: "600px"},
}

type RoomProps = {
  darklight: string,
  roomRequestID: string,
  set_accessHome: () => void;
}



const Room: FunctionComponent<RoomProps> = ({darklight, roomRequestID, set_accessHome}) => {
  const [roomdetails, setroomDetails] = useState<{id: string, profile: string | null, roomName: string, createdBy?: string}>({id: "", profile: "", roomName: ""});
  const [RoommessagesList, setmessagesList] = useState<{msgID: string, id: string, profile: string | null, name: string, latest_msg: string, date_sent: string}[]>([]);
  const onloadComplete = useRef<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [RoomMembers, setRoomMembers] = useState<{
    id: string,
    username: string,
    profile: string,
    inRoom: boolean
  }[]>([]);
  const membersArrSize = useRef<number>(0);

  const defaultBG: string = "#14161F";
  const [chatbackgroundcol, setbackgroundcol] = useLocalStorage<string>('chatBackgroundcol', defaultBG);
  const [chatbackgroundimg, setchatbackgroundimg] = useLocalStorage<any>('chatbackgroundimg', null);

  const ref = useRef<null | HTMLDivElement>(null);
  const contactsLoaded = useRef<boolean>(false);
  const messagesLoaded = useRef<boolean>(false);
  const {userDB}: authProviderType = useAuth();
  const [emojipickerchngr, set_emojipickerchngr] = useState<boolean>(false);
  
  // 设置面板状态
  const [settingsPanelOpen, setSettingsPanelOpen] = useState<boolean>(false);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 防止默认的换行行为
      sendMessage();
    }
  };

  // LLM相关状态
  const [llmRoles, setLLMRoles] = useState<LLMRole[]>([]);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [processingLLM, setProcessingLLM] = useState<boolean>(false);
  const [llmAPIAvailability, setLlmAPIAvailability] = useState({
    gemini: false,
    deepseek: false,
    openai: false,
    anthropic: false,
    qianwen:false,
    kimi: false,
    anyAvailable: false
  });
  
  // 检查当前用户是否是房间创建者
  useEffect(() => {
    if (roomdetails && userDB) {
      setIsCreator(roomdetails.createdBy === userDB.uid);
    }
  }, [roomdetails, userDB]);
  
  // 从Firebase加载API密钥
  useEffect(() => {
    const initializeAPIKeys = async () => {
      if (!userDB?.uid) return;
      await loadUserAPIKeys();
      const availability = await checkLLMAPIAvailability();
      setLlmAPIAvailability(availability);
    };
    
    initializeAPIKeys();
  }, [userDB?.uid]);
  
  // 监听LLM角色变化
  useEffect(() => {
    if (!roomRequestID) return;
    
    const roomRef = doc(db, "rooms", roomRequestID);
    const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
      if (docSnapshot.exists() && docSnapshot.data().llmRoles) {
        setLLMRoles(docSnapshot.data().llmRoles || []);
      }
    });
    
    return () => unsubscribe();
  }, [roomRequestID]);
  
  // 设置心跳检查
  const heartbeatSetupRef = useRef(false);

  useEffect(() => {
    if (!userDB?.uid || !roomRequestID) return;
    if (heartbeatSetupRef.current) return;
    
    console.log("Setting up heartbeat effect with:", userDB.uid, roomRequestID);
    heartbeatSetupRef.current = true;
    
    const cleanup = setupHeartbeatInterval(userDB.uid, roomRequestID);
    
    return () => {
      console.log("Cleaning up heartbeat effect for:", userDB.uid, roomRequestID);
      heartbeatSetupRef.current = false;
      cleanup();
    };
  }, [userDB?.uid, roomRequestID]);

  function showEmojiPicker() {
    set_emojipickerchngr(!emojipickerchngr);
  }

  function appendThisEmoji(emojiData: any) {
    setValue(value + emojiData.native);
  }

  function handlechange(e: any) {
    setValue(e.target.value);
  }

  const leaveRoom = async() => {
    const obj: {currentUser: any, roomID: string} = {
      currentUser: userDB,
      roomID: roomRequestID
    };
    await handleLeaveRoom(obj);
    set_accessHome();
  }
  
  // 切换设置面板显示/隐藏
  const toggleSettingsPanel = () => {
    setSettingsPanelOpen(!settingsPanelOpen);
  }
  
  // 检查是否有需要处理的LLM角色
  const checkForLLMsToProcess = () => {
    if (!userDB || !roomdetails) return false;
    
    return llmRoles.some(role => 
      role.isActive && role.processorId === userDB.uid
    );
  };
  
  // 处理用户发送的消息，检查是否需要触发LLM响应
  const handleUserMessage = async (message: string) => {
    if (!userDB || !roomdetails.id) return;
    
    // 发送用户消息
    await handleSendingRoomMessage({
      user: userDB,
      roomID: roomdetails.id,
      message: message,
    });
    
    // 只有创建者才处理LLM响应
    if (!isCreator) return;
    
    // 检查是否需要处理LLM响应
    const hasLLMsToProcess = checkForLLMsToProcess();
    if (!hasLLMsToProcess || !llmAPIAvailability.anyAvailable) return;
    
    // 获取需要处理的LLM角色
    const myLLMRoles = llmRoles.filter(role => 
      role.isActive && role.processorId === userDB.uid
    );
    
    // 依次处理每个LLM角色
    setProcessingLLM(true);
    for (const role of myLLMRoles) {
      try {
        // 增加一点延迟，避免消息发送太快
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // 调用LLM服务获取响应
        const response = await processLLMRequest(
          roomdetails.id,
          role,
          message,
          userDB.username,
          roomdetails.roomName
        ); 

        // 作为LLM角色发送消息
        await handleSendingRoomMessage({
          user: {
            uid: `llm_${role.id}`,
            username: role.name,
            displayPhoto: role.avatar
          },
          roomID: roomdetails.id,
          message: response,
        });
      } catch (error) {
        console.error(`Error processing LLM response for ${role.name}:`, error);
      }
    }
    setProcessingLLM(false);
  };

  function sendMessage() {
    if(value === "") return;
    handleUserMessage(value);
    setValue("");
  }

  // 修改 getAllRoomMembers 函数
  const getAllRoomMembers = async(roomRef: DocumentReference<DocumentData>): Promise<() => void> => {
    // 重置成员列表
    setRoomMembers([]);
    
    // 使用一个 Map 来跟踪已添加的成员
    const membersMap = new Map();
    
    const unsub: Unsubscribe = onSnapshot(collection(roomRef, "members"), async (memberquery) => {
      membersArrSize.current = memberquery.size;
      
      // 创建一个临时数组来收集所有成员
      const tempMembers: {
        id: string,
        username: string,
        profile: string,
        inRoom: boolean
      }[] = [];
      
      // 构建一个 Promise 数组以并行处理所有成员查询
      const memberPromises = memberquery.docs.map(async (docdata) => {
        const memberId = docdata.id;
        
        if (!membersMap.has(memberId)) {
          membersMap.set(memberId, true);
          
          const memberRef: DocumentReference<DocumentData> = doc(db, "users", memberId);
          const memberdocSnap: DocumentSnapshot<DocumentData> = await getDoc(memberRef);
          
          if (memberdocSnap.exists()) {
            return {
              id: memberdocSnap.data()?.uid,
              username: memberdocSnap.data()?.username,
              profile: memberdocSnap.data()?.displayPhoto,
              inRoom: docdata.data()?.inRoom
            };
          }
        }
        return null;
      });
      
      // 等待所有 Promise 完成
      const results = await Promise.all(memberPromises);
      
      // 过滤掉 null 值并更新状态
      setRoomMembers(results.filter(member => member !== null) as any);
    });

    return () => {unsub();};
  }

  useEffect(() => {ref.current?.scrollIntoView({ behavior: "smooth"});}, [RoommessagesList])

  useEffect(() => {
    const initMessagesData = async(): Promise<() => void> => {
      if(onloadComplete.current === false) return () => {};
      if(RoomMembers.length === 0) return () => {};
      if(RoomMembers.length !== membersArrSize.current) return () => {};
  
      if(messagesLoaded.current === true) return () => {};
      messagesLoaded.current = true;
      
      const roomRef: DocumentReference<DocumentData> = doc(db, "rooms", roomRequestID);
      const q: Query<DocumentData> = query(collection(roomRef, "roommessages"), orderBy("timestamp", "asc"), limit(25));
      const unsub: Unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessagesList: {
          msgID: string,
          id: string,
          profile: string | null,
          name: string,
          latest_msg: string,
          date_sent: string
        }[] = [];
  
        querySnapshot.forEach((currentdoc: QueryDocumentSnapshot<DocumentData>) => {
          const senderId = currentdoc.data().senderID;
          
          // 检查是否是LLM消息
          if (senderId.startsWith('llm_')) {
            const llmRoleId = senderId.replace('llm_', '');
            const llmRole = llmRoles.find(role => role.id === llmRoleId);
            
            if (llmRole) {
              newMessagesList.push({
                msgID: currentdoc.id,
                id: senderId,
                profile: llmRole.avatar,
                name: llmRole.name,
                latest_msg: currentdoc.data().messageSent,
                date_sent: currentdoc.data().timestamp
              });
            } else {
              // 如果找不到角色定义，仍然显示消息但使用默认值
              newMessagesList.push({
                msgID: currentdoc.id,
                id: senderId,
                profile: null,
                name: senderId.replace('llm_', 'AI '),
                latest_msg: currentdoc.data().messageSent,
                date_sent: currentdoc.data().timestamp
              });
            }
          } else {
            // 正常用户消息处理
            const memberObj = RoomMembers.find(obj => obj.id === senderId);
            if (memberObj !== undefined) {
              newMessagesList.push({
                msgID: currentdoc.id,
                id: senderId,
                profile: memberObj.profile,
                name: memberObj.username,
                latest_msg: currentdoc.data().messageSent,
                date_sent: currentdoc.data().timestamp
              });
            }
          }
        });
        
        // 一次性更新消息列表，确保顺序正确
        setmessagesList(newMessagesList);
      });
  
      return () => { unsub(); }
    }
  
    (onloadComplete.current === true) && (RoomMembers.length === membersArrSize.current) ? 
      initMessagesData() 
      : 
      () => {};
  }, [RoomMembers, onloadComplete, llmRoles]) // 添加llmRoles作为依赖项

  useEffect(() => {
    const initRoomData = async() => {
      if(contactsLoaded.current === true && onloadComplete.current === false) return;
      contactsLoaded.current = true;
      messagesLoaded.current = false;
      //init basic room data
      const roomRef = doc(db, "rooms", roomRequestID);
      setroomDetails({id: roomRequestID, profile: null, roomName: ""});
      const roomdocSnap = await getDoc(roomRef);
      if(roomdocSnap.exists() !== true) return;
      setroomDetails({
        id: roomRequestID, 
        profile: roomdocSnap.data()?.displayPhoto, 
        roomName: roomdocSnap.data()?.roomname,
        createdBy: roomdocSnap.data()?.createdBy
      });
      //load room members
      getAllRoomMembers(roomRef).then(() => onloadComplete.current = true).catch((_error) => {});
    }

    roomRequestID ? initRoomData() : () => {};
  }, [roomRequestID])

  return (
    <div className="Room-section">
      {/* 设置侧边面板 */}
      <div className={`settings-side-panel ${settingsPanelOpen ? 'open' : ''}`}>
        <div className="settings-panel-header">
          <h2>Room Settings</h2>
          <motion.div 
            className="close-settings-btn"
            onClick={toggleSettingsPanel}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            { darklight === 'light'
              ? <img src={close_LM} alt="close"/>
              : <img src={close_DM} alt="close"/>
            }
          </motion.div>
        </div>
        
        <div className="settings-panel-content">
          {/* 房间信息部分 - 所有用户都可见 */}
          <div className="settings-section room-info-section">
            <h3>Room Info</h3>
            <div className="room-id-display">
              <span>ID:</span>
              <div className="id-value">{roomdetails.id}</div>
            </div>
            <motion.div 
              className="leave-room-btn" 
              whileHover={{ opacity: 0.8 }} 
              whileTap={{scale: 0.97}} 
              onClick={leaveRoom}
            >
              <h3>Leave Room</h3>
              <div className="leave-room-icon">
                <img src={leave_room} alt="leave-room"/>
              </div>
            </motion.div>
          </div>
          
          {/* 使用单独的LLM面板组件 */}
          {isCreator && (
            <RoomLLMPanel
              darklight={darklight}
              roomRequestID={roomRequestID}
              llmRoles={llmRoles}
              llmAPIAvailability={llmAPIAvailability}
              userDB={userDB}
            />
          )}
          
          {/* 成员列表部分 - 所有用户都可见 */}
          <div className="settings-section members-section">
            <h3>Members</h3>
            <div className="members-list">
              {RoomMembers.filter((member, index, self) => 
                // 过滤掉重复的成员
                index === self.findIndex(m => m.id === member.id)
              ).map((obj, index) =>
                <RoomMember 
                  key={`roomMember_${obj.id}_${index}`} 
                  id={obj.id} 
                  profile={obj.profile} 
                  username={obj.username} 
                  inroom={obj.inRoom}
                  darklight={darklight}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="messages-box">
        <div className="top-bar-blur">
          <div className="friends-icon">
            { 
              (
                () => {
                  if(roomdetails.profile !== null) {
                    return <img className="icon" src={roomdetails.profile} referrerPolicy="no-referrer"/>;
                  } else if(roomdetails.profile === null) {
                    if(darklight === 'light') {
                      return <div className="icon-house-light"><img src={room_LM}/></div>;
                    } else {
                      return <div className="icon-house-dark"><img src={room_DM}/></div>;
                    }
                  }
                }
              )()
            }
          </div>
          <h1>{roomdetails.roomName}</h1>
          
          {/* 设置按钮 */}
          <Tooltip title="Room Settings" placement="bottom" TransitionComponent={Zoom}>
            <motion.div 
              className="settings-toggle-btn"
              onClick={toggleSettingsPanel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              { darklight === 'light'
                ? <img src={settings_LM} alt="settings"/>
                : <img src={settings_DM} alt="settings"/>
              }
            </motion.div>
          </Tooltip>
          
          {/* 只有创建者才显示AI typing指示器 */}
          {isCreator && processingLLM && <span className="processing-llm-badge">AI typing...</span>}
        </div>
        <div className="text-messages-box-room">
          <div className="text-messages-container-plain-room">
            {chatbackgroundimg ? (
              <div className='background-img-container-room'>
                <img src={chatbackgroundimg} alt="background-img" className="background-img-room"/>
              </div>
            ) : (
              <div className='background-img-container-room' style={{background: chatbackgroundcol}}></div>
            )}
            <div className="chat-bg-layer-room" style={chatbackgroundimg ? {background: "transparent"} : {}}>
              <div className="chat-aligner-room"></div>
              <h3 className="chat-messages-begin-room">This is the beginning of all conversations in this room</h3>
              {RoommessagesList.map((obj) =>
                <MessageBubbleRoom
                  key={"roomMessage" + obj.msgID}
                  id={obj.id}
                  userProfile={obj.profile} 
                  userName={obj.name} 
                  message={obj.latest_msg} 
                  timesent={obj.date_sent}
                  signedInUserID={userDB!.uid}
                  darklight={darklight}
                />
              )}
              <div ref={ref} className="chat-aligner-plus-room"></div>
            </div>
          </div>
          <div className="textback-box">
            <div className="friends-icon">
              { 
                (
                  () => {
                    if(userDB!.displayPhoto !== null) {
                      return <img className="icon" src={userDB!.displayPhoto} referrerPolicy="no-referrer"/>;
                    } else if(userDB!.displayPhoto === null) {
                      if(darklight === 'light') {
                        return <div className="icon-house-light"><img src={user_LM}/></div>;
                      } else {
                        return <div className="icon-house-dark"><img src={user_DM}/></div>;
                      }
                    }
                  }
                )()
              }
            </div>
            <div className="input-holder">
              <TextField
                id="filled-multiline-flexible"
                multiline
                maxRows={4}
                value={value}
                onChange={handlechange}
                onKeyDown={handleKeyDown}
                placeholder="Say something here..."
                color="primary"
                variant="standard"
                className="messageSendingObject"
                inputProps={{ style: { color: darklight ==='light'? '#444444' : '#E6E6E6', fontFamily: 'Baloo Bhai 2 ,cursive' } }}
              />
            </div>
            <Tooltip title=" select emoji's: " placement="top" TransitionComponent={Zoom}>
              <motion.div className="emoji-icon" whileHover={{ opacity: 0.8, scale: 1.03 }} whileTap={{scale: 0.97}} onClick={showEmojiPicker}>
                { darklight ==='light'? <img src={emoji_LM} alt="select emoji"/>
                : <img src={emoji_DM} alt="select emoji"/>}
              </motion.div>
            </Tooltip>
            <Tooltip title={"send this message"} placement="top" TransitionComponent={Zoom}>
              <motion.div className="nav-icon" whileHover={{ opacity: 0.8 }} whileTap={{scale: 0.97}}
                onClick={sendMessage}>
                { darklight === 'light'? <img src={sendmsg_LM} alt="send message"/>
                : <img src={sendmsg_DM} alt="send message"/>}
              </motion.div>
            </Tooltip>
            <motion.div className='emoji-picker-holder'
              animate={emojipickerchngr ? "open" : "closed"}
              variants={variants}
            >
              <Picker 
                data={data} 
                onEmojiSelect={(emojidata: any) => {appendThisEmoji(emojidata)}}
                theme={darklight ==='light'? "light" : "dark"}
                icons={"outline"}
                set={"native"} 
                perLine={8}
                previewPosition={"none"}
                skinTonePosition={"search"}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Room