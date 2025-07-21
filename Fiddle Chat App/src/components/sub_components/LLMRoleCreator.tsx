// components/sub_components/LLMRoleCreator.tsx
import { useState, FunctionComponent, useEffect } from 'react';
import { motion } from "framer-motion";
import TextField from '@mui/material/TextField';
import { checkLLMAPIAvailability } from '../../contexts/LLMService';
import "../../styles/Room.scss";

type LLMRoleCreatorProps = {
  onSave: (roleData: {
    name: string;
    prompt: string;
    model: string;
    avatar: string | null;
  }) => void;
  onCancel: () => void;
  darklight: string;
  availableModels: {
    gemini: boolean;
    deepseek: boolean;
    openai: boolean;
    anthropic: boolean;
  };
}

const LLMRoleCreator: FunctionComponent<LLMRoleCreatorProps> = ({ onSave, onCancel, darklight }) => {
  const [name, setName] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [model, setModel] = useState<string>('gemini-pro');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [apiAvailability, setApiAvailability] = useState({
    gemini: false,
    deepseek: false,
    openai: false,
    anthropic: false
  });
  
  useEffect(() => {
    const availability = checkLLMAPIAvailability();
    setApiAvailability(availability);
    
    // 设置默认模型基于可用的API
    if (availability.gemini) {
      setModel('gemini-pro');
    } else if (availability.deepseek) {
      setModel('deepseek-chat');
    } else if (availability.openai) {
      setModel('gpt-3.5-turbo');
    } else if (availability.anthropic) {
      setModel('claude-3-haiku');
    }
  }, []);
  
  const handleSubmit = () => {
    if (!name || !prompt) return;
    
    onSave({
      name,
      prompt,
      model,
      avatar
    });
  };
  
  return (
    <div className="llm-role-creator">
      <h2>Create AI Character</h2>
      
      <TextField
        label="Character Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
        variant="outlined"
        inputProps={{ style: { color: darklight === 'light' ? '#444444' : '#E6E6E6', fontFamily: 'Baloo Bhai 2, cursive' } }}
      />
      
      <div className="model-selector">
        <h3>Select Model</h3>
        <select 
          value={model} 
          onChange={(e) => setModel(e.target.value)}
        >
          {/* Gemini Models */}
          <optgroup label="Google Gemini Models">
            <option value="gemini-pro" disabled={!apiAvailability.gemini}>
              Gemini Pro
            </option>
            <option value="gemini-ultra" disabled={!apiAvailability.gemini}>
              Gemini Ultra
            </option>
          </optgroup>
          
          {/* DeepSeek Models */}
          <optgroup label="DeepSeek Models">
            <option value="deepseek-chat" disabled={!apiAvailability.deepseek}>
              DeepSeek Chat
            </option>
            <option value="deepseek-coder" disabled={!apiAvailability.deepseek}>
              DeepSeek Coder
            </option>
          </optgroup>
          
          {/* OpenAI Models */}
          <optgroup label="OpenAI Models">
            <option value="gpt-3.5-turbo" disabled={!apiAvailability.openai}>
              GPT-3.5 Turbo
            </option>
            <option value="gpt-4" disabled={!apiAvailability.openai}>
              GPT-4
            </option>
          </optgroup>
          
          {/* Anthropic Models */}
          <optgroup label="Anthropic Models">
            <option value="claude-3-haiku" disabled={!apiAvailability.anthropic}>
              Claude 3 Haiku
            </option>
            <option value="claude-3-sonnet" disabled={!apiAvailability.anthropic}>
              Claude 3 Sonnet
            </option>
          </optgroup>
        </select>
      </div>
      
      <TextField
        label="Character Prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        fullWidth
        multiline
        rows={4}
        margin="normal"
        variant="outlined"
        placeholder="Describe the character's personality, background, speaking style, etc."
        inputProps={{ style: { color: darklight === 'light' ? '#444444' : '#E6E6E6', fontFamily: 'Baloo Bhai 2, cursive' } }}
      />
      
      <div className="prompt-templates">
        <h3>Quick Templates</h3>
        <div className="template-buttons">
          <motion.button
            onClick={() => setPrompt(`You are ${name || 'Character'}, an AI assistant in a group chat. 
You have a friendly, helpful personality and always try to provide useful information. 
When responding, keep your answers concise and to the point. 
You should respond in a conversational manner, as if you're part of the group chat.`)}
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
          >
            Helpful Assistant
          </motion.button>
          
          <motion.button
            onClick={() => setPrompt(`You are ${name || 'Character'}, a quirky and friendly AI in a group chat.
You have a great sense of humor and enjoy making jokes and puns.
When responding, keep your tone light and entertaining.
You should ask questions to keep the conversation going.`)}
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
          >
            Friendly Character
          </motion.button>
          
          <motion.button
            onClick={() => setPrompt(`You are ${name || 'Character'}, an expert on a specific subject.
Your expertise is in [EDIT THIS FIELD].
When responding, provide factual information about your area of expertise.
You should correct misconceptions politely and share interesting facts.`)}
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
          >
            Subject Expert
          </motion.button>
          
          <motion.button
            onClick={() => setPrompt(`You are ${name || 'Character'}, a fictional character with a unique backstory.
BACKSTORY: [EDIT THIS]
PERSONALITY: [EDIT THIS]
SPEAKING STYLE: [EDIT THIS]
Always stay in character. Use language that matches your character.`)}
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
          >
            Fictional Character
          </motion.button>
        </div>
      </div>
      
      <div className="button-container">
        <motion.button
          className="cancel-button"
          onClick={onCancel}
          whileHover={{ opacity: 0.8 }}
          whileTap={{ scale: 0.97 }}
        >
          Cancel
        </motion.button>
        
        <motion.button
          className="save-button"
          onClick={handleSubmit}
          whileHover={{ opacity: 0.8 }}
          whileTap={{ scale: 0.97 }}
          disabled={!name || !prompt}
        >
          Create Character
        </motion.button>
      </div>
    </div>
  );
};

export default LLMRoleCreator;