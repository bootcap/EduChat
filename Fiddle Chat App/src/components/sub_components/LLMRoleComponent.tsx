// components/sub_components/LLMRoleComponent.tsx
import { useState, FunctionComponent } from 'react';
import { motion } from "framer-motion";
import { user_LM, user_DM } from "../../projectAssets";
import { LLMRole } from '../../types';
import "../../styles/Room.scss";

type LLMRoleComponentProps = {
  role: LLMRole;
  isProcessor: boolean;
  onTakeProcessor: () => void;
  onEditRole: () => void;
  onToggleActive: () => void;
  darklight: string;
}

const LLMRoleComponent: FunctionComponent<LLMRoleComponentProps> = ({
  role,
  isProcessor,
  onTakeProcessor,
  onEditRole,
  onToggleActive,
  darklight
}) => {
  const getModelDisplayName = (model: string) => {
    if (model.startsWith('gemini')) {
      return model.replace('gemini-', 'Gemini ');
    } else if (model.startsWith('deepseek')) {
      return model.replace('deepseek-', 'DeepSeek ');
    } else if (model.startsWith('gpt')) {
      return model.replace('gpt-', 'GPT ');
    } else if (model.includes('claude')) {
      return model.replace('claude-', 'Claude ');
    }
    return model;
  };

  return (
    <motion.div 
      className={`llm-role-component ${role.isActive ? 'active' : 'inactive'}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="role-header">
        <div className="role-avatar">
          {role.avatar ? (
            <img src={role.avatar} alt={role.name} />
          ) : (
            <div className={`icon-house-${darklight}`}>
              <img src={darklight === 'light' ? user_LM : user_DM} alt="Default avatar" />
            </div>
          )}
        </div>
        
        <div className="role-title">
          <h3>{role.name}</h3>
          <div className="role-badges">
            <span className="model-badge" data-model={role.model}>
              {getModelDisplayName(role.model)}
            </span>
            {isProcessor && <span className="processor-badge">You</span>}
            <span className={`status-badge ${role.isActive ? 'active' : 'inactive'}`}>
              {role.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="role-controls">
        <motion.button 
          className={`toggle-button ${role.isActive ? 'active' : ''}`}
          onClick={onToggleActive}
          whileTap={{ scale: 0.95 }}
        >
          {role.isActive ? 'Disable' : 'Enable'}
        </motion.button>
        
        {!isProcessor && (
          <motion.button 
            className="take-processor-button"
            onClick={onTakeProcessor}
            whileTap={{ scale: 0.95 }}
          >
            Take Control
          </motion.button>
        )}
        
        <motion.button 
          className="edit-button"
          onClick={onEditRole}
          whileTap={{ scale: 0.95 }}
        >
          Edit
        </motion.button>
      </div>
    </motion.div>
  );
};

export default LLMRoleComponent;