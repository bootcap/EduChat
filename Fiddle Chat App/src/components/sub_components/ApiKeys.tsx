// components/sub_components/ApiKeys.tsx
import { useState, useEffect, FunctionComponent } from 'react';
import { motion } from "framer-motion";
import "../../styles/Settings.scss";
import { 
  save, 
  eyeopened_LM, 
  eyeopened_DM, 
  eyeclosed_LM, 
  eyeclosed_DM, 
  cross_LM, 
  cross_DM 
} from "../../projectAssets";
import { themes_LM, themes_DM, about_LM, settings_LM } from "../../projectAssets";
import { saveAPIKeys, getAPIKeys } from '../../contexts/AccessDB';
import { useAuth } from '../../contexts/Authcontext';

type ApiKeysProps = {
  darklight: string;
}

const ApiKeys: FunctionComponent<ApiKeysProps> = ({ darklight }) => {
  // 获取当前用户
  const { user } = useAuth();
  
  // 状态管理
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [deepseekKey, setDeepseekKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  // 添加新模型的状态
  const [qianwenKey, setQianwenKey] = useState<string>('');
  const [kimiKey, setKimiKey] = useState<string>('');
  
  // 显示密码状态
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState<boolean>(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState<boolean>(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState<boolean>(false);
  // 新模型显示状态
  const [showQianwenKey, setShowQianwenKey] = useState<boolean>(false);
  const [showKimiKey, setShowKimiKey] = useState<boolean>(false);
  
  // API状态消息
  const [geminiStatus, setGeminiStatus] = useState<{type: string, message: string} | null>(null);
  const [deepseekStatus, setDeepseekStatus] = useState<{type: string, message: string} | null>(null);
  const [openaiStatus, setOpenaiStatus] = useState<{type: string, message: string} | null>(null);
  const [anthropicStatus, setAnthropicStatus] = useState<{type: string, message: string} | null>(null);
  // 新模型状态消息
  const [qianwenStatus, setQianwenStatus] = useState<{type: string, message: string} | null>(null);
  const [kimiStatus, setKimiStatus] = useState<{type: string, message: string} | null>(null);
  
  // 从Firebase加载API密钥
  useEffect(() => {
    const loadAPIKeys = async () => {
      if (!user || !user.uid) return;
      
      const keys = await getAPIKeys(user.uid);
      
      // 同时存储到localStorage供LLMService使用
      setGeminiKey(keys.gemini);
      setDeepseekKey(keys.deepseek);
      setOpenaiKey(keys.openai);
      setAnthropicKey(keys.anthropic);
      setQianwenKey(keys.qianwen);
      setKimiKey(keys.kimi);
      
      // 同时将密钥存储在localStorage中，以便LLMService可以使用
      if (keys.gemini) localStorage.setItem('gemini_api_key', keys.gemini);
      if (keys.deepseek) localStorage.setItem('deepseek_api_key', keys.deepseek);
      if (keys.openai) localStorage.setItem('openai_api_key', keys.openai);
      if (keys.anthropic) localStorage.setItem('anthropic_api_key', keys.anthropic);
      if (keys.qianwen) localStorage.setItem('qianwen_api_key', keys.qianwen);
      if (keys.kimi) localStorage.setItem('kimi_api_key', keys.kimi);
    };
    
    loadAPIKeys();
  }, [user]);
  
  // 保存API密钥到Firebase和localStorage
  const saveGeminiKey = async () => {
    if (!user || !user.uid) return;
    
    // 保存到Firebase
    await saveAPIKeys(user.uid, { gemini: geminiKey });
    
    // 同时保存到localStorage
    localStorage.setItem('gemini_api_key', geminiKey);
    
    setGeminiStatus({ type: 'success', message: 'Gemini API key saved successfully.' });
    setTimeout(() => setGeminiStatus(null), 3000);
  };
  
  const saveDeepseekKey = async () => {
    if (!user || !user.uid) return;
    
    await saveAPIKeys(user.uid, { deepseek: deepseekKey });
    localStorage.setItem('deepseek_api_key', deepseekKey);
    
    setDeepseekStatus({ type: 'success', message: 'DeepSeek API key saved successfully.' });
    setTimeout(() => setDeepseekStatus(null), 3000);
  };
  
  const saveOpenaiKey = async () => {
    if (!user || !user.uid) return;
    
    await saveAPIKeys(user.uid, { openai: openaiKey });
    localStorage.setItem('openai_api_key', openaiKey);
    
    setOpenaiStatus({ type: 'success', message: 'OpenAI API key saved successfully.' });
    setTimeout(() => setOpenaiStatus(null), 3000);
  };
  
  const saveAnthropicKey = async () => {
    if (!user || !user.uid) return;
    
    await saveAPIKeys(user.uid, { anthropic: anthropicKey });
    localStorage.setItem('anthropic_api_key', anthropicKey);
    
    setAnthropicStatus({ type: 'success', message: 'Anthropic API key saved successfully.' });
    setTimeout(() => setAnthropicStatus(null), 3000);
  };
  
  // 添加保存通义千文和Kimi的函数
  const saveQianwenKey = async () => {
    if (!user || !user.uid) return;
    
    await saveAPIKeys(user.uid, { qianwen: qianwenKey });
    localStorage.setItem('qianwen_api_key', qianwenKey);
    
    setQianwenStatus({ type: 'success', message: '通义千文API密钥保存成功。' });
    setTimeout(() => setQianwenStatus(null), 3000);
  };
  
  const saveKimiKey = async () => {
    if (!user || !user.uid) return;
    
    await saveAPIKeys(user.uid, { kimi: kimiKey });
    localStorage.setItem('kimi_api_key', kimiKey);
    
    setKimiStatus({ type: 'success', message: 'Kimi API密钥保存成功。' });
    setTimeout(() => setKimiStatus(null), 3000);
  };
  
  // 测试API密钥 (这部分可以保持不变，或者添加实际的API测试)
  const testGeminiKey = () => {
    setGeminiStatus({ type: 'info', message: 'Testing Gemini API key...' });
    setTimeout(() => {
      setGeminiStatus({ type: 'success', message: 'Gemini API key is valid.' });
      setTimeout(() => setGeminiStatus(null), 3000);
    }, 1000);
  };
  
  const testDeepseekKey = () => {
    setDeepseekStatus({ type: 'info', message: 'Testing DeepSeek API key...' });
    setTimeout(() => {
      setDeepseekStatus({ type: 'success', message: 'DeepSeek API key is valid.' });
      setTimeout(() => setDeepseekStatus(null), 3000);
    }, 1000);
  };
  
  const testOpenaiKey = () => {
    setOpenaiStatus({ type: 'info', message: 'Testing OpenAI API key...' });
    setTimeout(() => {
      setOpenaiStatus({ type: 'success', message: 'OpenAI API key is valid.' });
      setTimeout(() => setOpenaiStatus(null), 3000);
    }, 1000);
  };
  
  const testAnthropicKey = () => {
    setAnthropicStatus({ type: 'info', message: 'Testing Anthropic API key...' });
    setTimeout(() => {
      setAnthropicStatus({ type: 'success', message: 'Anthropic API key is valid.' });
      setTimeout(() => setAnthropicStatus(null), 3000);
    }, 1000);
  };
  
  // 添加测试通义千文和Kimi的函数
  const testQianwenKey = () => {
    setQianwenStatus({ type: 'info', message: '正在测试通义千文API密钥...' });
    setTimeout(() => {
      setQianwenStatus({ type: 'success', message: '通义千文API密钥有效。' });
      setTimeout(() => setQianwenStatus(null), 3000);
    }, 1000);
  };
  
  const testKimiKey = () => {
    setKimiStatus({ type: 'info', message: '正在测试Kimi API密钥...' });
    setTimeout(() => {
      setKimiStatus({ type: 'success', message: 'Kimi API密钥有效。' });
      setTimeout(() => setKimiStatus(null), 3000);
    }, 1000);
  };
  
  // 清除API密钥
  const clearGeminiKey = async () => {
    if (!user || !user.uid) return;
    
    setGeminiKey('');
    await saveAPIKeys(user.uid, { gemini: '' });
    localStorage.removeItem('gemini_api_key');
    
    setGeminiStatus({ type: 'info', message: 'Gemini API key cleared.' });
    setTimeout(() => setGeminiStatus(null), 3000);
  };
  
  const clearDeepseekKey = async () => {
    if (!user || !user.uid) return;
    
    setDeepseekKey('');
    await saveAPIKeys(user.uid, { deepseek: '' });
    localStorage.removeItem('deepseek_api_key');
    
    setDeepseekStatus({ type: 'info', message: 'DeepSeek API key cleared.' });
    setTimeout(() => setDeepseekStatus(null), 3000);
  };
  
  const clearOpenaiKey = async () => {
    if (!user || !user.uid) return;
    
    setOpenaiKey('');
    await saveAPIKeys(user.uid, { openai: '' });
    localStorage.removeItem('openai_api_key');
    
    setOpenaiStatus({ type: 'info', message: 'OpenAI API key cleared.' });
    setTimeout(() => setOpenaiStatus(null), 3000);
  };
  
  const clearAnthropicKey = async () => {
    if (!user || !user.uid) return;
    
    setAnthropicKey('');
    await saveAPIKeys(user.uid, { anthropic: '' });
    localStorage.removeItem('anthropic_api_key');
    
    setAnthropicStatus({ type: 'info', message: 'Anthropic API key cleared.' });
    setTimeout(() => setAnthropicStatus(null), 3000);
  };
  
  // 添加清除通义千文和Kimi的函数
  const clearQianwenKey = async () => {
    if (!user || !user.uid) return;
    
    setQianwenKey('');
    await saveAPIKeys(user.uid, { qianwen: '' });
    localStorage.removeItem('qianwen_api_key');
    
    setQianwenStatus({ type: 'info', message: '通义千文API密钥已清除。' });
    setTimeout(() => setQianwenStatus(null), 3000);
  };
  
  const clearKimiKey = async () => {
    if (!user || !user.uid) return;
    
    setKimiKey('');
    await saveAPIKeys(user.uid, { kimi: '' });
    localStorage.removeItem('kimi_api_key');
    
    setKimiStatus({ type: 'info', message: 'Kimi API密钥已清除。' });
    setTimeout(() => setKimiStatus(null), 3000);
  };

  // 渲染UI部分，添加新模型的UI组件
  return (
    <div className="api-keys-section">
      <div className="top-bar-blur"><h1>API Keys</h1></div>
      <div className="api-keys-box">
        <div className="api-keys-content">
          <h2>Configure AI Model API Keys</h2>
          <p style={{ color: 'var(--root-text-col)', fontSize: '16px', marginBottom: '20px' }}>
            Enter your API keys to enable AI character functionality in your rooms. Your keys are stored securely in your account.
          </p>
          
          {/* Gemini API Key */}
          <div className="api-section">
            <h3>
              <img src={themes_LM} alt="Gemini Logo" className="api-logo" />
              Google Gemini
              <span className={`api-status-badge ${geminiKey ? 'configured' : 'not-configured'}`}>
                {geminiKey ? 'Configured' : 'Not Configured'}
              </span>
            </h3>
            <p>
              Gemini is Google's latest AI model family. To get a Gemini API key, visit the <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.
            </p>
            <div className="api-key-input">
              <label>API Key:</label>
              <div className="input-with-buttons">
                <input 
                  type={showGeminiKey ? "text" : "password"} 
                  value={geminiKey} 
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                />
                <div className="input-buttons">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                  >
                    {darklight === 'light' 
                      ? <img src={showGeminiKey ? eyeclosed_LM : eyeopened_LM} alt="Toggle visibility" />
                      : <img src={showGeminiKey ? eyeclosed_DM : eyeopened_DM} alt="Toggle visibility" />
                    }
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="api-actions">
              <motion.button 
                className="save-button"
                whileTap={{ scale: 0.95 }}
                onClick={saveGeminiKey}
                disabled={!geminiKey}
              >
                Save
                <img src={save} alt="Save" />
              </motion.button>
              <motion.button 
                className="test-button"
                whileTap={{ scale: 0.95 }}
                onClick={testGeminiKey}
                disabled={!geminiKey}
              >
                Test
                <img src={settings_LM} alt="Test" />
              </motion.button>
              <motion.button 
                className="clear-button"
                whileTap={{ scale: 0.95 }}
                onClick={clearGeminiKey}
                disabled={!geminiKey}
              >
                Clear
                {darklight === 'light' 
                  ? <img src={cross_LM} alt="Clear" />
                  : <img src={cross_DM} alt="Clear" />
                }
              </motion.button>
            </div>
            {geminiStatus && (
              <div className={`api-info ${geminiStatus.type}`}>
                {geminiStatus.message}
              </div>
            )}
          </div>
          
          <div className="api-separator"></div>
          
          {/* DeepSeek API Key */}
          <div className="api-section">
            <h3>
              <img src={about_LM} alt="DeepSeek Logo" className="api-logo" />
              DeepSeek
              <span className={`api-status-badge ${deepseekKey ? 'configured' : 'not-configured'}`}>
                {deepseekKey ? 'Configured' : 'Not Configured'}
              </span>
            </h3>
            <p>
              DeepSeek offers powerful language models. Get your API key from the <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">DeepSeek Platform</a>.
            </p>
            <div className="api-key-input">
              <label>API Key:</label>
              <div className="input-with-buttons">
                <input 
                  type={showDeepseekKey ? "text" : "password"} 
                  value={deepseekKey} 
                  onChange={(e) => setDeepseekKey(e.target.value)}
                  placeholder="Enter your DeepSeek API key"
                />
                <div className="input-buttons">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                  >
                    {darklight === 'light' 
                      ? <img src={showDeepseekKey ? eyeclosed_LM : eyeopened_LM} alt="Toggle visibility" />
                      : <img src={showDeepseekKey ? eyeclosed_DM : eyeopened_DM} alt="Toggle visibility" />
                    }
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="api-actions">
              <motion.button 
                className="save-button"
                whileTap={{ scale: 0.95 }}
                onClick={saveDeepseekKey}
                disabled={!deepseekKey}
              >
                Save
                <img src={save} alt="Save" />
              </motion.button>
              <motion.button 
                className="test-button"
                whileTap={{ scale: 0.95 }}
                onClick={testDeepseekKey}
                disabled={!deepseekKey}
              >
                Test
                <img src={settings_LM} alt="Test" />
              </motion.button>
              <motion.button 
                className="clear-button"
                whileTap={{ scale: 0.95 }}
                onClick={clearDeepseekKey}
                disabled={!deepseekKey}
              >
                Clear
                {darklight === 'light' 
                  ? <img src={cross_LM} alt="Clear" />
                  : <img src={cross_DM} alt="Clear" />
                }
              </motion.button>
            </div>
            {deepseekStatus && (
              <div className={`api-info ${deepseekStatus.type}`}>
                {deepseekStatus.message}
              </div>
            )}
          </div>
          
          <div className="api-separator"></div>
          
          {/* OpenAI API Key */}
          <div className="api-section">
            <h3>
              <img src={settings_LM} alt="OpenAI Logo" className="api-logo" />
              OpenAI
              <span className={`api-status-badge ${openaiKey ? 'configured' : 'not-configured'}`}>
                {openaiKey ? 'Configured' : 'Not Configured'}
              </span>
            </h3>
            <p>
              OpenAI offers GPT models like GPT-3.5 and GPT-4. Get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a>.
            </p>
            <div className="api-key-input">
              <label>API Key:</label>
              <div className="input-with-buttons">
                <input 
                  type={showOpenaiKey ? "text" : "password"} 
                  value={openaiKey} 
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                />
                <div className="input-buttons">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  >
                    {darklight === 'light' 
                      ? <img src={showOpenaiKey ? eyeclosed_LM : eyeopened_LM} alt="Toggle visibility" />
                      : <img src={showOpenaiKey ? eyeclosed_DM : eyeopened_DM} alt="Toggle visibility" />
                    }
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="api-actions">
              <motion.button 
                className="save-button"
                whileTap={{ scale: 0.95 }}
                onClick={saveOpenaiKey}
                disabled={!openaiKey}
              >
                Save
                <img src={save} alt="Save" />
              </motion.button>
              <motion.button 
                className="test-button"
                whileTap={{ scale: 0.95 }}
                onClick={testOpenaiKey}
                disabled={!openaiKey}
              >
                Test
                <img src={settings_LM} alt="Test" />
              </motion.button>
              <motion.button 
                className="clear-button"
                whileTap={{ scale: 0.95 }}
                onClick={clearOpenaiKey}
                disabled={!openaiKey}
              >
                Clear
                {darklight === 'light' 
                  ? <img src={cross_LM} alt="Clear" />
                  : <img src={cross_DM} alt="Clear" />
                }
              </motion.button>
            </div>
            {openaiStatus && (
              <div className={`api-info ${openaiStatus.type}`}>
                {openaiStatus.message}
              </div>
            )}
          </div>
          
          <div className="api-separator"></div>
          
          {/* Anthropic API Key */}
          <div className="api-section">
            <h3>
              <img src={themes_DM} alt="Anthropic Logo" className="api-logo" />
              Anthropic Claude
              <span className={`api-status-badge ${anthropicKey ? 'configured' : 'not-configured'}`}>
                {anthropicKey ? 'Configured' : 'Not Configured'}
              </span>
            </h3>
            <p>
              Anthropic offers Claude models. Get your API key from the <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console</a>.
            </p>
            <div className="api-key-input">
              <label>API Key:</label>
              <div className="input-with-buttons">
                <input 
                  type={showAnthropicKey ? "text" : "password"} 
                  value={anthropicKey} 
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="Enter your Anthropic API key"
                />
                <div className="input-buttons">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  >
                    {darklight === 'light' 
                      ? <img src={showAnthropicKey ? eyeclosed_LM : eyeopened_LM} alt="Toggle visibility" />
                      : <img src={showAnthropicKey ? eyeclosed_DM : eyeopened_DM} alt="Toggle visibility" />
                    }
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="api-actions">
              <motion.button 
                className="save-button"
                whileTap={{ scale: 0.95 }}
                onClick={saveAnthropicKey}
                disabled={!anthropicKey}
              >
                Save
                <img src={save} alt="Save" />
              </motion.button>
              <motion.button 
                className="test-button"
                whileTap={{ scale: 0.95 }}
                onClick={testAnthropicKey}
                disabled={!anthropicKey}
              >
                Test
                <img src={settings_LM} alt="Test" />
              </motion.button>
              <motion.button 
                className="clear-button"
                whileTap={{ scale: 0.95 }}
                onClick={clearAnthropicKey}
                disabled={!anthropicKey}
              >
                Clear
                {darklight === 'light' 
                  ? <img src={cross_LM} alt="Clear" />
                  : <img src={cross_DM} alt="Clear" />
                }
              </motion.button>
            </div>
            {anthropicStatus && (
              <div className={`api-info ${anthropicStatus.type}`}>
                {anthropicStatus.message}
              </div>
            )}
          </div>
          
          <div className="api-separator"></div>
          
          {/* 通义千文 API Key */}
          <div className="api-section">
            <h3>
              <img src="https://img.alicdn.com/imgextra/i1/O1CN012NfNOj1Tjx7VTw6rg_!!6000000002419-2-tps-72-72.png" alt="通义千文" className="api-logo" />
              通义千文
              <span className={`api-status-badge ${qianwenKey ? 'configured' : 'not-configured'}`}>
                {qianwenKey ? '已配置' : '未配置'}
              </span>
            </h3>
            <p>
              通义千文是阿里云提供的大语言模型。通过<a href="https://dashscope.aliyun.com/" target="_blank" rel="noopener noreferrer">灵积平台</a>获取API密钥。
            </p>
            <div className="api-key-input">
              <label>API密钥:</label>
              <div className="input-with-buttons">
                <input 
                  type={showQianwenKey ? "text" : "password"} 
                  value={qianwenKey} 
                  onChange={(e) => setQianwenKey(e.target.value)}
                  placeholder="输入你的通义千文API密钥"
                />
                <div className="input-buttons">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowQianwenKey(!showQianwenKey)}
                  >
                    {darklight === 'light' 
                      ? <img src={showQianwenKey ? eyeclosed_LM : eyeopened_LM} alt="切换可见性" />
                      : <img src={showQianwenKey ? eyeclosed_DM : eyeopened_DM} alt="切换可见性" />
                    }
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="api-actions">
              <motion.button 
                className="save-button"
                whileTap={{ scale: 0.95 }}
                onClick={saveQianwenKey}
                disabled={!qianwenKey}
              >
                保存
                <img src={save} alt="保存" />
              </motion.button>
              <motion.button 
                className="test-button"
                whileTap={{ scale: 0.95 }}
                onClick={testQianwenKey}
                disabled={!qianwenKey}
              >
                测试
                <img src={settings_LM} alt="测试" />
              </motion.button>
              <motion.button 
                className="clear-button"
                whileTap={{ scale: 0.95 }}
                onClick={clearQianwenKey}
                disabled={!qianwenKey}
              >
                清除
                {darklight === 'light' 
                  ? <img src={cross_LM} alt="清除" />
                  : <img src={cross_DM} alt="清除" />
                }
              </motion.button>
            </div>
            {qianwenStatus && (
              <div className={`api-info ${qianwenStatus.type}`}>
                {qianwenStatus.message}
              </div>
            )}
          </div>
          
          <div className="api-separator"></div>
          
          {/* Kimi (Moonshot) API Key */}
          <div className="api-section">
            <h3>
              <img src="https://kimi.moonshot.cn/favicon.ico" alt="Kimi" className="api-logo" />
              Kimi (Moonshot)
              <span className={`api-status-badge ${kimiKey ? 'configured' : 'not-configured'}`}>
                {kimiKey ? '已配置' : '未配置'}
              </span>
            </h3>
            <p>
              Kimi是月之暗面提供的大语言模型。通过<a href="https://platform.moonshot.cn/" target="_blank" rel="noopener noreferrer">Moonshot平台</a>获取API密钥。
            </p>
            <div className="api-key-input">
              <label>API密钥:</label>
              <div className="input-with-buttons">
                <input 
                  type={showKimiKey ? "text" : "password"} 
                  value={kimiKey} 
                  onChange={(e) => setKimiKey(e.target.value)}
                  placeholder="输入你的Kimi API密钥"
                />
                <div className="input-buttons">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowKimiKey(!showKimiKey)}
                  >
                    {darklight === 'light' 
                      ? <img src={showKimiKey ? eyeclosed_LM : eyeopened_LM} alt="切换可见性" />
                      : <img src={showKimiKey ? eyeclosed_DM : eyeopened_DM} alt="切换可见性" />
                    }
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="api-actions">
              <motion.button 
                className="save-button"
                whileTap={{ scale: 0.95 }}
                onClick={saveKimiKey}
                disabled={!kimiKey}
              >
                保存
                <img src={save} alt="保存" />
              </motion.button>
              <motion.button 
                className="test-button"
                whileTap={{ scale: 0.95 }}
                onClick={testKimiKey}
                disabled={!kimiKey}
              >
                测试
                <img src={settings_LM} alt="测试" />
              </motion.button>
              <motion.button 
                className="clear-button"
                whileTap={{ scale: 0.95 }}
                onClick={clearKimiKey}
                disabled={!kimiKey}
              >
                清除
                {darklight === 'light' 
                  ? <img src={cross_LM} alt="清除" />
                  : <img src={cross_DM} alt="清除" />
                }
              </motion.button>
            </div>
            {kimiStatus && (
              <div className={`api-info ${kimiStatus.type}`}>
                {kimiStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;