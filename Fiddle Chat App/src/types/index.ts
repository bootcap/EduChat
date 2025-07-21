import { DocumentData } from "firebase/firestore";
import { User } from "firebase/auth";

export interface authProviderType{   
    user: User | null,
    UserUID: string | null,
    userDB: DocumentData | null, 
    isLoading: boolean, 
    setLoadingTrue: () => void, 
    setLoadingFalse: () => void
}

export interface personalDetailsForm{
    profile: any,
    uid: string,
    username: string,
    password: string;
    email: string,
    dob: string,
    pronouns: string,
    position: string
}

export interface LLMRole {
    id: string;           // 唯一标识符
    name: string;         // 显示名称
    avatar: string | null; // 头像URL
    prompt: string;       // 提示词（设定人格）
    model: string;        // 使用的模型(如"gpt-3.5-turbo", "claude-3-opus"等)
    processorId: string;  // 负责处理此LLM请求的用户ID
    isActive: boolean;    // 是否激活状态
    lastResponse: number; // 上次响应时间戳
}

// LLM API设置
export interface LLMApiKeys {
    gemini?: string;      // Google Gemini API密钥
    deepseek?: string;    // DeepSeek API密钥
    openai?: string;      // OpenAI API密钥
    anthropic?: string;   // Anthropic API密钥
}
  
// 修改Room接口，添加llmRoles字段
export interface Room {
id: string;
roomname: string;
displayPhoto: string | null;
membersAmount: number;
llmRoles: LLMRole[];
createdAt: any; // Timestamp
createdBy: string; // creator userId
}