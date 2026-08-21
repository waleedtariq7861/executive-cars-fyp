import React, { useCallback, useEffect, useState } from 'react'
import { Activity, Database, FileUp, RotateCcw, Sparkles } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import api from '../../api/api.js'
import Button from '../../components/ui/Button.jsx'
import { Alert, EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { ConfirmationDialog } from '../../components/ui/Overlays.jsx'
import { Checkbox, FormField, Input } from '../../components/ui/FormControls.jsx'
import { useToast } from '../../context/toastContext.js'
import { formatPkr } from '../../utils/format.js'

export default function AdminDataModelsPage() {
  const { showToast } = useToast()
  const [summary, setSummary] = useState(null)
  const [imports, setImports] = useState([])
  const [health, setHealth] = useState(null)
  const [registry, setRegistry] = useState(null)
  const [file, setFile] = useState(null)
  const [source, setSource] = useState('')
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [training, setTraining] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const [summaryResult, importsResult, healthResult, modelsResult] = await Promise.allSettled([
      api.get('/admin/dataset-summary'), api.get('/admin/dataset-imports'), api.get('/admin/model-health'), api.get('/admin/model-versions'),
    ])
    if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value.data)
    if (importsResult.status === 'fulfilled') setImports(importsResult.value.data)
    if (healthResult.status === 'fulfilled') setHealth(healthResult.value.data)
    if (modelsResult.status === 'fulfilled') setRegistry(modelsResult.value.data)
    if (summaryResult.status === 'rejected' || importsResult.status === 'rejected') setError('Could not load the dataset administration module.')
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const upload = async event => {
    event.preventDefault()
    if (!file || !source.trim() || !rightsConfirmed) return setError('Choose a dataset, describe its source, and confirm usage rights.')
    const payload = new FormData(); payload.append('dataset', file); payload.append('source', source); payload.append('rightsConfirmed', 'true')
    setUploading(true); setError('')
    try {
      const { data } = await api.post('/admin/dataset-imports', payload, { timeout: 120000 })
      showToast({ tone: 'success', title: 'Import completed', message: `${data.import.report.importedRecords} new usable records added.` })
      setFile(null); setSource(''); setRightsConfirmed(false); event.target.reset(); await load()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Dataset import failed.')
    } finally { setUploading(false) }
  }

  const train = async () => {
    setConfirmAction(null); setTraining(true)
    try {
      const { data } = await api.post('/admin/model-train', {}, { timeout: 10 * 60 * 1000 })
      showToast({ tone: 'success', title: 'Model trained', message: `${data.selectedModel} · test MAE ${formatPkr(data.metrics.mae)}` })
      await load()
    } catch (requestError) {
      showToast({ tone: 'error', title: 'Training failed', message: requestError.response?.data?.message || 'Prediction service is unavailable.' })
    } finally { setTraining(false) }
  }

  const activate = async version => {
    setConfirmAction(null)
    try { await api.post(`/admin/model-versions/${encodeURIComponent(version)}/activate`); showToast({ tone: 'success', title: 'Model activated', message: version }); await load() }
    catch (requestError) { showToast({ tone: 'error', title: 'Activation failed', message: requestError.response?.data?.message }) }
  }
  const rollback = async () => {
    setConfirmAction(null)
    try { await api.post('/admin/model-rollback'); showToast({ tone: 'success', title: 'Model rolled back' }); await load() }
    catch (requestError) { showToast({ tone: 'error', title: 'Rollback failed', message: requestError.response?.data?.message }) }
  }

  if (loading) return <AdminLayout title="Data & Models"><div className="space-y-4">{[1, 2, 3].map(item => <Skeleton key={item} className="h-40" />)}</div></AdminLayout>

  return <AdminLayout title="Data & Models">
    {error && <Alert tone="error" title="Action needed" className="mb-5">{error}</Alert>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{[
      { label: 'Usable dataset rows', value: summary?.rowCount ?? 0, icon: Database },
      { label: 'Import batches', value: imports.length, icon: FileUp },
      { label: 'Prediction service', value: health?.reachable ? (health.modelLoaded ? 'Model ready' : 'No model') : 'Unavailable', icon: Activity },
      { label: 'Active version', value: registry?.activeVersion || 'Fallback only', icon: Sparkles },
    ].map(item => <div key={item.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"><item.icon className="w-5 h-5 text-blue-700" /><p className="text-xs text-gray-500 mt-4">{item.label}</p><p className="font-black text-gray-950 mt-1 break-all">{item.value}</p></div>)}</div>

    {!health?.reachable && <Alert tone="warning" title="ML service unavailable" className="mb-6">Predictions can still use local marketplace comparables. Start the Python service before training or activating a model.</Alert>}

    <div className="grid xl:grid-cols-[.9fr_1.1fr] gap-6">
      <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm"><h2 className="font-black text-gray-950">Import a legal dataset</h2><p className="text-sm text-gray-500 leading-6 mt-1">Accepted: CSV or JSON, maximum 10 MB and 25,000 rows. Personal seller fields are ignored.</p><form onSubmit={upload} className="space-y-4 mt-6"><FormField label="Dataset file" htmlFor="dataset-file" required><Input id="dataset-file" type="file" accept=".csv,.json,text/csv,application/json" onChange={event => setFile(event.target.files?.[0] || null)} className="py-2" /></FormField><FormField label="Source description" htmlFor="dataset-source" required hint="Example: University-approved manually exported marketplace dataset, collected June 2026."><Input id="dataset-source" value={source} onChange={event => setSource(event.target.value)} /></FormField><Checkbox checked={rightsConfirmed} onChange={event => setRightsConfirmed(event.target.checked)} label="I confirm this dataset may legally be used" description="Do not upload scraped, private, or terms-violating data." /><Button type="submit" loading={uploading} className="w-full"><FileUp className="w-4 h-4" /> Import and validate</Button></form></section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm"><div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"><div><h2 className="font-black text-gray-950">Model training</h2><p className="text-sm text-gray-500 mt-1">Runs a controlled comparison of the median baseline, Extra Trees, histogram gradient boosting, and CatBoost with leakage-safe train, validation, calibration, and test splits.</p></div><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!registry?.previousVersion} onClick={() => setConfirmAction({ type: 'rollback' })}><RotateCcw className="w-4 h-4" /> Roll back</Button><Button size="sm" loading={training} disabled={!health?.reachable || (summary?.rowCount || 0) < 30} onClick={() => setConfirmAction({ type: 'train' })}><Sparkles className="w-4 h-4" /> Train model</Button></div></div><div className="mt-6 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200">{['Version', 'Model', 'Rows', 'Test MAE', 'R²', 'Action'].map(label => <th key={label} className="text-left text-xs text-gray-500 uppercase py-3 pr-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{registry?.versions?.map(version => <tr key={version.version}><td className="py-3 pr-4 font-mono text-xs max-w-40 break-all">{version.version}{registry.activeVersion === version.version && <span className="block text-green-700 font-bold mt-1">Active</span>}</td><td className="py-3 pr-4">{version.modelName}</td><td className="py-3 pr-4">{version.datasetSize}</td><td className="py-3 pr-4">{formatPkr(version.metrics?.mae)}</td><td className="py-3 pr-4">{version.metrics?.r2}</td><td className="py-3"><Button size="sm" variant="outline" disabled={registry.activeVersion === version.version} onClick={() => setConfirmAction({ type: 'activate', version: version.version })}>Activate</Button></td></tr>)}{!registry?.versions?.length && <tr><td colSpan="6"><EmptyState title="No trained model versions" description="Import at least 30 usable records, start the ML service, and trigger training." /></td></tr>}</tbody></table></div></section>
    </div>

    <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm mt-6"><h2 className="font-black text-gray-950">Import history</h2><div className="overflow-x-auto mt-4"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200">{['File', 'Source', 'Received', 'Imported', 'Rejected', 'Duplicates', 'Date'].map(label => <th key={label} className="text-left text-xs text-gray-500 uppercase py-3 pr-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{imports.map(item => <tr key={item._id}><td className="py-3 pr-4 font-bold">{item.fileName}</td><td className="py-3 pr-4 max-w-xs">{item.source}</td><td className="py-3 pr-4">{item.report?.receivedRecords}</td><td className="py-3 pr-4 text-green-700 font-bold">{item.report?.importedRecords}</td><td className="py-3 pr-4 text-red-700">{item.report?.rejectedRecords}</td><td className="py-3 pr-4">{item.report?.duplicateRecords}</td><td className="py-3">{new Date(item.createdAt).toLocaleString('en-PK')}</td></tr>)}{!imports.length && <tr><td colSpan="7"><EmptyState title="No imports yet" /></td></tr>}</tbody></table></div></section>

    <ConfirmationDialog open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} onConfirm={() => confirmAction?.type === 'train' ? train() : confirmAction?.type === 'rollback' ? rollback() : activate(confirmAction?.version)} title={confirmAction?.type === 'train' ? 'Train a new model?' : confirmAction?.type === 'rollback' ? 'Roll back active model?' : 'Activate this model?'} description={confirmAction?.type === 'train' ? `Training will use ${summary?.rowCount || 0} normalized rows and may take several minutes.` : confirmAction?.version || registry?.previousVersion} confirmLabel={confirmAction?.type === 'train' ? 'Start training' : 'Confirm'} />
  </AdminLayout>
}
