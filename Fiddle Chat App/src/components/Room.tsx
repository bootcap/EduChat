import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import TextField from '@mui/material/TextField';
import { motion } from "framer-motion";
import {leave_room, sendmsg_LM, sendmsg_DM,
    room_LM, room_DM, user_LM, user_DM, emoji_DM, emoji_LM,
    settings_LM, settings_DM, close_LM, close_DM} from "../projectAssets";
import {MessageBubbleRoom, RoomMember, LLMRoleComponent, LLMRoleCreator} from './sub_components';
import "../styles/Room.scss";
import {useRef, useEffect, useState, FunctionComponent} from "react";
import { useAuth } from '../contexts/Authcontext';
import { doc, collection, query, orderBy, onSnapshot, limit, getDoc, updateDoc, DocumentReference, DocumentData, Unsubscribe, DocumentSnapshot, Query, QueryDocumentSnapshot} from "firebase/firestore";
import { db } from "../firebase";
import { handleSendingRoomMessage, handleLeaveRoom } from "../contexts/AccessDB";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import useLocalStorage from 'use-local-storage';
import { authProviderType, LLMRole } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { checkLLMAPIAvailability, processLLMRequest } from '../contexts/LLMService';
import { setupHeartbeatInterval } from '../contexts/HeartbeatService';

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

