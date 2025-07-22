// 新建 contexts/LLMService.ts
import { LLMRole } from '../types';
import axios from 'axios';

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
}

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
    roomName
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

// 检查LLM API配置是否可用
export const checkLLMAPIAvailability = (): { 
  gemini: boolean; 
  deepseek: boolean; 
  openai: boolean; 
  anthropic: boolean;
  anyAvailable: boolean;
} => {
  const geminiKey = localStorage.getItem('gemini_api_key');
  const deepseekKey = localStorage.getItem('deepseek_api_key');
  const openaiKey = localStorage.getItem('openai_api_key');
  const anthropicKey = localStorage.getItem('anthropic_api_key');
  
  const result = {
    gemini: !!geminiKey,
    deepseek: !!deepseekKey,
    openai: !!openaiKey,
    anthropic: !!anthropicKey,
    anyAvailable: false
  };
  
  result.anyAvailable = result.gemini || result.deepseek || result.openai || result.anthropic;
  
  return result;
};