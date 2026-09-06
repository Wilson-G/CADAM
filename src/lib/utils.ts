import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Parameter } from '@shared/types';
import { ModelConfig } from '../types/misc.ts';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates and sanitizes a redirect URL to prevent open redirect attacks
 * Only allows relative paths or same-origin URLs
 * @param redirectUrl - The URL to validate
 * @param fallback - Fallback URL if validation fails (default: '/')
 * @returns A safe redirect URL
 */
export function validateRedirectUrl(
  redirectUrl: string | null,
  fallback: string = '/',
): string {
  // If no redirect URL provided, return fallback
  if (!redirectUrl) {
    return fallback;
  }

  try {
    // Decode the URL in case it was encoded
    const decodedUrl = decodeURIComponent(redirectUrl);

    // Check if it's a relative path (starts with /)
    if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
      // Additional check to prevent protocol-relative URLs (//example.com)
      // Remove any query parameters that could contain malicious data
      const url = new URL(decodedUrl, window.location.origin);

      // Ensure it's still on the same origin after URL parsing
      if (url.origin === window.location.origin) {
        return url.pathname + url.search + url.hash;
      }
    }

    // Check if it's a same-origin absolute URL
    const url = new URL(decodedUrl);
    if (url.origin === window.location.origin) {
      return url.pathname + url.search + url.hash;
    }

    // If we get here, it's an external URL or invalid - return fallback
    console.warn('Rejected redirect URL (external or invalid):', redirectUrl);
    return fallback;
  } catch (error) {
    // Invalid URL format - return fallback
    console.warn('Invalid redirect URL format:', redirectUrl, error);
    return fallback;
  }
}

/**
 * Server-side version of validateRedirectUrl for use in server components and API routes
 * @param redirectUrl - The URL to validate
 * @param requestOrigin - The origin from the request headers
 * @param fallback - Fallback URL if validation fails (default: '/')
 * @returns A safe redirect URL
 */
export function validateRedirectUrlServer(
  redirectUrl: string | null,
  requestOrigin: string | null,
  fallback: string = '/',
): string {
  // If no redirect URL or origin provided, return fallback
  if (!redirectUrl || !requestOrigin) {
    return fallback;
  }

  try {
    // Decode the URL in case it was encoded
    const decodedUrl = decodeURIComponent(redirectUrl);

    // Check if it's a relative path (starts with /)
    if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
      // Additional check to prevent protocol-relative URLs (//example.com)
      // Remove any query parameters that could contain malicious data
      const url = new URL(decodedUrl, requestOrigin);

      // Ensure it's still on the same origin after URL parsing
      if (url.origin === requestOrigin) {
        return url.pathname + url.search + url.hash;
      }
    }

    // Check if it's a same-origin absolute URL
    const url = new URL(decodedUrl);
    if (url.origin === requestOrigin) {
      return url.pathname + url.search + url.hash;
    }

    // If we get here, it's an external URL or invalid - return fallback
    console.warn('Rejected redirect URL (external or invalid):', redirectUrl);
    return fallback;
  } catch (error) {
    // Invalid URL format - return fallback
    console.warn('Invalid redirect URL format:', redirectUrl, error);
    return fallback;
  }
}

export function updateParameter(code: string, param: Parameter): string {
  const escapedName = escapeRegExp(param.name);
  const regex = new RegExp(
    `^\\s*(${escapedName}\\s*=\\s*)[^;]+;([\\t\\f\\cK ]*\\/\\/[^\n]*)?`,
    'm',
  );
  // Default to assuming the type is number
  if (!param.type) {
    return code.replace(regex, `$1${param.value};$2`);
  }
  switch (param.type) {
    case 'string':
      return code.replace(
        regex,
        `$1"${escapeReplacement(escapeQuotes(param.value as string))}";$2`,
      );
    case 'number':
      return code.replace(regex, `$1${param.value};$2`);
    case 'boolean':
      return code.replace(regex, `$1${param.value};$2`);
    case 'string[]':
      return code.replace(
        regex,
        `$1[${(param.value as string[])
          .map((value) => escapeReplacement(escapeQuotes(value)))
          .map((value) => `"${value}"`)
          .join(',')}];$2`,
      );
    case 'number[]':
      return code.replace(
        regex,
        `$1[${(param.value as number[]).join(',')}];$2`,
      );
    case 'boolean[]':
      return code.replace(
        regex,
        `$1[${(param.value as boolean[]).join(',')}];$2`,
      );
    default:
      return code;
  }
}

