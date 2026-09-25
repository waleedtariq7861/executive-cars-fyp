import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Check, Copy, Database, FileUp, RotateCcw, Sparkles } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import api from '../../api/api.js'
import Button from '../../components/ui/Button.jsx'
import { Alert, EmptyState, Skeleton } from '../../components/ui/Feedback.jsx'
import { ConfirmationDialog } from '../../components/ui/Overlays.jsx'
import { Checkbox, FormField, Input } from '../../components/ui/FormControls.jsx'
import { useToast } from '../../context/toastContext.js'
import { formatPkr } from '../../utils/format.js'

const shortVersion = value => {
  const version = String(value || '')
  return version.length > 24 ? `${version.slice(0, 16)}…${version.slice(-7)}` : version
}

const displayDate = value => value ? new Date(value).toLocaleString('en-PK') : 'Legacy metadata unavailable'

function ProvenanceGrid({ version }) {
  const provenance = version?.provenance || {}
  const items = [
    ['Dataset', provenance.datasetName],
    ['Source category', provenance.sourceCategory],
    ['Dataset fingerprint', provenance.datasetFingerprint],
    ['Dataset rows', provenance.datasetRows ?? version?.datasetSize],
    ['Rows used to train', provenance.trainedRows ?? version?.trainedRows],
    ['Training date', displayDate(provenance.trainingDate || version?.trainingDate)],
  ]
  return <dl className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
    {items.map(([label, value]) => <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 min-w-0"><dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</dt><dd className="text-sm font-semibold text-gray-900 mt-1 break-words" title={String(value || '')}>{value || 'Legacy metadata unavailable'}</dd></div>)}
  </dl>
}

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
  const [copiedVersion, setCopiedVersion] = useState('')

  const activeModel = useMemo(
    () => registry?.versions?.find(version => version.version === registry.activeVersion),
    [registry]
  )
  const canTrain = health?.reachable && (summary?.rowCount || 0) >= 30

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
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
    const payload = new FormData()
    payload.append('dataset', file)
    payload.append('source', source)
    payload.append('rightsConfirmed', 'true')
    setUploading(true)
    setError('')
    try {
      const { data } = await api.post('/admin/dataset-imports', payload, { timeout: 120000 })
      showToast({ tone: 'success', title: 'Import completed', message: `${data.import.report.importedRecords} new usable records added.` })
      setFile(null)
      setSource('')
      setRightsConfirmed(false)
      event.target.reset()
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Dataset import failed.')
    } finally { setUploading(false) }
  }

  const train = async () => {
    setConfirmAction(null)
    setTraining(true)
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
    try {
      await api.post(`/admin/model-versions/${encodeURIComponent(version)}/activate`)
      showToast({ tone: 'success', title: 'Model activated', message: version })
      await load()
    } catch (requestError) {
      showToast({ tone: 'error', title: 'Activation failed', message: requestError.response?.data?.message })
    }
  }

  const rollback = async () => {
    setConfirmAction(null)
    try {
      await api.post('/admin/model-rollback')
      showToast({ tone: 'success', title: 'Model rolled back' })
      await load()
    } catch (requestError) {
      showToast({ tone: 'error', title: 'Rollback failed', message: requestError.response?.data?.message })
    }
  }

  const copyVersion = async version => {
    await navigator.clipboard.writeText(version)
    setCopiedVersion(version)
    setTimeout(() => setCopiedVersion(''), 1800)
  }

  if (loading) return <AdminLayout title="Data & Models"><div className="space-y-4">{[1, 2, 3].map(item => <Skeleton key={item} className="h-40" />)}</div></AdminLayout>

  return <AdminLayout title="Data & Models">
    {error && <Alert tone="error" title="Action needed" className="mb-5">{error}</Alert>}

    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Admin-imported training rows', value: summary?.rowCount ?? 0, icon: Database },
        { label: 'Import batches', value: imports.length, icon: FileUp },
        { label: 'Prediction service', value: health?.reachable ? (health.modelLoaded ? 'Model ready' : 'No model') : 'Unavailable', icon: Activity },
        { label: 'Active version', value: registry?.activeVersion || 'Fallback only', icon: Sparkles, version: true },
      ].map(item => <div key={item.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm min-w-0"><item.icon className="w-5 h-5 text-blue-700" /><p className="text-xs text-gray-500 mt-4">{item.label}</p><p className="font-black text-gray-950 mt-1 break-words" title={item.version ? String(item.value) : undefined}>{item.version ? shortVersion(item.value) : item.value}</p></div>)}
    </div>

    {!health?.reachable && <Alert tone="warning" title="ML service unavailable" className="mb-6">Predictions can still use local marketplace comparables. Start the Python service before training or activating a model.</Alert>}

    <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3"><div><p className="eyebrow">Active model provenance</p><h2 className="font-black text-gray-950 mt-1">{activeModel?.modelName || 'No active trained model'}</h2><p className="text-sm text-gray-500 mt-1">This describes the immutable dataset used by the active model. It is separate from the MongoDB rows available for the next training run.</p></div>{activeModel && <button type="button" onClick={() => copyVersion(activeModel.version)} className="btn-ghost px-3 py-2 text-xs inline-flex items-center gap-2 self-start" aria-label={`Copy full version ${activeModel.version}`}>{copiedVersion === activeModel.version ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{shortVersion(activeModel.version)}</button>}</div>
      {activeModel ? <ProvenanceGrid version={activeModel} /> : <EmptyState title="No active model provenance" description="Train or activate a model to establish provenance." />}
    </section>

    <div className="grid 2xl:grid-cols-[.8fr_1.2fr] gap-6">
      <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm"><h2 className="font-black text-gray-950">Import a legal dataset</h2><p className="text-sm text-gray-500 leading-6 mt-1">Accepted: CSV or JSON, maximum 10 MB and 25,000 rows. Personal seller fields are ignored.</p><form onSubmit={upload} className="space-y-4 mt-6"><FormField label="Dataset file" htmlFor="dataset-file" required><Input id="dataset-file" type="file" accept=".csv,.json,text/csv,application/json" onChange={event => setFile(event.target.files?.[0] || null)} className="py-2" /></FormField><FormField label="Source description" htmlFor="dataset-source" required hint="Example: University-approved manually exported marketplace dataset, collected June 2026."><Input id="dataset-source" value={source} onChange={event => setSource(event.target.value)} /></FormField><Checkbox checked={rightsConfirmed} onChange={event => setRightsConfirmed(event.target.checked)} label="I confirm this dataset may legally be used" description="Do not upload scraped, private, or terms-violating data." /><Button type="submit" loading={uploading} className="w-full"><FileUp className="w-4 h-4" /> Import and validate</Button></form></section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm min-w-0"><div><h2 className="font-black text-gray-950">Model training</h2><p className="text-sm text-gray-500 mt-1">A new run uses only the <strong>{summary?.rowCount || 0} admin-imported MongoDB rows</strong> shown above. Existing model dataset sizes are historical provenance, not rows available to Train now.</p></div><div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100"><Button variant="outline" size="sm" disabled={!registry?.previousVersion} onClick={() => setConfirmAction({ type: 'rollback' })}><RotateCcw className="w-4 h-4" /> Roll back</Button><Button size="sm" loading={training} disabled={!canTrain} onClick={() => setConfirmAction({ type: 'train' })}><Sparkles className="w-4 h-4" /> Train model</Button></div>{!canTrain && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">{!health?.reachable ? 'Training is disabled while the ML service is unavailable.' : `Training needs at least 30 imported rows; ${summary?.rowCount || 0} are currently available.`}</p>}

        <div className="grid gap-3 mt-6">{registry?.versions?.map(version => <article key={version.version} className={`rounded-xl border p-4 ${registry.activeVersion === version.version ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-gray-50/60'}`}><div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-gray-950">{version.modelName}</h3>{registry.activeVersion === version.version && <span className="badge-green rounded-full px-2 py-0.5 text-[11px] font-bold">Active</span>}</div><button type="button" onClick={() => copyVersion(version.version)} className="font-mono text-xs text-blue-700 mt-1 inline-flex items-center gap-1.5" title={version.version} aria-label={`Copy full version ${version.version}`}>{copiedVersion === version.version ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{shortVersion(version.version)}</button></div><Button size="sm" variant="outline" disabled={registry.activeVersion === version.version} onClick={() => setConfirmAction({ type: 'activate', version: version.version })}>Activate</Button></div><dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm"><div><dt className="text-xs text-gray-500">Dataset rows</dt><dd className="font-bold">{version.provenance?.datasetRows ?? version.datasetSize ?? '—'}</dd></div><div><dt className="text-xs text-gray-500">Trained rows</dt><dd className="font-bold">{version.provenance?.trainedRows ?? version.trainedRows ?? '—'}</dd></div><div><dt className="text-xs text-gray-500">Test MAE</dt><dd className="font-bold">{formatPkr(version.metrics?.mae)}</dd></div><div><dt className="text-xs text-gray-500">R²</dt><dd className="font-bold">{version.metrics?.r2 ?? '—'}</dd></div></dl></article>)}{!registry?.versions?.length && <EmptyState title="No trained model versions" description="Import at least 30 usable records, start the ML service, and trigger training." />}</div>
      </section>
    </div>

    <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm mt-6"><h2 className="font-black text-gray-950">Import history</h2><div className="overflow-x-auto responsive-record-table-wrap mt-4"><table className="w-full text-sm responsive-record-table"><thead><tr className="border-b border-gray-200">{['File', 'Source', 'Received', 'Imported', 'Rejected', 'Duplicates', 'Date'].map(label => <th key={label} className="text-left text-xs text-gray-500 uppercase py-3 pr-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{imports.map(item => <tr key={item._id}><td data-label="File" className="py-3 pr-4 font-bold">{item.fileName}</td><td data-label="Source" className="py-3 pr-4 max-w-xs">{item.source}</td><td data-label="Received" className="py-3 pr-4">{item.report?.receivedRecords}</td><td data-label="Imported" className="py-3 pr-4 text-green-700 font-bold">{item.report?.importedRecords}</td><td data-label="Rejected" className="py-3 pr-4 text-red-700">{item.report?.rejectedRecords}</td><td data-label="Duplicates" className="py-3 pr-4">{item.report?.duplicateRecords}</td><td data-label="Date" className="py-3">{new Date(item.createdAt).toLocaleString('en-PK')}</td></tr>)}{!imports.length && <tr><td colSpan="7" className="responsive-record-empty"><EmptyState title="No imports yet" /></td></tr>}</tbody></table></div></section>

    <ConfirmationDialog open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} onConfirm={() => confirmAction?.type === 'train' ? train() : confirmAction?.type === 'rollback' ? rollback() : activate(confirmAction?.version)} title={confirmAction?.type === 'train' ? 'Train a new model?' : confirmAction?.type === 'rollback' ? 'Roll back active model?' : 'Activate this model?'} description={confirmAction?.type === 'train' ? `Training will use ${summary?.rowCount || 0} normalized administrator-imported rows and may take several minutes.` : confirmAction?.version || registry?.previousVersion} confirmLabel={confirmAction?.type === 'train' ? 'Start training' : 'Confirm'} />
  </AdminLayout>
}
