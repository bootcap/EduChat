// components/RoomLLMPanel.tsx
import { useState, FunctionComponent, useRef } from 'react';
import { motion } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { LLMRoleComponent, LLMRoleCreator } from '.';
import { v4 as uuidv4 } from 'uuid';
import { LLMRole, UploadedDocument } from '../../types';
import { 
  modelSupportsDocuments, 
  uploadDocumentToKimi, 
  addDocumentToRole, 
  getDocumentsForRole, 
  removeDocumentFromRole,
  clearDocumentsForRole 
} from '../../contexts/LLMService';
import { cross_LM, cross_DM } from "../../projectAssets"; // 导入删除图标

import ConfirmDialog from "./ConfirmDialog"; // 确认对话框组件

type RoomLLMPanelProps = {
  darklight: string;
  roomRequestID: string;
  llmRoles: LLMRole[];
  llmAPIAvailability: {
    gemini: boolean;
    deepseek: boolean;
    openai: boolean;
    anthropic: boolean;
    qianwen: boolean;
    kimi: boolean;
    anyAvailable: boolean;
  };
  userDB: any;
};

const RoomLLMPanel: FunctionComponent<RoomLLMPanelProps> = ({
  darklight,
  roomRequestID,
  llmRoles,
  llmAPIAvailability,
  userDB
}) => {
  const [showLLMCreator, setShowLLMCreator] = useState<boolean>(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteRoleId, setConfirmDeleteRoleId] = useState<string | null>(null);
  
  // LLM角色处理函数
  const handleAddLLMRole = async (roleData: {name: string, prompt: string, model: string, avatar: string | null}) => {
    if (!userDB || !roomRequestID) return;
    
    const newRole: LLMRole = {
      ...roleData,
      id: uuidv4(),
      processorId: userDB.uid,
      isActive: true,
      lastResponse: Date.now(),
      documents: []
    };
    
    const roomRef = doc(db, "rooms", roomRequestID);
    await updateDoc(roomRef, {
      llmRoles: [...llmRoles, newRole]
    });
    
    setShowLLMCreator(false);
  };

  const handleTakeProcessor = async (roleId: string) => {
    if (!userDB || !roomRequestID) return;
    
    const updatedRoles = llmRoles.map(role => 
      role.id === roleId ? { ...role, processorId: userDB.uid } : role
    );
    
    const roomRef = doc(db, "rooms", roomRequestID);
    await updateDoc(roomRef, { llmRoles: updatedRoles });
  };

  const handleToggleActive = async (roleId: string) => {
    if (!userDB || !roomRequestID) return;
    
    const updatedRoles = llmRoles.map(role => 
      role.id === roleId ? { ...role, isActive: !role.isActive } : role
    );
    
    const roomRef = doc(db, "rooms", roomRequestID);
    await updateDoc(roomRef, { llmRoles: updatedRoles });
  };
  
  const handleEditRole = async (roleId: string, updatedData: {name: string, prompt: string, model: string, avatar: string | null}) => {
    if (!userDB || !roomRequestID) return;
    
    // 验证提示不包含未编辑的占位符
    if (updatedData.prompt.includes("[EDIT THIS]")) {
      alert("Please edit all template placeholders in the prompt.");
      return;
    }
    
    const updatedRoles = llmRoles.map(role => 
      role.id === roleId 
        ? { ...role, ...updatedData } 
        : role
    );
    
    const roomRef = doc(db, "rooms", roomRequestID);
    await updateDoc(roomRef, { llmRoles: updatedRoles });
  };
  
  // 添加删除角色的函数
  const handleDeleteRole = async (roleId: string) => {
    if (!userDB || !roomRequestID) return;
    
    // 设置确认删除的角色ID
    setConfirmDeleteRoleId(roleId);
  };
  

  // 确认删除角色
  const confirmDeleteRole = async () => {
    if (!confirmDeleteRoleId || !userDB || !roomRequestID) return;
    
    try {
      // 删除与角色关联的所有文档
      clearDocumentsForRole(confirmDeleteRoleId);
      
      // 从角色列表中移除该角色
      const updatedRoles = llmRoles.filter(role => role.id !== confirmDeleteRoleId);
      
      // 更新Firebase
      const roomRef = doc(db, "rooms", roomRequestID);
      await updateDoc(roomRef, { llmRoles: updatedRoles });
      
      // 显示成功消息
      setUploadStatus({ 
        success: true, 
        message: "AI character deleted successfully." 
      });
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error("Error deleting role:", error);
      setUploadStatus({ 
        success: false, 
        message: "Failed to delete AI character." 
      });
      setTimeout(() => setUploadStatus(null), 3000);
    } finally {
      // 清除确认删除状态
      setConfirmDeleteRoleId(null);
    }
  };
  
  // 取消删除
  const cancelDeleteRole = () => {
    setConfirmDeleteRoleId(null);
  };
  
  // 处理文档上传
  const handleUploadDocument = (roleId: string) => {
    // 检查模型是否支持文档上传
    const role = llmRoles.find(r => r.id === roleId);
    if (!role) return;
    
    if (!modelSupportsDocuments(role.model)) {
      setUploadStatus({
        success: false,
        message: "This model doesn't support document uploads."
      });
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }
    
    setSelectedRoleId(roleId);
    // 触发文件输入点击
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // 处理文件选择
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedRoleId) return;
    
    const file = files[0];
    setIsUploading(true);
    setUploadStatus({ success: false, message: "Uploading document..." });
    
    try {
      const role = llmRoles.find(r => r.id === selectedRoleId);
      if (!role) throw new Error("Role not found");
      
      let uploadedDoc = null;
      
      // 根据模型类型选择上传函数
      if (role.model.startsWith('moonshot')) {
        uploadedDoc = await uploadDocumentToKimi(file);
      } else if (role.model.startsWith('qwen')) {
        // 通义千文的上传功能，如果有的话
        // uploadedDoc = await uploadDocumentToQianwen(file);
      }
      
      if (uploadedDoc) {
        // 将文档添加到角色的本地缓存
        addDocumentToRole(selectedRoleId, uploadedDoc);
        
        // 更新Firebase中的角色文档列表
        const updatedRoles = llmRoles.map(r => {
          if (r.id === selectedRoleId) {
            const currentDocs = r.documents || [];
            return {
              ...r,
              documents: [...currentDocs, uploadedDoc]
            };
          }
          return r;
        });
        
        console.log('Updated roles with new document:', updatedRoles);
        
        const roomRef = doc(db, "rooms", roomRequestID);
        await updateDoc(roomRef, { llmRoles: updatedRoles });
        
        setUploadStatus({
          success: true,
          message: `Document "${file.name}" uploaded successfully.`
        });
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      setUploadStatus({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Failed to upload document"}`
      });
    } finally {
      setIsUploading(false);
      // 清除文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // 3秒后清除状态消息
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };
  
  // 处理删除文档
  const handleRemoveDocument = async (roleId: string, docId: string) => {
    if (!userDB || !roomRequestID) return;
    
    try {
      // 从本地缓存中移除
      removeDocumentFromRole(roleId, docId);
      
      // 更新Firebase中的角色文档列表
      const updatedRoles = llmRoles.map(r => {
        if (r.id === roleId) {
          return {
            ...r,
            documents: (r.documents || []).filter(doc => doc.id !== docId)
          };
        }
        return r;
      });
      
      const roomRef = doc(db, "rooms", roomRequestID);
      await updateDoc(roomRef, { llmRoles: updatedRoles });
      
      setUploadStatus({
        success: true,
        message: "Document removed successfully."
      });
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error("Error removing document:", error);
      setUploadStatus({
        success: false,
        message: "Failed to remove document."
      });
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };
  
  return (
    <div className="settings-section llm-management-section">
      <div className="section-header">
        <h3>AI Characters</h3>
        <motion.button
          className="add-llm-button"
          onClick={() => setShowLLMCreator(true)}
          whileHover={{ opacity: 0.8 }}
          whileTap={{ scale: 0.97 }}
          disabled={!llmAPIAvailability.anyAvailable}
        >
          Add AI Character
        </motion.button>
      </div>
      
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
      />
      
      {!llmAPIAvailability.anyAvailable && (
        <p className="api-key-warning">
          Configure API keys in Settings to use AI characters
        </p>
      )}
      
      {llmAPIAvailability.anyAvailable && llmRoles.length > 0 && (
        <div className="api-status">
          <div className="api-status-badges">
            {llmAPIAvailability.gemini && <span className="api-badge gemini">Gemini</span>}
            {llmAPIAvailability.deepseek && <span className="api-badge deepseek">DeepSeek</span>}
            {llmAPIAvailability.openai && <span className="api-badge openai">OpenAI</span>}
            {llmAPIAvailability.anthropic && <span className="api-badge anthropic">Claude</span>}
            {llmAPIAvailability.qianwen && <span className="api-badge qianwen">通义千文</span>}
            {llmAPIAvailability.kimi && <span className="api-badge kimi">Kimi</span>}
          </div>
        </div>
      )}
      
      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.success ? 'success' : 'error'}`}>
          {uploadStatus.message}
        </div>
      )}
      
      {/* 删除确认对话框 */}
      <ConfirmDialog
        title="Delete AI Character"
        message="Are you sure you want to delete this AI character? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteRole}
        onCancel={cancelDeleteRole}
        isOpen={confirmDeleteRoleId !== null}
      />
      
      {showLLMCreator && (
        <LLMRoleCreator
          onSave={handleAddLLMRole}
          onCancel={() => setShowLLMCreator(false)}
          darklight={darklight}
          availableModels={{
            gemini: llmAPIAvailability.gemini,
            deepseek: llmAPIAvailability.deepseek,
            openai: llmAPIAvailability.openai,
            anthropic: llmAPIAvailability.anthropic,
            qianwen: llmAPIAvailability.qianwen,
            kimi: llmAPIAvailability.kimi
          }} 
        />
      )}
      
      <div className="llm-roles-list">
        {llmRoles.length === 0 ? (
          <p className="no-llm-message">No AI characters yet</p>
        ) : (
          llmRoles.map(role => (
            <div key={role.id} className="llm-role-container">
              <div className="llm-role-header">
                <LLMRoleComponent
                  role={role}
                  isProcessor={userDB?.uid === role.processorId}
                  onTakeProcessor={() => handleTakeProcessor(role.id)}
                  onEditRole={(updatedData) => handleEditRole(role.id, updatedData)}
                  onToggleActive={() => handleToggleActive(role.id)}
                  darklight={darklight}
                />
                
                {/* 添加删除按钮 */}
                <motion.button
                  className="delete-role-button"
                  onClick={() => handleDeleteRole(role.id)}
                  whileHover={{ opacity: 0.8 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {darklight === 'light' 
                    ? <img src={cross_LM} alt="Delete" />
                    : <img src={cross_DM} alt="Delete" />
                  }
                </motion.button>
              </div>
              
              {/* 文档上传部分 */}
              {modelSupportsDocuments(role.model) && (
                <div className="document-management">
                  <div className="document-header">
                    <h4>Knowledge Documents</h4>
                    <motion.button
                      className="upload-document-button"
                      onClick={() => handleUploadDocument(role.id)}
                      whileHover={{ opacity: 0.8 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={isUploading}
                    >
                      {isUploading && selectedRoleId === role.id ? 'Uploading...' : 'Upload Document'}
                    </motion.button>
                  </div>
                  
                  <div className="documents-list">
                    {(!role.documents || role.documents.length === 0) ? (
                      <p className="no-documents">No documents uploaded</p>
                    ) : (
                      <ul>
                        {role.documents.map(doc => (
                          <li key={doc.id} className="document-item">
                            <div className="document-info">
                              <span className="document-name">{doc.name}</span>
                              <span className="document-size">{formatFileSize(doc.size)}</span>
                            </div>
                            <motion.button
                              className="remove-document-button"
                              onClick={() => handleRemoveDocument(role.id, doc.id)}
                              whileHover={{ opacity: 0.8 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              Remove
                            </motion.button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 辅助函数：格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default RoomLLMPanel;