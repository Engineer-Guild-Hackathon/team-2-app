import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui'
import { type BackupData } from '../../usecase'

interface BackupManagementProps {
  loading: boolean
  onCreateBackup: () => Promise<BackupData>
  onRestoreBackup: (backupData: BackupData) => Promise<void>
}

const BackupManagement = ({ loading, onCreateBackup, onRestoreBackup }: BackupManagementProps) => {
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [lastBackupData, setLastBackupData] = useState<BackupData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreateBackup = async () => {
    setIsCreating(true)
    try {
      const backupData = await onCreateBackup()
      setLastBackupData(backupData)
      
      // バックアップデータをJSONファイルとしてダウンロード
      const dataStr = JSON.stringify(backupData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `homelog-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('バックアップが作成され、ダウンロードが開始されました。')
    } catch (error) {
      console.error('Backup creation failed:', error)
      alert('バックアップの作成に失敗しました。')
    } finally {
      setIsCreating(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const result = e.target?.result
        if (typeof result !== 'string') return

        const backupData = JSON.parse(result) as BackupData
        
        // バックアップデータの基本的な検証
        if (!backupData.familyUid || !backupData.exportedAt || !backupData.data) {
          throw new Error('無効なバックアップファイルです')
        }

        const confirmRestore = confirm(
          `このバックアップを復元しますか？\n` +
          `作成日時: ${new Date(backupData.exportedAt).toLocaleString('ja-JP')}\n` +
          `メンバー: ${backupData.data.members.length}人\n` +
          `タスク: ${backupData.data.tasks.length}件\n` +
          `エビデンス: ${backupData.data.evidence.length}件\n\n` +
          `※現在のデータは上書きされます。`
        )

        if (confirmRestore) {
          setIsRestoring(true)
          await onRestoreBackup(backupData)
          alert('バックアップの復元が完了しました。')
        }
      } catch (error) {
        console.error('Restore failed:', error)
        alert('バックアップファイルの読み込みまたは復元に失敗しました。')
      } finally {
        setIsRestoring(false)
        // ファイル入力をリセット
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.readAsText(file)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getBackupStats = (backupData: BackupData) => {
    return {
      membersCount: backupData.data.members.length,
      tasksCount: backupData.data.tasks.length,
      evidenceCount: backupData.data.evidence.length,
      recommendationsCount: backupData.data.recommendations.length,
      createdAt: new Date(backupData.exportedAt).toLocaleString('ja-JP'),
      size: formatFileSize(JSON.stringify(backupData).length)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* バックアップ作成 */}
      <Card>
        <CardHeader>
          <CardTitle>バックアップ作成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              現在のデータをバックアップファイルとして保存します。
              家族のメンバー、タスク、エビデンス、レコメンデーションがすべて含まれます。
            </p>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleCreateBackup}
                disabled={isCreating}
                loading={isCreating}
              >
                {isCreating ? 'バックアップ作成中...' : 'バックアップを作成'}
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>JSONファイルとしてダウンロードされます</span>
              </div>
            </div>

            {lastBackupData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">最新のバックアップ</h4>
                <div className="text-sm text-green-700 space-y-1">
                  {(() => {
                    const stats = getBackupStats(lastBackupData)
                    return (
                      <>
                        <div>作成日時: {stats.createdAt}</div>
                        <div>メンバー: {stats.membersCount}人 | タスク: {stats.tasksCount}件 | エビデンス: {stats.evidenceCount}件</div>
                        <div>ファイルサイズ: {stats.size}</div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* バックアップ復元 */}
      <Card>
        <CardHeader>
          <CardTitle>バックアップ復元</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              バックアップファイルからデータを復元します。
              <span className="text-red-600 font-medium">現在のデータは完全に上書きされますのでご注意ください。</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={isRestoring}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
              </div>
              
              {isRestoring && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">復元中...</span>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 14.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">注意事項</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>復元により現在のデータはすべて削除されます</li>
                    <li>復元前に必要に応じて現在のデータをバックアップしてください</li>
                    <li>復元は取り消しできません</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* データ統計 */}
      <Card>
        <CardHeader>
          <CardTitle>データ統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>定期的なバックアップを推奨します。重要なデータを失わないよう、安全な場所に保管してください。</p>
            <p>バックアップファイルにはすべての家族データが含まれているため、適切に管理してください。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BackupManagement