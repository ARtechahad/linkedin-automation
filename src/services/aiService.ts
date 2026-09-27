import { AISettings, AIGenerationOptions, AIGenerationResult, AIProviderType } from '../types';

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'local',
  localEndpoint: 'http://localhost:11434',
  localModel: 'llama3.2',
  cloudService: 'gemini',
  cloudApiKey: '',
  cloudModel: 'gemini-3.8-flash',
  temperature: 0.7,
  fallbackToManual: true,
  lastConnectionStatus: 'untested',
  statusMessage: 'Local Ollama & Hybrid AI Ready'
};

const STORAGE_KEY = 'clientops_ai_settings_v1';

export function getSavedAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AI_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save AI settings:', err);
  }
}

// Deterministic Offline & Rule-Based SOP Engine
export function generateOfflineFallback(options: AIGenerationOptions): AIGenerationResult {
  const cName = options.clientName || 'Client';
  const comp = options.companyName || 'your company';
  const wType = (options.websiteType || 'landing').toLowerCase();
  const channel = options.channel || 'linkedin';

  if (options.taskType === 'sentiment') {
    const text = (options.messageContent || '').toLowerCase();
    let sentiment: 'positive' | 'hesitant' | 'urgent_pricing' | 'revision_request' | 'dissatisfied' | 'neutral' = 'neutral';
    let sentimentScore = 75;
    let intent = 'General Scope & Project Inquiries';
    let rule = 'SOP Rule 1: Professional Discovery';

    if (text.includes('price') || text.includes('cost') || text.includes('quote') || text.includes('budget') || text.includes('how much') || text.includes('discount')) {
      sentiment = 'urgent_pricing';
      sentimentScore = 88;
      intent = 'Pricing Negotiation & Milestone Budget Assessment';
      rule = 'SOP Rule 5: 50% Advance Milestone Protocol';
    } else if (text.includes('hesitant') || text.includes('wondering') || text.includes('concern') || text.includes('worried') || text.includes('gdpr') || text.includes('privacy')) {
      sentiment = 'hesitant';
      sentimentScore = 65;
      intent = 'Security, Trust & Privacy Guarantee Confirmation';
      rule = 'SOP Rule 2 & GDPR International Compliance';
    } else if (text.includes('change') || text.includes('revise') || text.includes('tweak') || text.includes('bug') || text.includes('not working')) {
      sentiment = 'revision_request';
      sentimentScore = 60;
      intent = 'Staging Prototype Refinement & Styling Adjustments';
      rule = 'SOP Rule 8: Dedicated Staging Revisions';
    } else if (text.includes('great') || text.includes('love') || text.includes('perfect') || text.includes('approved') || text.includes('ready')) {
      sentiment = 'positive';
      sentimentScore = 95;
      intent = 'Sprint Approval & Advance Payment Commitment';
      rule = 'SOP Rule 7: Discord Briefing & Team Handoff';
    }

    const fallbackBody = `Hello ${cName},\n\nThank you for reaching out to our team. Regarding your inquiry on ${options.subject || 'our web development services'}:\n\nOur standardized development workflow takes place strictly on our private staging environment. This gives you live interactive visibility to inspect and test all responsive views, forms, and performance metrics before any changes reach your public domain.\n\nTo lock in our dedicated full-stack engineering team for your sprint, we initiate projects with our standard 50% advance deposit. Once approved on staging, the remaining 50% clears prior to DNS migration.\n\nPlease let me know if you would like me to generate your official milestone invoice.\n\nWarm regards,\nSales & Project Coordination Desk`;

    return {
      success: true,
      text: fallbackBody,
      providerUsed: 'manual',
      modelUsed: 'sop-offline-rules',
      isFallback: false,
      sentiment,
      sentimentScore,
      detectedIntent: intent,
      suggestedSubject: `Re: ${options.subject || 'Website Development Scope'}`,
      ruleApplied: rule
    };
  }

  if (options.taskType === 'outreach') {
    const need = options.problemOrNeed || 'modernizing and scaling your online web presence';
    const cleanSnippet = `Hi ${cName}, saw your post on ${need} for ${comp}. At ClientOps we build fast, high-converting ${wType} sites with a 48h private staging preview. Would love to connect and share a few live examples!`.slice(0, 285);

    let intro = '';
    if (channel === 'upwork_proposal') {
      intro = `Dear ${cName},\n\nI reviewed your project specifications regarding ${need} for ${comp}, and our team would be thrilled to execute this for you.\n\nHere is how our standardized international SOP delivery framework guarantees your success:\n1. Private Staging Environment: We construct your ${wType} on dedicated internal servers so you can review mobile responsiveness, typography, and speed on live devices before final deployment.\n2. Milestone Security: Structured under standard 50% upfront to reserve sprint dates and 50% only upon complete staging sign-off.\n3. Complete Deliverable QA: Full cross-browser checks, SSL setup, and speed optimization included.\n\nI would welcome a brief 5-minute chat to discuss your preferred aesthetic and target delivery date.\n\nBest regards,\nLead Technical Account Partner`;
    } else {
      intro = `Hello ${cName},\n\nThank you for connecting! I noticed ${comp} is looking to enhance its digital footprint with a modern ${wType}.\n\nOur agency specializes in high-converting web architecture for international clients. Our development process includes dedicated private staging links, a clear 50/50 payment milestone structure, and turnaround prototypes within 5-7 business days.\n\nWould you be open to a quick review of your requirements so we can prepare a complimentary scope breakdown?\n\nBest regards,\nClientOps Engineering`;
    }

    const nudge = `Hi ${cName}, just following up on our previous note. We have a private staging slot available this week if you would like a quick interactive preview of the ${wType} structure for ${comp}!`;

    return {
      success: true,
      text: intro,
      providerUsed: 'manual',
      modelUsed: 'sop-offline-rules',
      isFallback: false,
      connectionRequestSnippet: cleanSnippet,
      followUpNudge: nudge,
      suggestedSubject: `Collaborating on ${comp}'s ${wType} launch`
    };
  }

  // Task: proposal / general
  const price = wType === 'landing' ? '$250 - $300' : wType === 'ecommerce' ? '$500 - $700' : '$800 - $1,200';
  const proposalBody = `Dear ${cName},

Thank you for your inquiry regarding ${comp}'s new ${wType} project.

Based on our standardized agency operating procedures, here is our recommended scope breakdown:

1. Project Investment & Timeline
• Estimated Range: ${price} USD
• Development Timeline: ${wType === 'landing' ? '5 - 7 business days' : '10 - 14 business days'}
• Dedicated Internal Staging Server: Inspect live responsive views on phone, tablet, and desktop before launch.

2. Comprehensive Package Inclusions
• Custom responsive design crafted for international conversion rates
• Royalty-free licensed photography & copywriting optimization
• Fast server hosting guidance (Hostinger / Namecheap / Cloudflare)
• Complete cross-browser QA and Lighthouse 95+ performance check

3. Standard Payment Milestones (SOP Rule 5 & 8)
• 50% Advance Milestone to lock in engineering sprint schedule
• 50% Final Balance upon complete staging sign-off prior to live DNS transfer

Please let me know if you would like us to reserve your sprint slot!

Best regards,
Lead Sales & Project Coordinator`;

  return {
    success: true,
    text: proposalBody,
    providerUsed: 'manual',
    modelUsed: 'sop-offline-rules',
    isFallback: false,
    suggestedSubject: `Web Development Proposal for ${comp} (${wType.toUpperCase()})`,
    ruleApplied: 'SOP Rule 1, 4 & 5: Standard Pricing & Milestone Protocol'
  };
}

