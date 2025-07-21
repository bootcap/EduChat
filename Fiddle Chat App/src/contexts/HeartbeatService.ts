// 新建 contexts/HeartbeatService.ts
// 这个文件实现心跳机制，检测处理者离线并转移LLM处理责任
import { db } from "../firebase";
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { LLMRole } from "../types";

// 更新用户在线状态的心跳
export const updateUserHeartbeat = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    lastHeartbeat: Date.now(),
    OnlineStatus: true
  });
};

// 检查LLM处理者是否在线
export const checkLLMProcessors = async (roomId: string, currentUserId: string) => {
  const roomRef = doc(db, "rooms", roomId);
  const roomDoc = await getDoc(roomRef);
  
  if (!roomDoc.exists() || !roomDoc.data().llmRoles) return;
  
  const llmRoles: LLMRole[] = roomDoc.data().llmRoles;
  const updatedRoles = [...llmRoles];
  let hasChanges = false;
  
  // 检查每个LLM角色的处理者
  for (let i = 0; i < llmRoles.length; i++) {
    const role = llmRoles[i];
    
    // 跳过当前用户处理的角色
    if (role.processorId === currentUserId) continue;
    
    // 检查处理者是否在线
    const processorRef = doc(db, "users", role.processorId);
    const processorDoc = await getDoc(processorRef);
    
    if (!processorDoc.exists()) {
      // 处理者不存在，转移给当前用户
      updatedRoles[i] = { ...role, processorId: currentUserId };
      hasChanges = true;
      continue;
    }
    
    const processorData = processorDoc.data();
    const lastHeartbeat = processorData.lastHeartbeat || 0;
    const currentTime = Date.now();
    
    // 如果超过30秒没有心跳，认为处理者离线
    if (currentTime - lastHeartbeat > 30000) {
      // 标记处理者离线
      await updateDoc(processorRef, { OnlineStatus: false });
      
      // 找到最适合接管的在线用户（这里简单地选择当前用户）
      updatedRoles[i] = { ...role, processorId: currentUserId };
      hasChanges = true;
    }
  }
  
  // 如果有变化，更新房间数据
  if (hasChanges) {
    await updateDoc(roomRef, { llmRoles: updatedRoles });
  }
};

// 在房间中设置定期心跳检查
export const setupHeartbeatInterval = (roomId: string, userId: string) => {
  // 每10秒更新一次心跳
  const heartbeatInterval = setInterval(() => {
    updateUserHeartbeat(userId);
  }, 10000);
  
  // 每15秒检查一次处理者状态
  const processorCheckInterval = setInterval(() => {
    checkLLMProcessors(roomId, userId);
  }, 15000);
  
  // 返回清理函数
  return () => {
    clearInterval(heartbeatInterval);
    clearInterval(processorCheckInterval);
  };
};