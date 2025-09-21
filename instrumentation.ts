import { reportWebVital } from '@/lib/observability/metrics';

export function register() {
  // no-op required by Next.js instrumentation API
}

export async function onCLS(metric: { name: string; value: number; label: string }) {
  await reportWebVital({ metric: metric.name, value: metric.value, label: metric.label });
}

export async function onFCP(metric: { name: string; value: number; label: string }) {
  await reportWebVital({ metric: metric.name, value: metric.value, label: metric.label });
}

export async function onFID(metric: { name: string; value: number; label: string }) {
  await reportWebVital({ metric: metric.name, value: metric.value, label: metric.label });
}

export async function onLCP(metric: { name: string; value: number; label: string }) {
  await reportWebVital({ metric: metric.name, value: metric.value, label: metric.label });
}

export async function onTTFB(metric: { name: string; value: number; label: string }) {
  await reportWebVital({ metric: metric.name, value: metric.value, label: metric.label });
}