const Room : FunctionComponent<RoomProps> = ({darklight, roomRequestID, set_accessHome}) => {

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
    const [chatbackgroundimg, setchatbackgroundimg] = useLocalStorage<any>('chatbackgroundimg', null);//don't change any type because of FileReader ArrayBuffer

    const ref = useRef<null | HTMLDivElement>(null);
    const contactsLoaded = useRef<boolean>(false);
    const messagesLoaded = useRef<boolean>(false);
    const {userDB}: authProviderType = useAuth();
    const [emojipickerchngr, set_emojipickerchngr] = useState<boolean>(false);
    
    // 设置面板状态
    const [settingsPanelOpen, setSettingsPanelOpen] = useState<boolean>(false);
    
    // LLM相关状态
    const [llmRoles, setLLMRoles] = useState<LLMRole[]>([]);
    const [isCreator, setIsCreator] = useState<boolean>(false);
    const [showLLMCreator, setShowLLMCreator] = useState<boolean>(false);
    const [processingLLM, setProcessingLLM] = useState<boolean>(false);
    const [llmAPIAvailability, setLlmAPIAvailability] = useState({
        gemini: false,
        deepseek: false,
        openai: false,
        anthropic: false,
        anyAvailable: false
    });
    
    // 检查当前用户是否是房间创建者
    useEffect(() => {
        if (roomdetails && userDB) {
            setIsCreator(roomdetails.createdBy === userDB.uid);
        }
    }, [roomdetails, userDB]);
    
    // 检查LLM API配置
    useEffect(() => {
        const availability = checkLLMAPIAvailability();
        setLlmAPIAvailability(availability);
    }, []);
    
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
        if (heartbeatSetupRef.current) return; // 如果已经设置了心跳，则不再重复设置
        
        console.log("Setting up heartbeat effect with:", userDB.uid, roomRequestID);
        heartbeatSetupRef.current = true;
        
        const cleanup = setupHeartbeatInterval(userDB.uid, roomRequestID);
        
        return () => {
            console.log("Cleaning up heartbeat effect for:", userDB.uid, roomRequestID);
            heartbeatSetupRef.current = false;
            cleanup();
        };
    }, [userDB?.uid, roomRequestID]);

    function showEmojiPicker(){set_emojipickerchngr(!emojipickerchngr);}

    function appendThisEmoji(emojiData: any){setValue(value + emojiData.native);}

    function handlechange(e: any){setValue(e.target.value);}

    const leaveRoom = async() => {
        const obj: {currentUser: any,roomID: string} = 
            {
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
                console.log(`Processing LLM role: ${role.name} with model: ${role.model}`); 
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
                
                // 更新LLM角色的最后响应时间
                const updatedRoles = llmRoles.map(r => 
                    r.id === role.id ? { ...r, lastResponse: Date.now() } : r
                );
                
                const roomRef = doc(db, "rooms", roomdetails.id);
                await updateDoc(roomRef, { llmRoles: updatedRoles });
                
            } catch (error) {
                console.error(`Error processing LLM response for ${role.name}:`, error);
            }
        }
        setProcessingLLM(false);
    };

    function sendMessage(){
        if(value === "")return;
        // 处理用户消息和LLM响应
        handleUserMessage(value);
        setValue("");
    }
    
    // LLM角色处理函数
    const handleAddLLMRole = async (roleData: {name: string, prompt: string, model: string, avatar: string | null}) => {
        if (!userDB || !roomRequestID) return;
        
        const newRole: LLMRole = {
            ...roleData,
            id: uuidv4(),
            processorId: userDB.uid,
            isActive: true,
            lastResponse: Date.now()
        };
        
        const roomRef = doc(db, "rooms", roomRequestID);
        await updateDoc(roomRef, {
            llmRoles: [...llmRoles, newRole]
        });
        
        setShowLLMCreator(false);
    };

    const handleTakeProcessor = async (roleId: string) => {
        if (!userDB || !roomRequestID) return;
        
        const updatedRoles = llmRoles.map(role => 
            role.id === roleId ? { ...role, processorId: userDB.uid } : role
        );
        
        const roomRef = doc(db, "rooms", roomRequestID);
        await updateDoc(roomRef, { llmRoles: updatedRoles });
    };

    const handleToggleActive = async (roleId: string) => {
        if (!userDB || !roomRequestID) return;
        
        const updatedRoles = llmRoles.map(role => 
            role.id === roleId ? { ...role, isActive: !role.isActive } : role
        );
        
        const roomRef = doc(db, "rooms", roomRequestID);
        await updateDoc(roomRef, { llmRoles: updatedRoles });
    };
    
    const handleEditRole = async (roleId: string, updatedData: {name: string, prompt: string, model: string, avatar: string | null}) => {
        if (!userDB || !roomRequestID) return;
        
        // 验证提示不包含未编辑的占位符
        if (updatedData.prompt.includes("[EDIT THIS]")) {
          alert("Please edit all template placeholders in the prompt.");
          return;
        }
        
        const updatedRoles = llmRoles.map(role => 
          role.id === roleId 
            ? { ...role, ...updatedData } 
            : role
        );
        
        const roomRef = doc(db, "rooms", roomRequestID);
        await updateDoc(roomRef, { llmRoles: updatedRoles });
    };

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
            if(onloadComplete.current === false)return () => {};
            if(RoomMembers.length === 0)return () => {};
            if(RoomMembers.length !== membersArrSize.current)return () => {};

            if(messagesLoaded.current === true)return () => {};
            messagesLoaded.current = true;
            
            const roomRef: DocumentReference<DocumentData> = doc(db, "rooms", roomRequestID);
            const q: Query<DocumentData> = query(collection(roomRef, "roommessages"), orderBy("timestamp", "asc"), limit(25));
            const unsub: Unsubscribe = onSnapshot(q, (querySnapshot) => {
                setmessagesList([]);
                querySnapshot.forEach((currentdoc: QueryDocumentSnapshot<DocumentData>) => {
                    const senderId = currentdoc.data().senderID;
                    // 检查是否是LLM消息
                    if (senderId.startsWith('llm_')) {
                        const llmRoleId = senderId.replace('llm_', '');
                        const llmRole = llmRoles.find(role => role.id === llmRoleId);
                        
                        if (llmRole) {
                            setmessagesList(oldarray => [...oldarray, {
                                msgID: currentdoc.id,
                                id: senderId,
                                profile: llmRole.avatar,
                                name: llmRole.name,
                                latest_msg: currentdoc.data().messageSent,
                                date_sent: currentdoc.data().timestamp
                            }]);
                        }
                    } else {
                        // 正常用户消息处理
                        const memberObj = RoomMembers.find(obj => {return obj.id === senderId});
                        if(memberObj !== undefined){
                            setmessagesList(oldarray => [...oldarray, {
                                msgID: currentdoc.id,
                                id: senderId,
                                profile: memberObj.profile,
                                name: memberObj.username,
                                latest_msg: currentdoc.data().messageSent,
                                date_sent: currentdoc.data().timestamp
                                }]);
                            }
                    }
                })
            })

            return () =>{unsub();}
        }

        (onloadComplete.current === true) && (RoomMembers.length === membersArrSize.current) ? 
            initMessagesData() 
            : 
            () => {};
    }, [RoomMembers, onloadComplete, llmRoles])

    useEffect(() => {
        const initRoomData = async() => {
            if(contactsLoaded.current === true && onloadComplete.current === false)return;
            contactsLoaded.current = true;
            messagesLoaded.current = false;
            //init basic room data
            const roomRef = doc(db, "rooms", roomRequestID);
            setroomDetails({id: roomRequestID, profile: null, roomName: ""});
            const roomdocSnap = await getDoc(roomRef);
            if(roomdocSnap.exists() !== true)return;
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
                    {/* 房间信息部分 */}
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
                    
                    {/* AI角色管理部分 */}
                    <div className="settings-section llm-management-section">
                        <div className="section-header">
                            <h3>AI Characters</h3>
                        </div>
                        
                        {(isCreator || llmRoles.some(role => role.processorId === userDB?.uid)) && (
                            <motion.button
                                className="add-llm-button"
                                onClick={() => setShowLLMCreator(true)}
                                whileHover={{ opacity: 0.8 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={!llmAPIAvailability.anyAvailable}
                                style={{ marginTop: '10px' }}
                            >
                                Add AI Character
                            </motion.button>
                        )}
                        
                        {!llmAPIAvailability.anyAvailable && (
                            <p className="api-key-warning">
                                Configure API keys in Settings to use AI characters
                            </p>
                        )}
                        
                        {llmAPIAvailability.anyAvailable && llmRoles.length > 0 && (
                            <div className="api-status">
                                <div className="api-status-badges">
                                    {llmAPIAvailability.gemini && <span className="api-badge gemini">Gemini</span>}
                                    {llmAPIAvailability.deepseek && <span className="api-badge deepseek">DeepSeek</span>}
                                    {llmAPIAvailability.openai && <span className="api-badge openai">OpenAI</span>}
                                    {llmAPIAvailability.anthropic && <span className="api-badge anthropic">Claude</span>}
                                </div>
                            </div>
                        )}
                        
                        {showLLMCreator && (
                            <LLMRoleCreator
                                onSave={handleAddLLMRole}
                                onCancel={() => setShowLLMCreator(false)}
                                darklight={darklight}
                                availableModels={{
                                    gemini: llmAPIAvailability.gemini,
                                    deepseek: llmAPIAvailability.deepseek,
                                    openai: llmAPIAvailability.openai,
                                    anthropic: llmAPIAvailability.anthropic
                                }} 
                            />
                        )}
                        
                        <div className="llm-roles-list">
                            {llmRoles.length === 0 ? (
                                <p className="no-llm-message">No AI characters yet</p>
                            ) : (
                                llmRoles.map(role => (
                                    <LLMRoleComponent
                                        key={role.id}
                                        role={role}
                                        isProcessor={userDB?.uid === role.processorId}
                                        onTakeProcessor={() => handleTakeProcessor(role.id)}
                                        onEditRole={(updatedData: {name: string, prompt: string, model: string, avatar: string | null}) => 
                                            handleEditRole(role.id, updatedData)
                                        }
                                        onToggleActive={() => handleToggleActive(role.id)}
                                        darklight={darklight}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                    
                    {/* 成员列表部分 */}
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
            
            <div className="messages-box">
                <div className="top-bar-blur">
                    <div className="friends-icon">
                    { 
                        (
                        () => {
                                if(roomdetails.profile !== null)
                                {
                                    return <img className="icon" src={roomdetails.profile} referrerPolicy="no-referrer"/>;
                                }
                                else if(roomdetails.profile === null)
                                {
                                    if(darklight === 'light')
                                    {
                                        return <div className="icon-house-light"><img src={room_LM}/></div>;
                                    }
                                    else
                                    {
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
                    
                    {processingLLM && <span className="processing-llm-badge">AI typing...</span>}
                </div>
                <div className="text-messages-box-room">
                    <div className="text-messages-container-plain-room">
                        {chatbackgroundimg ? (<div className='background-img-container-room'>
                            <img src={chatbackgroundimg} alt="background-img" className="background-img-room"/>
                        </div>) : (<div className='background-img-container-room' style={{background: chatbackgroundcol}}></div>)}
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
                                />)}
                            <div ref={ref} className="chat-aligner-plus-room"></div>
                        </div>
                    </div>
                    <div className="textback-box">
                        <div className="friends-icon">
                            { 
                                (
                                () => {
                                        if(userDB!.displayPhoto !== null)
                                        {
                                            return <img className="icon" src={userDB!.displayPhoto} referrerPolicy="no-referrer"/>;
                                        }
                                        else if(userDB!.displayPhoto === null)
                                        {
                                            if(darklight === 'light')
                                            {
                                                return <div className="icon-house-light"><img src={user_LM}/></div>;
                                            }
                                            else
                                            {
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