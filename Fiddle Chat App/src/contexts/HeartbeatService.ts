// 新建 contexts/HeartbeatService.ts
// 这个文件实现心跳机制，检测处理者离线并转移LLM处理责任
import { db } from "../firebase";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { LLMRole } from "../types";

// 更新用户在线状态的心跳
export const updateUserHeartbeat = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    // 先检查用户文档是否存在
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        lastHeartbeat: Date.now(),
        OnlineStatus: true
      });
      // console.log(`Updated heartbeat for user ${userId}`);
    } else {
      console.warn(`User document not found for ID: ${userId}`);
      // 可以选择性地创建用户文档
      // await setDoc(userRef, {
      //   uid: userId,
      //   lastHeartbeat: Date.now(),
      //   OnlineStatus: true
      // });
    }
  } catch (error) {
    console.error(`Error updating heartbeat for user ${userId}:`, error);
  }
};

// 更新用户在特定房间的在线状态
export const updateRoomMemberStatus = async (userId: string, roomId: string) => {
  try {
    // 确保我们更新的是房间成员文档
    const memberRef = doc(db, "rooms", roomId, "members", userId);
    const memberDoc = await getDoc(memberRef);
    
    if (memberDoc.exists()) {
      await updateDoc(memberRef, {
        lastActive: Date.now(),
        inRoom: true
      });
      // console.log(`Updated member status for user ${userId} in room ${roomId}`);
    } else {
      console.warn(`Member document not found for user ${userId} in room ${roomId}`);
    }
  } catch (error) {
    console.error(`Error updating member status for user ${userId} in room ${roomId}:`, error);
  }
};

// 检查LLM处理者是否在线
export const checkLLMProcessors = async (roomId: string, currentUserId: string) => {
  try {
    const roomRef = doc(db, "rooms", roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists() || !roomDoc.data().llmRoles) {
      console.log(`No LLM roles found in room ${roomId}`);
      return;
    }
    
    const llmRoles: LLMRole[] = roomDoc.data().llmRoles;
    const updatedRoles = [...llmRoles];
    let hasChanges = false;
    
    // console.log(`Checking ${llmRoles.length} LLM processors in room ${roomId}`);
    
    // 检查每个LLM角色的处理者
    for (let i = 0; i < llmRoles.length; i++) {
      const role = llmRoles[i];
      
      // 跳过当前用户处理的角色
      if (role.processorId === currentUserId) continue;
      
      console.log(`Checking processor ${role.processorId} for role ${role.name}`);
      
      // 检查处理者是否在线
      const processorRef = doc(db, "users", role.processorId);
      const processorDoc = await getDoc(processorRef);
      
      if (!processorDoc.exists()) {
        console.log(`Processor ${role.processorId} does not exist, transferring role to ${currentUserId}`);
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
        console.log(`Processor ${role.processorId} is offline, transferring role to ${currentUserId}`);
        // 标记处理者离线
        await updateDoc(processorRef, { OnlineStatus: false });
        
        // 找到最适合接管的在线用户（这里简单地选择当前用户）
        updatedRoles[i] = { ...role, processorId: currentUserId };
        hasChanges = true;
      }
    }
    
    // 如果有变化，更新房间数据
    if (hasChanges) {
      console.log(`Updating LLM roles in room ${roomId}`);
      await updateDoc(roomRef, { llmRoles: updatedRoles });
    }
  } catch (error) {
    console.error(`Error checking LLM processors in room ${roomId}:`, error);
  }
};

// 在房间中设置定期心跳检查
export const setupHeartbeatInterval = (userId: string, roomId: string) => {
  console.log(`Setting up heartbeat for user ${userId} in room ${roomId}`);
  
  // 立即更新一次心跳和房间状态
  updateUserHeartbeat(userId).catch(error => 
    console.error(`Initial heartbeat update failed for user ${userId}:`, error)
  );
  
  updateRoomMemberStatus(userId, roomId).catch(error => 
    console.error(`Initial room member status update failed for user ${userId} in room ${roomId}:`, error)
  );
  
  // 每10秒更新一次心跳
  const heartbeatInterval = setInterval(() => {
    updateUserHeartbeat(userId).catch(error => 
      console.error(`Heartbeat update failed for user ${userId}:`, error)
    );
    
    updateRoomMemberStatus(userId, roomId).catch(error => 
      console.error(`Room member status update failed for user ${userId} in room ${roomId}:`, error)
    );
  }, 10000);
  
  // 每15秒检查一次处理者状态
  const processorCheckInterval = setInterval(() => {
    checkLLMProcessors(roomId, userId).catch(error => 
      console.error(`Processor check failed for room ${roomId}:`, error)
    );
  }, 15000);
  
  // 返回清理函数
  return () => {
    clearInterval(heartbeatInterval);
    clearInterval(processorCheckInterval);
    
    // 用户离开时将房间内状态设为离线
    try {
      const memberRef = doc(db, "rooms", roomId, "members", userId);
      updateDoc(memberRef, { inRoom: false })
        .then(() => console.log(`Set user ${userId} as offline in room ${roomId}`))
        .catch(error => console.error(`Error setting offline status:`, error));
    } catch (error) {
      console.error(`Error in cleanup function:`, error);
    }
  };
};