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
  onEditRole: (updatedData: {name: string, prompt: string, model: string, avatar: string | null}) => void;
  onToggleActive: () => void;
  darklight: string;
};

const LLMRoleComponent: FunctionComponent<LLMRoleComponentProps> = ({
  role,
  isProcessor,
  onTakeProcessor,
  onEditRole,
  onToggleActive,
  darklight
}) => {
  // 添加编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: role.name,
    prompt: role.prompt,
    model: role.model,
    avatar: role.avatar
  });

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

  // 处理打开编辑表单
  const handleOpenEdit = () => {
    setEditData({
      name: role.name,
      prompt: role.prompt,
      model: role.model,
      avatar: role.avatar
    });
    setIsEditing(true);
  };

  // 处理提交编辑
  const handleSubmitEdit = () => {
    // 验证提示不包含未编辑的占位符
    if (editData.prompt.includes("[EDIT THIS]")) {
      alert("Please edit all template placeholders in the prompt.");
      return;
    }
    
    onEditRole(editData);
    setIsEditing(false);
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <motion.div 
      className={`llm-role-component ${role.isActive ? 'active' : 'inactive'}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {!isEditing ? (
        // 显示模式
        <>
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
              onClick={handleOpenEdit}  // 修改为打开编辑表单
              whileTap={{ scale: 0.95 }}
            >
              Edit
            </motion.button>
          </div>
        </>
      ) : (
        // 编辑模式
        <div className="edit-form">
          <h3>Edit Character</h3>
          
          <div className="form-field">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-field">
            <label>Prompt:</label>
            <textarea
              name="prompt"
              value={editData.prompt}
              onChange={handleInputChange}
              rows={5}
              required
            />
          </div>
          
          <div className="form-actions">
            <motion.button
              className="cancel-button"
              onClick={handleCancelEdit}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
            
            <motion.button
              className="save-button"
              onClick={handleSubmitEdit}
              whileTap={{ scale: 0.95 }}
            >
              Save
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LLMRoleComponent;