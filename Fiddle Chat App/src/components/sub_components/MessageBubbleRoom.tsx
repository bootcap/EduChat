// components/sub_components/MessageBubbleRoom.tsx
import "../../styles/Room.scss";
import {user_LM, user_DM} from "../../projectAssets";
import {FunctionComponent} from "react";

type MessageBubbleRoomProps = {
    id: string, 
    signedInUserID: string, 
    message: string, 
    userProfile: string | null, 
    darklight: string,
    userName: string,
    timesent: string
}

const MessageBubbleRoom : FunctionComponent<MessageBubbleRoomProps> = ({id, signedInUserID, message, userProfile, darklight, userName, timesent}) => {
    // 检查是否是LLM消息
    const isLLMMessage = id.startsWith('llm_');
    
    return (
        <div>
            {
                id === signedInUserID ? 
                <div className="right-message-bubble">
                    <div className="message-bubble sent-msg">
                        <p>{message}</p>
                    </div>
                    <div className="user-info-dlg">
                        <div className="friends-icon">
                            { 
                                (
                                () => {
                                        if(userProfile !== null)
                                        {
                                            return <img className="icon" src={userProfile} alt="icon" referrerPolicy="no-referrer"/>;
                                        }
                                        else 
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
                        <h2>{userName}</h2>
                    </div>
                </div>
                :
                <div className={`left-message-bubble ${isLLMMessage ? "llm-message" : ""}`}>
                    <div className="user-info-dlg">
                        <div className="friends-icon">
                            { 
                                
                                (
                                () => {
                                        if(userProfile !== null)
                                        {
                                            return <img className="icon" src={userProfile} alt="icon" referrerPolicy="no-referrer"/>;
                                        }
                                        else
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
                        <div className="name-container">
                            {/* {isLLMMessage && <span className="llm-badge">AI</span>} */}
                            <h2>{userName}</h2>
                        </div>
                    </div>
                    <div className={`message-bubble received-msg ${isLLMMessage ? "llm-bubble" : ""}`}>
                        <p>{message}</p>
                    </div>
                </div>
            }
        </div>
    )
}

export default MessageBubbleRoom