// Test Local Ollama Connection
export async function testLocalOllama(endpoint: string, model: string): Promise<{ ok: boolean; latencyMs: number; models: string[]; message: string }> {
  const start = performance.now();
  const cleanEndpoint = endpoint.trim().replace(/\/+$/, '');

  // 1. Try server proxy test first (bypasses browser mixed content / CORS issues)
  try {
    const serverRes = await fetch('/api/ai/test-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: cleanEndpoint, model })
    });
    if (serverRes.ok) {
      const data = await serverRes.json();
      const latencyMs = Math.round(performance.now() - start);
      if (data.ok) {
        return {
          ok: true,
          latencyMs,
          models: data.models || [model],
          message: `Connected successfully via proxy (${latencyMs}ms). Model "${model}" verified.`
        };
      }
    }
  } catch {
    // Continue to direct browser fetch
  }

  // 2. Direct client fetch to Ollama API
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${cleanEndpoint}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      const modelNames = (data.models || []).map((m: any) => m.name || m.model);
      const hasModel = modelNames.some((m: string) => m.toLowerCase().includes(model.toLowerCase()));

      return {
        ok: true,
        latencyMs,
        models: modelNames,
        message: hasModel
          ? `Connected to Ollama! Model "${model}" found in local library (${latencyMs}ms).`
          : `Connected to Ollama (${latencyMs}ms), but model "${model}" not yet pulled. Run: \`ollama run ${model}\``
      };
    }
    return {
      ok: false,
      latencyMs,
      models: [],
      message: `Ollama returned HTTP ${res.status}: ${res.statusText}`
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      ok: false,
      latencyMs,
      models: [],
      message: `Cannot reach Ollama at ${cleanEndpoint}: ${err.name === 'AbortError' ? 'Connection timed out' : err.message}. (Ensure Ollama is running and OLLAMA_ORIGINS="*" is set).`
    };
  }
}

// Test Cloud Provider
export async function testCloudProvider(service: string, apiKey: string, model: string): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const start = performance.now();
  try {
    const res = await fetch('/api/ai/test-cloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, apiKey, model })
    });
    const data = await res.json();
    const latencyMs = Math.round(performance.now() - start);
    return {
      ok: data.ok,
      latencyMs,
      message: data.message || (data.ok ? 'Cloud API credentials verified successfully.' : 'Verification failed.')
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      ok: false,
      latencyMs,
      message: `Verification network error: ${err.message}`
    };
  }
}

