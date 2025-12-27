'use client';

// Client Component: ERP Sync Dashboard
// Features: Manual sync trigger, sync history, skipped products management, background job polling

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

interface SyncLog {
  id: string;
  sync_type: 'scheduled' | 'manual';
  status: 'running' | 'success' | 'partial' | 'failed';
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  total_records_fetched: number;
  records_processed: number;
  records_updated: number;
  records_skipped: number;
  error_count: number;
  created_at: string;
}

interface SyncError {
  id: string;
  sync_log_id: string;
  product_sku?: string | null;
  error_message: string;
  error_details: {
    reason: string;
    missing_fields?: string[];
    validation_errors?: string[];
    dubros_raw_data?: any;
  };
  created_at: string;
}

interface ErpSyncClientProps {
  recentSyncs: SyncLog[];
  syncErrors: SyncError[];
  activeJobId?: string | null;
}

export default function ErpSyncClient({ recentSyncs, syncErrors, activeJobId: initialJobId }: ErpSyncClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'skipped'>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [selectedError, setSelectedError] = useState<SyncError | null>(null);
  const [filterReason, setFilterReason] = useState<string>('all');
  const [syncLimit, setSyncLimit] = useState<string>('50'); // Default: 50 products

  // Background job polling
  const [activeJobId, setActiveJobId] = useState<string | null>(initialJobId || null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Safe array handling
  const safeSyncs = recentSyncs || [];
  const safeErrors = syncErrors || [];

  const latestSync = safeSyncs[0] || null;
  const isRunning = latestSync?.status === 'running' || activeJobId !== null;

  // Poll for job status
  useEffect(() => {
    if (!activeJobId) return;

    const pollJob = async () => {
      try {
        const response = await fetch(`/api/admin/erp-sync-status/${activeJobId}`);
        const data = await response.json();

        if (response.ok && data.job) {
          setJobStatus(data.job);

          // If job is complete, stop polling
          if (['completed', 'failed', 'cancelled'].includes(data.job.status)) {
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
            setActiveJobId(null);
            setSyncResult({
              success: data.job.status === 'completed',
              message: data.job.status === 'completed'
                ? 'Sync completed successfully'
                : data.job.status === 'cancelled'
                ? 'Sync was cancelled'
                : 'Sync failed',
              stats: {
                processed: data.job.erp_sync_logs?.records_processed || data.job.current_item_count || 0,
                created: 0, // Not tracked separately anymore
                updated: data.job.erp_sync_logs?.records_updated || 0,
                skipped: 0,
                errors: data.job.error_count || 0,
              },
            });
            router.refresh();
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    };

    // Initial poll
    pollJob();

    // Set up polling interval (every 2 seconds)
    const interval = setInterval(pollJob, 2000);
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJobId]);

  // Cancel active job
  const handleCancelJob = async () => {
    if (!activeJobId) return;

    try {
      const response = await fetch(`/api/admin/erp-sync/jobs/${activeJobId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        setSyncResult({
          success: false,
          message: 'Cancellation requested. The job will stop after the current batch.',
        });
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  // Trigger manual sync
  const handleManualSync = async (quickTest = false) => {
    // Validate sync limit
    const limit = syncLimit === '' ? null : parseInt(syncLimit, 10);
    if (!quickTest && limit !== null && (isNaN(limit) || limit < 1)) {
      setSyncResult({
        success: false,
        error: 'Por favor ingresa un número válido (mínimo 1) o deja vacío para sincronizar todos los productos'
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/erp-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'manual',
          testLimit: quickTest ? 50 : limit,
          quickTest, // Just test DB writes if true
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if this is the new job-based response
        if (data.job_id) {
          // Start polling for job status
          setActiveJobId(data.job_id);
          setSyncResult({
            success: true,
            message: data.message || 'Sync job created. Processing in background.',
            job_id: data.job_id,
          });
        } else {
          // Old synchronous response (quickTest mode)
          setSyncResult({
            success: true,
            ...data,
          });

          // Refresh page data
          if (!quickTest) {
            router.refresh();
          }
        }
      } else {
        setSyncResult({
          success: false,
          error: data.error || 'Sync failed',
          ...data,
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Format date (client-side only to avoid hydration mismatch)
  const formatDate = (dateString: string) => {
    if (typeof window === 'undefined') {
      // Server-side: return ISO string without formatting
      return new Date(dateString).toISOString().slice(0, 16).replace('T', ' ');
    }
    // Client-side: format with locale
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format duration
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      running: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3" /> En Progreso</span>,
      success: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Exitoso</span>,
      partial: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Parcial</span>,
      failed: <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="w-3 h-3" /> Fallido</span>,
    };
    return badges[status as keyof typeof badges] || badges.failed;
  };

  // Filter skipped products by reason
  const filteredErrors = filterReason === 'all'
    ? safeErrors
    : safeErrors.filter(e => e.error_details?.reason === filterReason);

  // Get unique reasons for filter
  const reasons = Array.from(new Set(safeErrors.map(e => e.error_details?.reason).filter(Boolean)));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sincronización ERP</h1>
        <p className="text-gray-600 mt-2">
          Gestionar sincronización de inventario con dubros.com
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial ({safeSyncs.length})
          </button>
          <button
            onClick={() => setActiveTab('skipped')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'skipped'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Productos Omitidos ({safeErrors.length})
          </button>
        </nav>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Sync Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Estado de Sincronización</h2>
            </div>

            {/* Sync Controls */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de productos a sincronizar
              </label>
              <div className="flex gap-2 mb-3 flex-wrap">
                <button
                  onClick={() => setSyncLimit('50')}
                  disabled={isSyncing}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  50
                </button>
                <button
                  onClick={() => setSyncLimit('100')}
                  disabled={isSyncing}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  100
                </button>
                <button
                  onClick={() => setSyncLimit('500')}
                  disabled={isSyncing}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  500
                </button>
                <button
                  onClick={() => setSyncLimit('')}
                  disabled={isSyncing}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Todos (~4,138)
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={syncLimit}
                  onChange={(e) => setSyncLimit(e.target.value)}
                  placeholder="O ingresa cantidad personalizada (vacío = todos)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSyncing}
                />
                <button
                  onClick={() => handleManualSync(false)}
                  disabled={isSyncing || isRunning}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Sincronizar más de 100 productos puede tardar varios minutos debido a la velocidad de la API de dubros.com
              </p>
            </div>

            {/* Progress Bar for Active Job */}
            {jobStatus && activeJobId && (
              <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <p className="font-semibold text-blue-800">Sync In Progress</p>
                  </div>
                  <button
                    onClick={handleCancelJob}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-blue-700 mb-1">
                    <span>{jobStatus.current_step || 'Processing...'}</span>
                    <span>{jobStatus.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${jobStatus.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Progress Details */}
                {jobStatus.current_item_count !== undefined && jobStatus.total_item_count && (
                  <p className="text-sm text-blue-700">
                    Products: {jobStatus.current_item_count} / {jobStatus.total_item_count}
                  </p>
                )}

                <p className="text-xs text-blue-600 mt-2">
                  💡 You can leave this page. The sync will continue in the background.
                </p>
              </div>
            )}

            {/* Sync Result Alert */}
            {syncResult && !activeJobId && (
              <div className={`mb-4 p-4 rounded-lg ${syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-semibold ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {syncResult.success ? '✓ Sincronización Completada' : '✗ Sincronización Fallida'}
                </p>
                {syncResult.message && <p className="text-sm mt-1 text-gray-700">{syncResult.message}</p>}
                {syncResult.stats && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p>Productos procesados: {syncResult.stats.processed}</p>
                    <p>Creados: {syncResult.stats.created} | Actualizados: {syncResult.stats.updated}</p>
                    <p>Omitidos: {syncResult.stats.skipped} | Errores: {syncResult.stats.errors}</p>
                  </div>
                )}
                {syncResult.diagnostics && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                    <p className="font-semibold">DB Counts:</p>
                    <p>Sync Logs: {syncResult.diagnostics.dbCounts?.syncLogs ?? 'N/A'}</p>
                    <p>Products (ERP): {syncResult.diagnostics.dbCounts?.products ?? 'N/A'}</p>
                    <p>Categories (ERP): {syncResult.diagnostics.dbCounts?.categories ?? 'N/A'}</p>
                    <p>Brands (ERP): {syncResult.diagnostics.dbCounts?.brands ?? 'N/A'}</p>
                  </div>
                )}
                {syncResult.error && !syncResult.success && (
                  <div className="mt-2 text-sm text-red-700">
                    <p>Error: {syncResult.error}</p>
                    {syncResult.message && <p>Details: {syncResult.message}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Latest Sync Info */}
            {latestSync && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-1">{getStatusBadge(latestSync.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Sincronización</p>
                  <p className="mt-1 font-medium" suppressHydrationWarning>{formatDate(latestSync.started_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duración</p>
                  <p className="mt-1 font-medium">{formatDuration(latestSync.duration_seconds)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Productos Procesados</p>
                  <p className="mt-1 font-medium">{latestSync.records_processed}</p>
                </div>
              </div>
            )}

            {!latestSync && (
              <p className="text-gray-500 text-center py-8">No hay sincronizaciones previas</p>
            )}
          </div>

          {/* Stats Cards */}
          {latestSync && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Productos Obtenidos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{latestSync.total_records_fetched}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Actualizados</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{latestSync.records_updated}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Omitidos</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{latestSync.records_skipped}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Errores</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{latestSync.error_count}</p>
              </div>
            </div>
          )}

          {/* Configuration Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información de Configuración</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Fuente:</strong> dubros.com (Base de datos: Producto-lean-mirror)</p>
              <p><strong>Sincronización Programada:</strong> Manual (automático próximamente)</p>
              <p suppressHydrationWarning><strong>Última sincronización:</strong> {latestSync ? formatDate(latestSync.started_at) : 'Nunca'}</p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Próximamente: Opciones de sincronización automática (Diaria, Semanal, Cada 48h, Personalizada)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sync History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Historial de Sincronizaciones</h2>

            {safeSyncs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay sincronizaciones registradas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Inicio</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Duración</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Procesados</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actualizados</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeSyncs.map((sync) => (
                      <tr key={sync.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{getStatusBadge(sync.status)}</td>
                        <td className="py-3 px-4">
                          <span className="capitalize">{sync.sync_type === 'manual' ? 'Manual' : 'Programado'}</span>
                        </td>
                        <td className="py-3 px-4" suppressHydrationWarning>{formatDate(sync.started_at)}</td>
                        <td className="py-3 px-4">{formatDuration(sync.duration_seconds)}</td>
                        <td className="py-3 px-4">{sync.records_processed}</td>
                        <td className="py-3 px-4">{sync.records_updated}</td>
                        <td className="py-3 px-4">
                          <span className={sync.error_count > 0 ? 'text-red-600 font-semibold' : ''}>
                            {sync.error_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Skipped Products */}
      {activeTab === 'skipped' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filtrar por:</label>
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Todos ({safeErrors.length})</option>
                {reasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason === 'missing_required_field' && `Campos Requeridos Faltantes (${safeErrors.filter(e => e.error_details?.reason === reason).length})`}
                    {reason === 'validation_error' && `Errores de Validación (${safeErrors.filter(e => e.error_details?.reason === reason).length})`}
                    {reason === 'lookup_failed' && `Fallo en Búsqueda (${safeErrors.filter(e => e.error_details?.reason === reason).length})`}
                    {reason === 'other' && `Otros (${safeErrors.filter(e => e.error_details?.reason === reason).length})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skipped Products List */}
          {filteredErrors.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No hay productos omitidos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErrors.map((error) => (
                <div key={error.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                          Omitido
                        </span>
                        {error.product_sku && (
                          <span className="font-mono text-sm font-semibold">SKU: {error.product_sku}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Razón:</strong> {error.error_message}
                      </p>
                      {error.error_details.missing_fields && error.error_details.missing_fields.length > 0 && (
                        <p className="text-sm text-gray-600">
                          <strong>Campos faltantes:</strong> {error.error_details.missing_fields.join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2" suppressHydrationWarning>{formatDate(error.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setSelectedError(error)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: View Full Data */}
      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Detalles del Producto Omitido</h2>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                {selectedError.product_sku && (
                  <div>
                    <p className="text-sm text-gray-600">SKU</p>
                    <p className="font-mono font-semibold">{selectedError.product_sku}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Error</p>
                  <p className="text-red-600 font-medium">{selectedError.error_message}</p>
                </div>

                {selectedError.error_details.missing_fields && selectedError.error_details.missing_fields.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Campos Requeridos Faltantes</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedError.error_details.missing_fields.map((field) => (
                        <span key={field} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Data */}
                {selectedError.error_details.dubros_raw_data && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Datos de dubros.com</p>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedError.error_details.dubros_raw_data, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => setSelectedError(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
