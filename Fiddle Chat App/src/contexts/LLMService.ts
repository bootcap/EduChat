// contexts/LLMService.ts 修改后的内容

// 新建 contexts/LLMService.ts
import { LLMRole, UploadedDocument } from '../types';
import axios from 'axios';
import { auth } from '../firebase';
import { getAPIKeys } from './AccessDB';

// 消息类型定义
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// LLM请求配置
interface LLMRequestConfig {
  model: string;
  prompt: string;
  messageHistory: Message[];
  userName: string;
  roomName: string;
  roleId?: string; // 添加角色ID，用于关联文档
}



// 存储上传的文档，按角色ID索引
const uploadedDocumentsCache: Record<string, UploadedDocument[]> = {};

// 修改uploadDocumentToKimi函数，确保在上传成功后记录文档
export const uploadDocumentToKimi = async (file: File): Promise<UploadedDocument | null> => {
  try {
    const apiKey = localStorage.getItem('kimi_api_key');
    if (!apiKey) {
      throw new Error('Kimi API key not found');
    }
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'file-extract'); 
    
    // 发送上传请求
    const response = await axios.post(
      'https://api.moonshot.cn/v1/files',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      }
    );
    
    console.log('Kimi file upload response:', response.data);
    
    // 检查响应
    if (response.data && response.data.id) {
      const uploadedDoc: UploadedDocument = {
        id: generateUniqueId(), // 生成客户端ID
        name: file.name,
        size: file.size,
        type: file.type,
        modelType: 'kimi',
        fileId: response.data.id, // 保存服务器返回的文件ID
        uploadTime: Date.now()
      };
      
      console.log('Document successfully uploaded:', uploadedDoc);
      return uploadedDoc;
    }
    
    return null;
  } catch (error) {
    console.error('Error uploading document to Kimi:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
};

// 上传文档到通义千文API
// 注意：此函数是占位符，如果通义千文API支持类似功能，请实现它
export const uploadDocumentToQianwen = async (file: File): Promise<UploadedDocument | null> => {
  try {
    const apiKey = localStorage.getItem('qianwen_api_key');
    if (!apiKey) {
      throw new Error('Qianwen API key not found');
    }
    
    // 这里需要实现通义千文的文档上传逻辑
    // 如果通义千文不支持预上传文档，返回null
    console.log('Qianwen document upload not implemented yet');
    return null;
  } catch (error) {
    console.error('Error uploading document to Qianwen:', error);
    return null;
  }
};

// 生成唯一ID的辅助函数
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// 获取角色关联的文档
export const getDocumentsForRole = (roleId: string): UploadedDocument[] => {
  if (!uploadedDocumentsCache[roleId]) {
    uploadedDocumentsCache[roleId] = [];
  }
  return uploadedDocumentsCache[roleId];
};

// 添加文档到角色
export const addDocumentToRole = (roleId: string, document: UploadedDocument): void => {
  if (!uploadedDocumentsCache[roleId]) {
    uploadedDocumentsCache[roleId] = [];
  }
  uploadedDocumentsCache[roleId].push(document);
};

// 从角色中移除文档
export const removeDocumentFromRole = (roleId: string, documentId: string): void => {
  if (!uploadedDocumentsCache[roleId]) return;
  uploadedDocumentsCache[roleId] = uploadedDocumentsCache[roleId].filter(doc => doc.id !== documentId);
};

// 清除角色的所有文档
export const clearDocumentsForRole = (roleId: string): void => {
  uploadedDocumentsCache[roleId] = [];
};


// 存储每个房间的消息历史
const messageHistoryCache: Record<string, Record<string, Message[]>> = {};

// 初始化或获取一个角色的消息历史
export const getMessageHistory = (roomId: string, roleId: string): Message[] => {
  if (!messageHistoryCache[roomId]) {
    messageHistoryCache[roomId] = {};
  }
  
  if (!messageHistoryCache[roomId][roleId]) {
    messageHistoryCache[roomId][roleId] = [];
  }
  
  return messageHistoryCache[roomId][roleId];
};

// 添加消息到历史记录
export const addToMessageHistory = (roomId: string, roleId: string, message: Message) => {
  const history = getMessageHistory(roomId, roleId);
  history.push(message);
  
  // 保持历史记录在合理大小，避免token超限
  if (history.length > 20) { // 保留最近的20条消息
    history.shift(); // 移除最老的消息
  }
};

export const loadUserAPIKeys = async () => {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    const keys = await getAPIKeys(user.uid);
    
    if (keys.gemini) localStorage.setItem('gemini_api_key', keys.gemini);
    if (keys.deepseek) localStorage.setItem('deepseek_api_key', keys.deepseek);
    if (keys.openai) localStorage.setItem('openai_api_key', keys.openai);
    if (keys.anthropic) localStorage.setItem('anthropic_api_key', keys.anthropic);
    if (keys.qianwen) localStorage.setItem('qianwen_api_key', keys.qianwen);
    if (keys.kimi) localStorage.setItem('kimi_api_key', keys.kimi);
    
    return true;
  } catch (error) {
    console.error('Error loading API keys:', error);
    return false;
  }
};

