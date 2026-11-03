
// API connection for ChaosGuard AI

export type Source = 'live' | 'mock';

export interface Prediction {
  label: 'BENIGN' | 'ATTACK';
  confidence: number;
  source: Source;
  at: string;
}

export interface Summary {
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  roc_auc: number | null;
  requests: number;
  errors: number;
  error_rate: number;
  latency_p95_ms: number;
  drift_score: number;
}

export function base() {
  return localStorage.getItem('cg_api') ||
    import.meta.env.VITE_API_URL ||
    '/api';
}

// Common function for communicating with FastAPI
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(base() + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API Error ${response.status}: ${message}`);
  }

  return response.json();
}

// Get model features
export async function getFeatures() {
  const data = await request<{ features: string[] }>('/features');

  return {
    names: data.features,
    source: 'live' as Source
  };
}

// Get real ML prediction
export async function predict(
  features: Record<string, number>
): Promise<Prediction> {
  const data = await request<{
    prediction: string;
    confidence: number;
  }>('/predict', {
    method: 'POST',
    body: JSON.stringify({ features })
  });

  return {
    label: data.prediction.toUpperCase() === 'BENIGN'
      ? 'BENIGN'
      : 'ATTACK',
    confidence: data.confidence,
    source: 'live',
    at: new Date().toISOString()
  };
}

// Get model information
export async function getModelInfo() {
  const data = await request<{
    name: string;
    version: string;
    loaded: boolean;
  }>('/model-info');

  return {
    ...data,
    source: 'live' as Source
  };
}

// Get monitoring information
export async function getSummary() {
  try {
    const data = await request<Summary>('/metrics-summary');

    return {
      s: data,
      source: 'live' as Source
    };
  } catch {
    return {
      s: null,
      source: 'mock' as Source
    };
  }
}

// Start a chaos simulation
export async function simCall(
  kind: string,
  ms = 800
): Promise<boolean> {
  try {
    await request(`/sim/${kind}?seconds=15&ms=${ms}`, {
      method: 'POST'
    });
    return true;
  } catch {
    return false;
  }
}

// Reset chaos simulations
export async function simReset(): Promise<void> {
  try {
    await request('/sim-reset', {
      method: 'POST'
    });
  } catch {
    // Reset may fail if chaos testing is disabled.
  }
}

// Check backend health
export async function ping(): Promise<boolean> {
  try {
    await request('/health');
    return true;
  } catch {
    return false;
  }
}

// Test invalid input
export async function badInput(): Promise<number> {
  try {
    const response = await fetch(base() + '/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: { x: 1 } })
    });

    return response.status;
  } catch {
    return 0;
  }
}

// Check system performance and drift
export async function probe(): Promise<{
  ok: boolean;
  ms: number;
  drift: number;
}> {
  const start = performance.now();

  try {
    const data = await request<{ features: string[] }>('/features');

    const features = Object.fromEntries(
      data.features.map(name => [name, 1])
    );

    await request('/predict', {
      method: 'POST',
      body: JSON.stringify({ features })
    });

    const summary = await request<Summary>('/metrics-summary');

    return {
      ok: true,
      ms: performance.now() - start,
      drift: summary.drift_score
    };
  } catch {
    return {
      ok: false,
      ms: performance.now() - start,
      drift: 0
    };
  }
}
