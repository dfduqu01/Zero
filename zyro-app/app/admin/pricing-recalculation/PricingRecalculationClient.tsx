'use client';

// Client Component: Pricing Recalculation Dashboard
// Features: Formula selection, manual recalculation trigger, history, error management, background job polling

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Loader2,
  Info,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

interface PricingLog {
  id: string;
  status: 'running' | 'success' | 'partial' | 'failed';
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  total_products: number;
  products_updated: number;
  products_skipped: number;
  error_count: number;
  shipping_cost: number;
  pricing_formula: 1 | 2;
  respect_overrides: boolean;
  product_ids?: string[] | null;
  created_at: string;
}

interface PricingError {
  id: string;
  log_id: string;
  product_sku?: string | null;
  error_message: string;
  error_details: {
    reason: string;
    error?: any;
  };
  created_at: string;
}

interface PricingTier {
  id: string;
  tier_name: string;
  min_cost: number;
  max_cost: number | null;
  markup_multiplier: number;
  display_order: number;
}

interface PricingRecalculationClientProps {
  recentLogs: PricingLog[];
  pricingErrors: PricingError[];
  activeJobId?: string | null;
  pricingTiers: PricingTier[];
}

export default function PricingRecalculationClient({
  recentLogs,
  pricingErrors,
  activeJobId: initialJobId,
  pricingTiers,
}: PricingRecalculationClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'errors'>('overview');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<any>(null);
  const [selectedError, setSelectedError] = useState<PricingError | null>(null);

  // Form state
  const [pricingFormula, setPricingFormula] = useState<1 | 2>(2); // Default to Formula 2 (recommended)
  const [shippingCost, setShippingCost] = useState<string>('25');
  const [respectOverrides, setRespectOverrides] = useState<boolean>(true);

  // Background job polling
  const [activeJobId, setActiveJobId] = useState<string | null>(initialJobId || null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Safe array handling
  const safeLogs = recentLogs || [];
  const safeErrors = pricingErrors || [];

  const latestLog = safeLogs[0] || null;
  const isRunning = latestLog?.status === 'running' || activeJobId !== null;

  // Poll for job status
  useEffect(() => {
    if (!activeJobId) return;

    const pollJob = async () => {
      try {
        const response = await fetch(`/api/admin/pricing-status/${activeJobId}`);
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
            setRecalcResult({
              success: data.job.status === 'completed',
              message: data.job.status === 'completed'
                ? 'Recálculo completado exitosamente'
                : data.job.status === 'cancelled'
                ? 'Recálculo fue cancelado'
                : 'Recálculo falló',
              stats: data.job.log || {},
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
  }, [activeJobId, router]);

  // Trigger recalculation
  const handleRecalculate = async () => {
    const shipping = parseFloat(shippingCost);
    if (isNaN(shipping) || shipping < 0) {
      setRecalcResult({
        success: false,
        error: 'Por favor ingresa un costo de envío válido (mínimo 0)'
      });
      return;
    }

    const formulaName = pricingFormula === 1 ? 'Envío Incluido' : 'Envío Separado (Recomendada)';
    const confirmed = confirm(
      `¿Estás seguro de que deseas recalcular precios usando la fórmula "${formulaName}"?\n\n` +
      `Esto actualizará los precios de todos los productos ${respectOverrides ? 'excepto aquellos con precios manuales' : 'incluyendo precios manuales'}.`
    );

    if (!confirmed) return;

    setIsRecalculating(true);
    setRecalcResult(null);

    try {
      const response = await fetch('/api/admin/pricing/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pricingFormula,
          shippingCost: shipping,
          respectOverrides,
          productIds: null, // All products
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Start polling for job status
        setActiveJobId(data.job_id);
        setRecalcResult({
          success: true,
          message: data.message || 'Job de recálculo creado. Procesando en segundo plano.',
          job_id: data.job_id,
        });
      } else {
        setRecalcResult({
          success: false,
          error: data.error || 'Recálculo falló',
        });
      }
    } catch (error) {
      setRecalcResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  // Format date - use ISO format to avoid hydration mismatch
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16).replace('T', ' ');
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

  // Get formula badge
  const getFormulaBadge = (formula: 1 | 2) => {
    if (formula === 1) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Envío Incluido</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Envío Separado</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Recalcular Precios</h1>
        <p className="text-gray-600 mt-2">
          Actualizar precios de productos basado en costos y fórmulas de pricing
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
            Historial ({safeLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'errors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Errores ({safeErrors.length})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Tiers Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-600" />
                  Niveles de Precio Actuales
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Estas reglas de markup se aplicarán durante el recálculo
                </p>
              </div>
              <Link
                href="/admin/pricing-tiers"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Settings className="w-4 h-4" />
                Editar Niveles
              </Link>
            </div>
            {pricingTiers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {pricingTiers.map((tier) => (
                  <div key={tier.id} className="bg-white p-3 rounded border border-gray-200">
                    <div className="font-medium text-gray-900 text-sm">{tier.tier_name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      ${tier.min_cost.toFixed(2)} - {tier.max_cost ? `$${tier.max_cost.toFixed(2)}` : '∞'}
                    </div>
                    <div className="text-sm font-semibold text-blue-600 mt-1">
                      {tier.markup_multiplier}x markup
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-red-600">
                ⚠️ No hay niveles de precio definidos. Por favor crea niveles primero.
              </div>
            )}
          </div>
          {/* Current Status Card */}
          {latestLog && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Último Recálculo</h2>
                {getStatusBadge(latestLog.status)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Productos Actualizados</p>
                  <p className="text-2xl font-bold text-green-600">{latestLog.products_updated || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Productos Omitidos</p>
                  <p className="text-2xl font-bold text-yellow-600">{latestLog.products_skipped || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Errores</p>
                  <p className="text-2xl font-bold text-red-600">{latestLog.error_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duración</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(latestLog.duration_seconds)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <span>Fórmula: {getFormulaBadge(latestLog.pricing_formula)}</span>
                <span>Costo de envío: ${latestLog.shipping_cost}</span>
                <span>Respeta override: {latestLog.respect_overrides ? 'Sí' : 'No'}</span>
                <span>{formatDate(latestLog.started_at)}</span>
              </div>
            </div>
          )}

          {/* Active Job Progress */}
          {activeJobId && jobStatus && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <h3 className="text-lg font-semibold text-blue-900">Recalculando Precios...</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium text-blue-900">
                  <span>{jobStatus.current_step || 'Procesando...'}</span>
                  <span>{jobStatus.progress || 0}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${jobStatus.progress || 0}%` }}
                  />
                </div>
                {jobStatus.current_item_count !== null && jobStatus.total_item_count && (
                  <p className="text-sm text-blue-700">
                    {jobStatus.current_item_count} / {jobStatus.total_item_count} productos procesados
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Result Message */}
          {recalcResult && !activeJobId && (
            <div className={`rounded-lg p-4 ${recalcResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {recalcResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${recalcResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {recalcResult.message || (recalcResult.success ? 'Éxito' : 'Error')}
                  </p>
                  {recalcResult.error && (
                    <p className="text-sm text-red-700 mt-1">{recalcResult.error}</p>
                  )}
                  {recalcResult.stats && (
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Actualizados: </span>
                        <span className="font-semibold text-green-700">{recalcResult.stats.products_updated}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Omitidos: </span>
                        <span className="font-semibold text-yellow-700">{recalcResult.stats.products_skipped}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Errores: </span>
                        <span className="font-semibold text-red-700">{recalcResult.stats.error_count}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recalculation Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configurar Recálculo</h2>

            {/* Formula Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Fórmula de Precios
              </label>
              <div className="space-y-3">
                {/* Formula 2 - Recommended */}
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    pricingFormula === 2
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setPricingFormula(2)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={pricingFormula === 2}
                      onChange={() => setPricingFormula(2)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">Envío Separado</span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">Recomendada</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Precios más competitivos, envío se agrega en checkout
                      </p>
                      <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        precio = costo_dubros × markup
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="text-green-600">✓ Precios más bajos</span>
                        <span className="text-green-600">✓ Más competitivo</span>
                        <span className="text-green-600">✓ Estándar e-commerce</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formula 1 - Current */}
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    pricingFormula === 1
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setPricingFormula(1)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={pricingFormula === 1}
                      onChange={() => setPricingFormula(1)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">Envío Incluido</span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Actual</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Precio todo incluido, sin sorpresas en checkout
                      </p>
                      <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        precio = costo_envio + (costo_dubros × markup)
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="text-blue-600">✓ Sin sorpresas</span>
                        <span className="text-blue-600">✓ Precio final claro</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Cost */}
            <div className="mb-4">
              <label htmlFor="shipping" className="block text-sm font-medium text-gray-700 mb-1">
                Costo de Envío (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="shipping"
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  min={0}
                  step={1}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isRecalculating || isRunning}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {pricingFormula === 1
                  ? 'Se incluirá en el precio del producto'
                  : 'Se agregará por separado en el checkout'}
              </p>
            </div>

            {/* Respect Overrides */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={respectOverrides}
                  onChange={(e) => setRespectOverrides(e.target.checked)}
                  className="mt-1 rounded"
                  disabled={isRecalculating || isRunning}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Respetar precios manuales (overrides)
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    No actualizar productos con precio manual configurado
                  </p>
                </div>
              </label>
            </div>

            {/* Action Button */}
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating || isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isRecalculating || isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  Recalcular Todos los Precios
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fórmula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actualizados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay historial de recálculos
                  </td>
                </tr>
              ) : (
                safeLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getFormulaBadge(log.pricing_formula)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.total_products || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {log.products_updated || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {log.error_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(log.duration_seconds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.started_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Errores de Recálculo ({safeErrors.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {safeErrors.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay errores registrados
              </div>
            ) : (
              safeErrors.slice(0, 50).map((error) => (
                <div key={error.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {error.product_sku && (
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {error.product_sku}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDate(error.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-red-700">{error.error_message}</p>
                      {error.error_details?.reason && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          {error.error_details.reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
