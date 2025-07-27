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

export interface UploadedDocument {
    id: string;
    name: string;
    size: number;
    type: string;
    modelType: string; // 'kimi', 'qianwen' 等，表示该文档与哪个模型关联
    fileId?: string;   // 由AI服务返回的文件ID
    uploadTime: number;
  }
  
  // 更新LLMRole接口，添加documents字段
  export interface LLMRole {
    id: string;
    name: string;
    prompt: string;
    model: string;
    avatar: string | null;
    processorId: string;
    isActive: boolean;
    lastResponse: number;
    documents?: UploadedDocument[]; // 添加文档列表字段
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