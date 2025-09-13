import { useState, useEffect } from 'react'
import { Member, Task, Evidence, Recommendation } from '../domain/entities'
import { 
  MemberService, 
  TaskService, 
  EvidenceService, 
  RecommendationService,
  BackupService,
  type BackupData 
} from '../usecase'
import {
  DexieMemberRepository,
  DexieTaskRepository,
  DexieEvidenceRepository,
  DexieRecommendationRepository
} from '../infrastructure'
import { DexieBackupRepository } from '../infrastructure/db/repositories/backupRepository'

// サービスのインスタンスを作成
const memberRepository = new DexieMemberRepository()
const taskRepository = new DexieTaskRepository()
const evidenceRepository = new DexieEvidenceRepository()
const recommendationRepository = new DexieRecommendationRepository()
const backupRepository = new DexieBackupRepository()

const memberService = new MemberService(memberRepository)
const taskService = new TaskService(taskRepository, memberRepository)
const evidenceService = new EvidenceService(evidenceRepository, memberRepository, taskRepository)
const recommendationService = new RecommendationService(recommendationRepository, memberRepository)
const backupService = new BackupService(backupRepository)

export const useAppData = (familyUid: string) => {
  const [members, setMembers] = useState<Member[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // データ読み込み
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [membersData, tasksData, evidenceData, recommendationsData] = await Promise.all([
        memberService.listAllMembers(familyUid),
        taskService.getAllTasks(familyUid),
        evidenceService.getAllEvidence(familyUid),
        recommendationService.getAllRecommendations(familyUid)
      ])

      setMembers(membersData)
      setTasks(tasksData)
      setEvidence(evidenceData)
      setRecommendations(recommendationsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // メンバー操作
  const addMember = async (memberData: Omit<Member, 'familyUid' | 'memberId' | 'createdAt' | 'updatedAt' | 'memberCode'>) => {
    try {
      const newMember = await memberService.createMember({
        familyUid,
        ...memberData
      })
      setMembers(prev => [...prev, newMember])
      return newMember
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メンバーの追加に失敗しました')
      throw err
    }
  }

  const updateMember = async (memberId: string, updates: Partial<Pick<Member, 'displayName' | 'birthYear'>>) => {
    try {
      const updatedMember = await memberService.updateMember(familyUid, memberId, updates)
      setMembers(prev => prev.map(m => m.memberId === memberId ? updatedMember : m))
      return updatedMember
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メンバーの更新に失敗しました')
      throw err
    }
  }

  const deleteMember = async (memberId: string) => {
    try {
      await memberService.deleteMember(familyUid, memberId)
      setMembers(prev => prev.filter(m => m.memberId !== memberId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メンバーの削除に失敗しました')
      throw err
    }
  }

  // タスク操作
  const addTask = async (taskData: Omit<Task, 'familyUid' | 'taskId' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask = await taskService.createTask({
        familyUid,
        ...taskData
      })
      setTasks(prev => [...prev, newTask])
      return newTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの追加に失敗しました')
      throw err
    }
  }

  const updateTaskProgress = async (taskId: string, progress: number) => {
    try {
      const updatedTask = await taskService.updateTaskProgress(familyUid, taskId, progress)
      setTasks(prev => prev.map(t => t.taskId === taskId ? updatedTask : t))
      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの更新に失敗しました')
      throw err
    }
  }

  const completeTask = async (taskId: string) => {
    try {
      const updatedTask = await taskService.completeTask(familyUid, taskId)
      setTasks(prev => prev.map(t => t.taskId === taskId ? updatedTask : t))
      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの完了に失敗しました')
      throw err
    }
  }

  // エビデンス操作
  const addEvidence = async (evidenceData: Omit<Evidence, 'familyUid' | 'evidenceId' | 'createdAt'>) => {
    try {
      const newEvidence = await evidenceService.createEvidence({
        familyUid,
        ...evidenceData
      })
      setEvidence(prev => [...prev, newEvidence])
      
      // タスクが関連している場合、タスクを再読み込み
      if (evidenceData.taskId) {
        const updatedTask = await taskService.getTask(familyUid, evidenceData.taskId)
        if (updatedTask) {
          setTasks(prev => prev.map(t => t.taskId === evidenceData.taskId ? updatedTask : t))
        }
      }
      
      return newEvidence
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エビデンスの追加に失敗しました')
      throw err
    }
  }

  // バックアップ操作
  const createBackup = async (): Promise<BackupData> => {
    try {
      return await backupService.exportData(familyUid)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'バックアップの作成に失敗しました')
      throw err
    }
  }

  const restoreBackup = async (backupData: BackupData) => {
    try {
      await backupService.importData(backupData)
      // データを再読み込み
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'バックアップの復元に失敗しました')
      throw err
    }
  }

  // 初期データ読み込み
  useEffect(() => {
    loadData()
  }, [familyUid])

  return {
    // データ
    members,
    tasks,
    evidence,
    recommendations,
    loading,
    error,
    
    // 操作
    loadData,
    addMember,
    updateMember,
    deleteMember,
    addTask,
    updateTaskProgress,
    completeTask,
    addEvidence,
    createBackup,
    restoreBackup,
    
    // サービス（直接アクセス用）
    memberService,
    taskService,
    evidenceService,
    recommendationService,
    backupService
  }
}