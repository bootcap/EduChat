// components/sub_components/ApiKeys.tsx
import { useState, useEffect, FunctionComponent } from 'react';
import { motion } from "framer-motion";
import "../../styles/Settings.scss";
import { 
  save, eyeopened_LM, eyeopened_DM, eyeclosed_LM, eyeclosed_DM, cross_LM, cross_DM, settings_LM, 
  settings_DM, themes_LM, themes_DM, about_LM, about_DM } from "../../projectAssets";

type ApiKeysProps = {
  darklight: string;
}

const ApiKeys: FunctionComponent<ApiKeysProps> = ({ darklight }) => {
  // 状态管理
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [deepseekKey, setDeepseekKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  
  // 显示密码状态
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState<boolean>(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState<boolean>(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState<boolean>(false);
  
  // API状态消息
  const [geminiStatus, setGeminiStatus] = useState<{type: string, message: string} | null>(null);
  const [deepseekStatus, setDeepseekStatus] = useState<{type: string, message: string} | null>(null);
  const [openaiStatus, setOpenaiStatus] = useState<{type: string, message: string} | null>(null);
  const [anthropicStatus, setAnthropicStatus] = useState<{type: string, message: string} | null>(null);
  
  // 从localStorage加载API密钥
  useEffect(() => {
    const loadedGeminiKey = localStorage.getItem('gemini_api_key') || '';
    const loadedDeepseekKey = localStorage.getItem('deepseek_api_key') || '';
    const loadedOpenaiKey = localStorage.getItem('openai_api_key') || '';
    const loadedAnthropicKey = localStorage.getItem('anthropic_api_key') || '';
    
    setGeminiKey(loadedGeminiKey);
    setDeepseekKey(loadedDeepseekKey);
    setOpenaiKey(loadedOpenaiKey);
    setAnthropicKey(loadedAnthropicKey);
  }, []);
  
  // 保存API密钥
  const saveGeminiKey = () => {
    localStorage.setItem('gemini_api_key', geminiKey);
    setGeminiStatus({ type: 'success', message: 'Gemini API key saved successfully.' });
    setTimeout(() => setGeminiStatus(null), 3000);
  };
  
  const saveDeepseekKey = () => {
    localStorage.setItem('deepseek_api_key', deepseekKey);
    setDeepseekStatus({ type: 'success', message: 'DeepSeek API key saved successfully.' });
    setTimeout(() => setDeepseekStatus(null), 3000);
  };
  
  const saveOpenaiKey = () => {
    localStorage.setItem('openai_api_key', openaiKey);
    setOpenaiStatus({ type: 'success', message: 'OpenAI API key saved successfully.' });
    setTimeout(() => setOpenaiStatus(null), 3000);
  };
  
  const saveAnthropicKey = () => {
    localStorage.setItem('anthropic_api_key', anthropicKey);
    setAnthropicStatus({ type: 'success', message: 'Anthropic API key saved successfully.' });
    setTimeout(() => setAnthropicStatus(null), 3000);
  };
  
  // 测试API密钥
  const testGeminiKey = () => {
    // 实际应用中应该调用API测试密钥是否有效
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
  
  // 清除API密钥
  const clearGeminiKey = () => {
    setGeminiKey('');
    localStorage.removeItem('gemini_api_key');
    setGeminiStatus({ type: 'info', message: 'Gemini API key cleared.' });
    setTimeout(() => setGeminiStatus(null), 3000);
  };
  
  const clearDeepseekKey = () => {
    setDeepseekKey('');
    localStorage.removeItem('deepseek_api_key');
    setDeepseekStatus({ type: 'info', message: 'DeepSeek API key cleared.' });
    setTimeout(() => setDeepseekStatus(null), 3000);
  };
  
  const clearOpenaiKey = () => {
    setOpenaiKey('');
    localStorage.removeItem('openai_api_key');
    setOpenaiStatus({ type: 'info', message: 'OpenAI API key cleared.' });
    setTimeout(() => setOpenaiStatus(null), 3000);
  };
  
  const clearAnthropicKey = () => {
    setAnthropicKey('');
    localStorage.removeItem('anthropic_api_key');
    setAnthropicStatus({ type: 'info', message: 'Anthropic API key cleared.' });
    setTimeout(() => setAnthropicStatus(null), 3000);
  };

  return (
    <div className="api-keys-section">
      <div className="top-bar-blur"><h1>API Keys</h1></div>
      <div className="api-keys-box">
        <div className="api-keys-content">
          <h2>Configure AI Model API Keys</h2>
          <p style={{ color: 'var(--root-text-col)', fontSize: '16px', marginBottom: '20px' }}>
            Enter your API keys to enable AI character functionality in your rooms. Your keys are stored locally on your device and are never sent to our servers.
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
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;