export function getDiffString(param: Parameter) {
  let diffString: string = '';
  let diffNumber: number = 0;
  // Default to assuming the type is number
  if (!param.type) {
    diffNumber =
      Math.round((Number(param.value) - Number(param.defaultValue)) * 10) / 10;
    diffString = diffNumber > 0 ? `+${diffNumber}` : `${diffNumber}`;
    return diffString;
  }
  switch (param.type) {
    case 'number':
      diffNumber =
        Math.round((Number(param.value) - Number(param.defaultValue)) * 10) /
        10;
      diffString = diffNumber > 0 ? `+${diffNumber}` : `${diffNumber}`;
      break;
    case 'boolean':
      diffString = param.value ? 'true' : 'false';
      break;
    case 'string':
      diffString = param.value as string;
      break;
    case 'string[]':
      diffString = (param.value as string[])
        .map((value, index) => {
          if (value !== (param.defaultValue as string[])[index]) {
            return value;
          }
        })
        .filter((value) => value !== undefined)
        .join('\n');
      break;
    case 'number[]':
      diffString = (param.value as number[])
        .map((value, index) => {
          const diffNumber =
            Math.round(
              (Number(value) -
                Number((param.defaultValue as number[])[index])) *
                10,
            ) / 10;
          if (diffNumber !== 0) {
            return diffNumber > 0 ? `+${diffNumber}` : `${diffNumber}`;
          }
        })
        .filter((value) => value !== undefined)
        .join('\n');
      break;
    case 'boolean[]':
      diffString = (param.value as boolean[])
        .map((value, index) => {
          if (value !== (param.defaultValue as boolean[])[index]) {
            return value ? 'true' : 'false';
          }
        })
        .filter((value) => value !== undefined)
        .join('\n');
      break;
    default:
      diffString = '';
  }
  return diffString;
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function escapeReplacement(string: string) {
  return string.replace(/\$/g, '$$$$');
}

export function escapeQuotes(string: string) {
  return string.replace(/"/g, '\\"');
}

export function getInitials(fullName: string | null) {
  if (fullName) {
    return fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
  }
  return 'U';
}

export const PARAMETRIC_MODELS: ModelConfig[] = [
  {
    id: 'anthropic/glm-5.3-flash',
    name: 'GLM 5.3 Flash (local gateway)',
    description: '智谱 GLM 5.3 Flash,本地网关,内部默认',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: false,
  },
  {
    id: 'anthropic/glm-5.3',
    name: 'GLM 5.3 (local gateway)',
    description: '智谱 GLM 5.3 旗舰,本地网关',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: false,
  },
  {
    id: 'anthropic/gpt-6-astra',
    name: 'GPT-6 Astra (local gateway)',
    description: 'OpenAI GPT-6 Astra via the local gateway; SOTA CAD reasoning',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'anthropic/gpt-5.6-sol',
    name: 'GPT-5.6 Sol (local gateway)',
    description: 'OpenAI GPT-5.6 Sol via the local gateway',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'anthropic/gpt-5.6-terra',
    name: 'GPT-5.6 Terra (local gateway)',
    description: 'OpenAI GPT-5.6 Terra via the local gateway',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'anthropic/gpt-5.6-luna',
    name: 'GPT-5.6 Luna (local gateway)',
    description: 'OpenAI GPT-5.6 Luna via the local gateway',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'anthropic/deepseek-v4-flash',
    name: 'DeepSeek V4 Flash (local gateway)',
    description:
      'DeepSeek V4 Flash via the local gateway; untested over the Anthropic protocol',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: false,
  },
  {
    id: 'google/gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    description: '谷歌最新模型,多模态能力强',
    provider: 'Google',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'google/gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: '谷歌快速模型,日常任务省额度',
    provider: 'Google',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'anthropic/claude-fable-5.1',
    name: 'Claude Fable 5.1',
    description: 'Anthropic 最强模型,推理最好,成本最高',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'anthropic/claude-opus-4.8',
    name: 'Claude Opus 4.8',
    description: 'Anthropic 强推理模型,适合复杂任务',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    description: 'Anthropic 均衡款,速度与推理兼顾',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'openai/gpt-5.6-sol',
    name: 'GPT-5.6 Sol',
    description: 'OpenAI 最新模型,CAD 生成稳定',
    provider: 'OpenAI',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'x-ai/grok-4.6',
    name: 'Grok 4.6',
    description: 'xAI 最新模型,代码与 STEM 表现强',
    provider: 'xAI',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'moonshotai/kimi-k3',
    name: 'Kimi K3',
    description: '月之暗面推理模型,擅长复杂编码与智能体任务',
    provider: 'Moonshot AI',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'deepseek/deepseek-v4-pro-0813',
    name: 'DeepSeek V4 Pro',
    description:
      'DeepSeek mixture-of-experts model with a 1M-token context at low cost',
    provider: 'DeepSeek',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: false,
  },
  {
    id: 'z-ai/glm-5.3',
    name: 'GLM 5.3',
    description: '智谱 GLM 5.3,智能体编码能力强',
    provider: 'Z.AI',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: false,
  },
  {
    id: 'z-ai/glm-5.3-flash',
    name: 'GLM 5.3 Flash',
    description: '智谱 GLM 5.3 Flash,快速低价多模态',
    provider: 'Z.AI',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
];

export const CREATIVE_MODELS: ModelConfig[] = [
  {
    id: 'ultra',
    name: 'Max Quality',
    description: '最高质量网格,拓扑干净',
    timeEstimate: '5-6 minutes',
  },
  {
    id: 'quality',
    name: 'Draft',
    description: '粗模,适合快速迭代',
    timeEstimate: '~45 seconds',
  },
  {
    id: 'fast',
    name: 'Textureless',
    description: '更快,输出简单无贴图。',
    timeEstimate: '60-90 seconds',
  },
];

// Whether the selected parametric model can accept image / STL-render inputs.
// Unknown ids (e.g. historical messages tagged with a removed model) fall back
// to `true` so older saved rows still render normally.
export function parametricModelSupportsVision(modelId: string): boolean {
  const cfg = PARAMETRIC_MODELS.find((m) => m.id === modelId);
  return cfg?.supportsVision !== false;
}