// 发送请求到Google Gemini API
export const sendGeminiRequest = async (config: LLMRequestConfig): Promise<string> => {
  try {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }
    
    // 构造Gemini API格式的消息
    const systemMessage = config.prompt;
    const messagesForAPI = [
      { role: 'user', parts: [{ text: systemMessage }] }
    ];
    
    // 添加历史消息
    config.messageHistory.forEach(msg => {
      messagesForAPI.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`,
      {
        contents: messagesForAPI,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
};

// 发送请求到DeepSeek API
export const sendDeepSeekRequest = async (config: LLMRequestConfig): Promise<string> => {
  try {
    const apiKey = localStorage.getItem('deepseek_api_key');
    if (!apiKey) {
      throw new Error('DeepSeek API key not found');
    }
    
    // 构造DeepSeek API格式的消息
    const messages = [
      { role: 'system', content: config.prompt },
      ...config.messageHistory
    ];
    
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
};

// 发送请求到OpenAI API
export const sendOpenAIRequest = async (config: LLMRequestConfig): Promise<string> => {
  try {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    const messages: Message[] = [
      { role: 'system', content: config.prompt },
      ...config.messageHistory
    ];
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
};

// 发送请求到Anthropic API (Claude)
export const sendAnthropicRequest = async (config: LLMRequestConfig): Promise<string> => {
  try {
    const apiKey = localStorage.getItem('anthropic_api_key');
    if (!apiKey) {
      throw new Error('Anthropic API key not found');
    }
    
    // 构建系统提示和消息历史
    const systemPrompt = config.prompt;
    const messages = config.messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: config.model,
        system: systemPrompt,
        messages: messages,
        max_tokens: 800,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    return response.data.content[0].text;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
};

// 发送请求到通义千文 API
export const sendQianwenRequest = async (config: LLMRequestConfig): Promise<string> => {
  try {
    const apiKey = localStorage.getItem('qianwen_api_key');
    if (!apiKey) {
      throw new Error('Qianwen API key not found');
    }
    
    // 构造通义千文API格式的消息
    const messages = [
      { role: 'system', content: config.prompt },
      ...config.messageHistory
    ];
    
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: config.model,
        input: {
          messages: messages
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 800,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    return response.data.output.text;
  } catch (error) {
    console.error('Error calling Qianwen API:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
};

// 发送请求到Kimi (Moonshot) API
export const sendKimiRequest = async (config: LLMRequestConfig): Promise<string> => {
  try {
    const apiKey = localStorage.getItem('kimi_api_key');
    if (!apiKey) {
      throw new Error('Kimi API key not found');
    }
    
    console.log('Prepared messages for Moonshot API');
    // 构建符合Moonshot API的消息数组
    const messages = [];
    
    // 将prompt转换为system消息
    if (config.prompt) {
      messages.push({
        role: 'system',
        content: config.prompt
      });
    }
    
    // 添加消息历史，过滤掉无效响应
    if (config.messageHistory && Array.isArray(config.messageHistory)) {
      const validMessages = config.messageHistory.filter(msg => 
        !(msg.role === 'assistant' && (
          msg.content === 'Model not supported' || 
          msg.content.includes('Sorry, I encountered an error')
        ))
      );
      
      messages.push(...validMessages);
    }
    
    console.log('Prepared messages for Moonshot API:', messages);
    
    // 准备文件ID
    let fileIds: string[] = [];
    if (config.roleId) {
      // 获取与角色关联的文档
      const documents = getDocumentsForRole(config.roleId);
      console.log('Documents for role:', documents); // 添加日志
      
      if (documents && Array.isArray(documents)) {
        const moonshotDocuments = documents.filter(doc => 
          (doc.modelType === 'kimi' || doc.modelType === 'moonshot') && doc.fileId
        );
        
        console.log('Filtered Moonshot documents:', moonshotDocuments); // 添加日志
        
        if (moonshotDocuments.length > 0) {
          fileIds = moonshotDocuments.map(doc => doc.fileId as string);
          console.log('File IDs to include:', fileIds); // 添加日志
        }
      }
    }
    
    // 只有在有文件ID时才添加
    if (fileIds.length > 0) {
      if (messages[0]?.role === "system") {
        messages[0].content +=
          "\n\nIMPORTANT: Before answering, please fully read all files listed in file_ids. " +
          "Answer solely based on the contents of these files; do not introduce any external knowledge. " +
          "If the required information is not found in the files, clearly state “根据提供的文件无法回答”.";
      }
    }

    // 构建一个全新的、符合要求的请求体
    // 注意：这里明确只包含Moonshot API支持的字段
    const requestBody: {
      model: string;
      messages: Array<{role: string; content: string}>;
      temperature: number;
      file_ids?: string[];
    } = {
      model: config.model,
      messages: messages,
      temperature: 0.7
    };
    
    // 只有在有文件ID时才添加
    if (fileIds.length > 0) {
      requestBody.file_ids = fileIds;
      console.log('Adding file_ids to request:', fileIds); // 添加日志确认
    }
    
    console.log('Final Moonshot API request body:', JSON.stringify(requestBody, null, 2));
    
    // 发送请求
    const response = await axios.post(
      'https://api.moonshot.cn/v1/chat/completions',
      requestBody, // 使用我们新构建的请求体
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    console.log('Moonshot API response:', response.data);
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from Moonshot API');
    }
  } catch (error) {
    console.error('Error calling Moonshot API:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // 如果错误是因为"Model not supported"，提供更明确的错误信息
      if (error.response.data && error.response.data.error && 
          error.response.data.error.message && 
          error.response.data.error.message.includes('not supported')) {
        return 'Error: This model requires the chat completions format. Please check API implementation.';
      }
    }
    return 'Sorry, I encountered an error while processing your request.';
  }
};

// 处理LLM请求的主函数
export const processLLMRequest = async (
  roomId: string,
  role: LLMRole,
  userMessage: string,
  userName: string,
  roomName: string
): Promise<string> => {
  // 获取消息历史
  const history = getMessageHistory(roomId, role.id);
  
  // 添加用户消息到历史
  addToMessageHistory(roomId, role.id, {
    role: 'user',
    content: `${userName}: ${userMessage}`,
  });
  
  // 准备请求配置
  const config: LLMRequestConfig = {
    model: role.model,
    prompt: role.prompt,
    messageHistory: history,
    userName,
    roomName,
    roleId: role.id  // 添加角色ID
  };

  console.log('Processing LLM request:', config);
  
  // 根据模型选择合适的API
  let response = '';
  if (role.model.startsWith('gemini')) {
    response = await sendGeminiRequest(config);
  } else if (role.model.startsWith('deepseek')) {
    response = await sendDeepSeekRequest(config);
  } else if (role.model.startsWith('gpt')) {
    response = await sendOpenAIRequest(config);
  } else if (role.model.includes('claude')) {
    response = await sendAnthropicRequest(config);
  } else if (role.model.startsWith('qwen')) {
    response = await sendQianwenRequest(config);
  } else if (role.model.startsWith('moonshot') || role.model.startsWith('kimi')) {
    response = await sendKimiRequest(config);
  } else {
    response = 'Model not supported';
  }
  
  // 添加助手回复到历史
  addToMessageHistory(roomId, role.id, {
    role: 'assistant',
    content: response,
  });
  
  return response;
};

export const modelSupportsDocuments = (model: string): boolean => {
  // 目前只有Kimi支持
  return model.startsWith('moonshot') || model.startsWith('kimi');
};

// 检查LLM API配置是否可用
export const checkLLMAPIAvailability = (): { 
  gemini: boolean; 
  deepseek: boolean; 
  openai: boolean; 
  anthropic: boolean;
  qianwen: boolean;
  kimi: boolean;
  anyAvailable: boolean;
} => {
  const geminiKey = localStorage.getItem('gemini_api_key');
  const deepseekKey = localStorage.getItem('deepseek_api_key');
  const openaiKey = localStorage.getItem('openai_api_key');
  const anthropicKey = localStorage.getItem('anthropic_api_key');
  const qianwenKey = localStorage.getItem('qianwen_api_key');
  const kimiKey = localStorage.getItem('kimi_api_key');
  
  const result = {
    gemini: !!geminiKey,
    deepseek: !!deepseekKey,
    openai: !!openaiKey,
    anthropic: !!anthropicKey,
    qianwen: !!qianwenKey,
    kimi: !!kimiKey,
    anyAvailable: false
  };
  
  result.anyAvailable = result.gemini || result.deepseek || result.openai || result.anthropic || result.qianwen || result.kimi;
  
  return result;
};