// Primary Hybrid Generation Dispatcher
export async function generateAI(
  options: AIGenerationOptions,
  customSettings?: AISettings
): Promise<AIGenerationResult> {
  const settings = customSettings || getSavedAISettings();

  // Mode 1: Manual / Offline Mode
  if (settings.provider === 'manual') {
    return generateOfflineFallback(options);
  }

  // Mode 2: Local AI (Ollama / Local Endpoint)
  if (settings.provider === 'local') {
    try {
      const endpoint = settings.localEndpoint.trim().replace(/\/+$/, '');
      const model = settings.localModel.trim() || 'llama3.2';

      // Build unified prompt
      const systemPrompt = `You are the Lead Sales & Operations Director for an elite Web Development Agency following strict SOP guidelines:
1. Standardized pricing: $200-$300 Landing, $500-$700 E-commerce, $800+ Corporate.
2. 50% advance milestone to lock sprint date; 50% balance upon staging approval before live domain cutover.
3. Dedicated private staging inspection on real devices with zero downtime.
4. Output professional, polished, high-status text. Avoid robotic clichés.`;

      const userText = options.prompt || (options.taskType === 'sentiment'
        ? `Analyze this incoming message from ${options.clientName || 'Client'}: "${options.messageContent}" for sentiment, score (0-100), intent, and write an SOP reply.`
        : options.taskType === 'outreach'
        ? `Write a high-converting outreach message for prospect ${options.clientName} at ${options.companyName} for a ${options.websiteType} website. Need: ${options.problemOrNeed}`
        : `Write an SOP-compliant ${options.mode || 'proposal'} for client ${options.clientName} regarding a ${options.websiteType} website. Notes: ${options.additionalNotes || 'Standard build'}`);

      // First attempt: Call via backend proxy (handles CORS and server-side Ollama routing)
      try {
        const proxyRes = await fetch('/api/ai/universal-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'local',
            endpoint,
            model,
            temperature: settings.temperature,
            options
          })
        });

        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (data.success && data.text) {
            return {
              success: true,
              text: data.text,
              providerUsed: 'local',
              modelUsed: `ollama/${model}`,
              isFallback: false,
              sentiment: data.sentiment,
              sentimentScore: data.sentimentScore,
              detectedIntent: data.detectedIntent,
              suggestedSubject: data.suggestedSubject,
              ruleApplied: data.ruleApplied || 'SOP Rules via Local Ollama',
              connectionRequestSnippet: data.connectionRequestSnippet,
              followUpNudge: data.followUpNudge
            };
          }
        }
      } catch (proxyErr) {
        console.warn('Proxy local call error, testing direct local fetch:', proxyErr);
      }

      // Second attempt: Direct client fetch to local Ollama /api/generate
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const localRes = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          prompt: `${systemPrompt}\n\nTask:\n${userText}`,
          stream: false,
          options: {
            temperature: settings.temperature || 0.7
          }
        })
      });
      clearTimeout(timer);

      if (localRes.ok) {
        const data = await localRes.json();
        const text = (data.response || '').trim();
        if (text) {
          return {
            success: true,
            text,
            providerUsed: 'local',
            modelUsed: `ollama/${model}`,
            isFallback: false,
            ruleApplied: 'Generated by Local Ollama'
          };
        }
      }
    } catch (localErr: any) {
      console.warn('Local Ollama failed, evaluating fallback:', localErr);
      if (settings.fallbackToManual) {
        const fallback = generateOfflineFallback(options);
        fallback.isFallback = true;
        fallback.fallbackReason = `Local AI (${settings.localModel} at ${settings.localEndpoint}) was unreachable. Auto-switched to Offline SOP Rules.`;
        return fallback;
      }
      throw new Error(`Cannot reach Local AI: ${localErr.message}`);
    }
  }

  // Mode 3: Cloud AI (Gemini / Groq / OpenRouter)
  try {
    const res = await fetch('/api/ai/universal-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'cloud',
        cloudService: settings.cloudService,
        cloudApiKey: settings.cloudApiKey,
        cloudModel: settings.cloudModel,
        temperature: settings.temperature,
        options
      })
    });

    const data = await res.json();
    if (data.success && data.text) {
      return {
        success: true,
        text: data.text,
        providerUsed: 'cloud',
        modelUsed: data.modelUsed || settings.cloudModel || 'gemini-3.8-flash',
        isFallback: false,
        sentiment: data.sentiment,
        sentimentScore: data.sentimentScore,
        detectedIntent: data.detectedIntent,
        suggestedSubject: data.suggestedSubject,
        ruleApplied: data.ruleApplied,
        connectionRequestSnippet: data.connectionRequestSnippet,
        followUpNudge: data.followUpNudge
      };
    }
    throw new Error(data.message || 'Cloud generation failed');
  } catch (cloudErr: any) {
    console.warn('Cloud AI failed, evaluating fallback:', cloudErr);
    if (settings.fallbackToManual) {
      const fallback = generateOfflineFallback(options);
      fallback.isFallback = true;
      fallback.fallbackReason = `Cloud AI error (${cloudErr.message}). Auto-switched to Offline SOP Rules.`;
      return fallback;
    }
    throw cloudErr;
  }
}
