import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { readDB, writeDB } from '../db';

export const aiRouter = Router();
export const inboxRouter = Router();

// Lazy Gemini AI initialization
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Gemini initialization skipped or failed:', e);
    }
  }
  return aiClient;
}

// 1. AI Sales & Coordination Assistant (Gemini 3.8 Flash)
aiRouter.post('/generate', async (req: Request, res: Response) => {
  const { prompt, mode, clientName, websiteType, channel } = req.body;
  const ai = getGemini();

  const systemInstructions = `You are the Lead Sales & Operations Director for a world-class Web Development agency handling international clients (US, UK, Europe, Australia, etc.).
You adhere strictly to our 11-step SOP:
1. Initial Client Interaction: Polite, prompt, professional tone. Ask for website type, inspiration links, and business purpose.
2. Content & Design: Logos, copy, images, offering licensed stock photos & copywriting if needed.
3. Domain & Hosting: Recommend Hostinger, Namecheap, Bluehost, or ask for credentials.
4. Pricing Guidelines:
   - Landing Page / One-Page: $200 - $300
   - E-commerce: $500 - $700
   - Corporate / Large (8-9 pages): $800 and above
5. Payment Terms: 50% advance to initiate, 50% balance upon staging approval before live transfer. Accepted: PayPal, Payoneer.
6. Communication Standards: Clear, courteous, grammatically flawless English. Avoid unnecessary technical jargon.
Always generate output tailored to the user's prompt without fluff.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${systemInstructions}\n\nTask Mode: ${mode || 'custom_pitch'}\nClient Name: ${clientName || 'Client'}\nWebsite Type: ${websiteType || 'General'}\nChannel: ${channel || 'Upwork/LinkedIn'}\nUser Prompt: ${prompt}`
      });

      const text = response.text || '';
      return res.json({ success: true, text, model: 'gemini-3.8-flash' });
    } catch (err: any) {
      console.warn('Gemini API call error, falling back to smart SOP generator:', err.message);
    }
  }

  // Fallback high-quality SOP templates if GEMINI_API_KEY is not configured yet
  let fallbackText = '';
  const cName = clientName || 'Client';

  if (mode === 'inquiry_response') {
    fallbackText = `Hello ${cName},\n\nThank you for contacting us regarding your web development project. I would be thrilled to assist in bringing your vision to life.\n\nTo ensure we propose the most tailored and cost-effective solution for your business, could you please share a few quick details:\n1. What type of website are you looking for? (e.g., One-page Landing Page, E-commerce with payment processing, or Multi-page Corporate site)\n2. Do you have any inspiration websites or design references that match your preferred aesthetic?\n3. What is the primary purpose of your site? (e.g., brand awareness, lead capture, or online sales)\n\nLooking forward to hearing your thoughts so we can review the scope and provide a comprehensive proposal.\n\nBest regards,\nWeb Development Sales & Coordination Team`;
  } else if (mode === 'pricing_proposal') {
    fallbackText = `Dear ${cName},\n\nThank you for sharing your requirements. Based on our standardized pricing guidelines and scope assessment:\n\nProject Scope: ${websiteType || 'Custom Web Development'}\nEstimated Investment: $${websiteType === 'landing' ? '250' : websiteType === 'ecommerce' ? '650' : '950'} USD\n\nOur Comprehensive Delivery Package Includes:\n• Bespoke, mobile-responsive design tailored to your branding\n• High-resolution licensed stock photography & copywriting assistance if needed\n• Development on our secure internal staging environment for your testing and revision\n• Domain and hosting configuration (Hostinger / Namecheap setup guidance)\n• Full Quality Assurance & cross-browser testing\n\nPayment Milestones:\n• 50% upfront payment to officially initiate the project and secure sprint dates\n• 50% balance payment upon final staging approval before domain transfer\nAccepted Methods: PayPal or Payoneer.\n\nPlease let us know if you would like to proceed with the milestone confirmation!`;
  } else if (mode === 'domain_guide') {
    fallbackText = `Hello ${cName},\n\nRegarding your website infrastructure:\nIf you have not yet purchased your domain or hosting, we recommend trusted, cost-effective providers such as Hostinger or Namecheap. Both provide outstanding uptime, free SSL certificates, and intuitive control panels.\n\nOnce you have secured your preferred domain name and hosting plan, simply share the access details with our team through our secure credentials channel, and we will handle all technical DNS and server configurations for you.\n\nFeel free to ask if you need a step-by-step walkthrough!`;
  } else {
    fallbackText = `Thank you for confirming the project specifications, ${cName}. Our engineering team will now proceed with the initial design and staging phase. We will keep you updated every 48 hours throughout development. Please feel free to share any feedback at any stage.`;
  }

  res.json({
    success: true,
    text: fallbackText,
    result: fallbackText,
    model: 'sop-rules-engine'
  });
});

// 2. Hybrid AI Architecture: Test Local & Cloud Endpoints
aiRouter.post('/test-local', async (req: Request, res: Response) => {
  const { endpoint, model } = req.body;
  const targetUrl = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const ping = await fetch(`${targetUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (ping.ok) {
      const data: any = await ping.json();
      const models = (data.models || []).map((m: any) => m.name || m.model);
      return res.json({ ok: true, models, message: `Ollama responding on ${targetUrl}. Available: ${models.slice(0, 5).join(', ')}` });
    }
    return res.json({ ok: false, message: `Ollama replied with status ${ping.status}` });
  } catch (err: any) {
    return res.json({ ok: false, message: `Local endpoint unreachable at ${targetUrl}: ${err.message}` });
  }
});

aiRouter.post('/test-cloud', async (req: Request, res: Response) => {
  const { service, apiKey, model } = req.body;
  if (service === 'gemini') {
    const ai = apiKey ? new GoogleGenAI({ apiKey }) : getGemini();
    if (!ai) {
      return res.json({ ok: false, message: 'No Gemini API key provided in settings or server environment.' });
    }
    try {
      await ai.models.generateContent({
        model: model || 'gemini-3.8-flash',
        contents: 'Ping test. Reply with: OK'
      });
      return res.json({ ok: true, message: `Gemini API key is active and responding.` });
    } catch (err: any) {
      return res.json({ ok: false, message: `Gemini verification failed: ${err.message}` });
    }
  } else if (service === 'groq') {
    if (!apiKey) return res.json({ ok: false, message: 'Groq API Key is required.' });
    try {
      const groqResp = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (groqResp.ok) return res.json({ ok: true, message: 'Groq API key verified successfully.' });
      return res.json({ ok: false, message: `Groq rejected key (HTTP ${groqResp.status})` });
    } catch (err: any) {
      return res.json({ ok: false, message: `Groq error: ${err.message}` });
    }
  } else if (service === 'openrouter') {
    if (!apiKey) return res.json({ ok: false, message: 'OpenRouter API Key is required.' });
    try {
      const orResp = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (orResp.ok) return res.json({ ok: true, message: 'OpenRouter key verified successfully.' });
      return res.json({ ok: false, message: `OpenRouter rejected key (HTTP ${orResp.status})` });
    } catch (err: any) {
      return res.json({ ok: false, message: `OpenRouter error: ${err.message}` });
    }
  }
  return res.json({ ok: false, message: 'Unknown cloud service' });
});

// 3. Centralized Universal AI Dispatcher with Zero-Downtime Fallback
aiRouter.post('/universal-generate', async (req: Request, res: Response) => {
  const { provider, endpoint, model, cloudService, cloudApiKey, cloudModel, temperature, options } = req.body;
  const opt = options || {};

  const systemInstructions = `You are the Lead Sales & Operations Director for an elite Web Development agency adhering to strict SOP communication rules:
1. Standardized pricing: $200-$300 Landing Page, $500-$700 E-commerce, $800+ Corporate Multi-page.
2. 50% advance payment required to initiate the project and lock their sprint slot.
3. 50% balance cleared only upon staging review sign-off before live domain transfer.
4. Professional, consultative tone free of desperation or robotic clichés.
5. In LinkedIn connection requests, strictly stay under 290 characters.`;

  const userPrompt = opt.prompt || (opt.taskType === 'sentiment'
    ? `Analyze incoming message from ${opt.clientName || 'Client'}: "${opt.messageContent}". Provide JSON: { "sentiment": string, "sentimentScore": number, "detectedIntent": string, "suggestedSubject": string, "suggestedBody": string, "ruleApplied": string }`
    : opt.taskType === 'outreach'
    ? `Draft outreach for prospect ${opt.clientName} at ${opt.companyName} for a ${opt.websiteType} website. Need: ${opt.problemOrNeed}. Provide JSON: { "connectionRequestSnippet": string, "introductoryMessage": string, "followUpNudge": string, "recommendedSubject": string }`
    : `Draft an SOP-compliant ${opt.mode || 'proposal'} for client ${opt.clientName} regarding a ${opt.websiteType} website. Additional notes: ${opt.additionalNotes || 'Standard project'}`);

  // Provider 1: Local Ollama
  if (provider === 'local') {
    const targetUrl = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
    const targetModel = model || 'llama3.2';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const ollamaResp = await fetch(`${targetUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: targetModel,
          prompt: `${systemInstructions}\n\nTask:\n${userPrompt}`,
          stream: false,
          options: { temperature: temperature || 0.7 }
        })
      });
      clearTimeout(timeout);
      if (ollamaResp.ok) {
        const data: any = await ollamaResp.json();
        const text = (data.response || '').trim();
        return res.json({
          success: true,
          text,
          result: text,
          providerUsed: 'local',
          modelUsed: `ollama/${targetModel}`
        });
      }
    } catch (err: any) {
      console.warn(`Local Ollama fetch error at ${targetUrl}:`, err.message);
    }
  }

  // Provider 2: Cloud AI
  if (provider === 'cloud') {
    if (cloudService === 'gemini' || !cloudService) {
      const ai = cloudApiKey ? new GoogleGenAI({ apiKey: cloudApiKey }) : getGemini();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: cloudModel || 'gemini-3.8-flash',
            contents: `${systemInstructions}\n\nTask:\n${userPrompt}`
          });
          const text = response.text || '';
          
          // If JSON was requested (e.g. sentiment or outreach), attempt parse
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              return res.json({
                success: true,
                text: parsed.suggestedBody || parsed.introductoryMessage || text,
                result: parsed.suggestedBody || parsed.introductoryMessage || text,
                providerUsed: 'cloud',
                modelUsed: cloudModel || 'gemini-3.8-flash',
                sentiment: parsed.sentiment,
                sentimentScore: parsed.sentimentScore,
                detectedIntent: parsed.detectedIntent,
                suggestedSubject: parsed.suggestedSubject || parsed.recommendedSubject,
                ruleApplied: parsed.ruleApplied,
                connectionRequestSnippet: parsed.connectionRequestSnippet,
                followUpNudge: parsed.followUpNudge
              });
            } catch {
              // fallback to raw text
            }
          }

          return res.json({
            success: true,
            text,
            result: text,
            providerUsed: 'cloud',
            modelUsed: cloudModel || 'gemini-3.8-flash'
          });
        } catch (err: any) {
          console.warn('Gemini cloud call failed:', err.message);
        }
      }
    } else if (cloudService === 'groq' && cloudApiKey) {
      try {
        const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cloudApiKey}`
          },
          body: JSON.stringify({
            model: cloudModel || 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemInstructions },
              { role: 'user', content: userPrompt }
            ],
            temperature: temperature || 0.7
          })
        });
        if (groqResp.ok) {
          const data: any = await groqResp.json();
          const text = data.choices?.[0]?.message?.content || '';
          return res.json({
            success: true,
            text,
            result: text,
            providerUsed: 'cloud',
            modelUsed: `groq/${cloudModel || 'llama-3.3-70b'}`
          });
        }
      } catch (err: any) {
        console.warn('Groq cloud call failed:', err.message);
      }
    } else if (cloudService === 'openrouter' && cloudApiKey) {
      try {
        const orResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cloudApiKey}`
          },
          body: JSON.stringify({
            model: cloudModel || 'anthropic/claude-3.5-sonnet',
            messages: [
              { role: 'system', content: systemInstructions },
              { role: 'user', content: userPrompt }
            ]
          })
        });
        if (orResp.ok) {
          const data: any = await orResp.json();
          const text = data.choices?.[0]?.message?.content || '';
          return res.json({
            success: true,
            text,
            result: text,
            providerUsed: 'cloud',
            modelUsed: `openrouter/${cloudModel || 'custom'}`
          });
        }
      } catch (err: any) {
        console.warn('OpenRouter cloud call failed:', err.message);
      }
    }
  }

  // Graceful Fallback: Deterministic SOP Rule Engine
  const cName = opt.clientName || 'Client';
  const comp = opt.companyName || 'your business';
  const wType = (opt.websiteType || 'landing').toLowerCase();
  const price = wType === 'landing' ? '$250 - $300' : wType === 'ecommerce' ? '$500 - $700' : '$800 - $1,200';

  const fallbackText = `Dear ${cName},\n\nThank you for your inquiry regarding ${comp}'s web development project.\n\nBased on our standardized agency operating procedures (SOP), here is our recommended scope breakdown:\n\n1. Investment & Delivery Timeline:\n• Scope: ${opt.websiteType || 'Custom Web Development'} (${price} USD)\n• Development Schedule: ${wType === 'landing' ? '5 - 7 business days' : '10 - 14 business days'}\n• Dedicated Private Staging: Inspect responsive views on live devices prior to launch.\n\n2. Deliverable Inclusions:\n• Custom responsive architecture tailored to international conversion benchmarks\n• Licensed stock imagery & copywriting assistance included\n• Hostinger / Namecheap / Cloudflare DNS & SSL deployment\n• 100% Quality Assurance & cross-browser audit\n\n3. SOP Milestone Protocol:\n• 50% Advance Milestone to lock in engineering sprint schedule\n• 50% Final Balance upon staging sign-off prior to live domain cutover\n\nBest regards,\nLead Sales & Project Coordinator`;

  return res.json({
    success: true,
    text: fallbackText,
    result: fallbackText,
    providerUsed: 'manual',
    modelUsed: 'sop-offline-rules-engine',
    isFallback: true,
    fallbackReason: 'Primary AI provider was unavailable or in manual mode'
  });
});

// 4. AI Cold Outreach & Personalized Connection Message Generator
aiRouter.post('/outreach', async (req: Request, res: Response) => {
  const { channel, leadName, companyName, industry, websiteType, problemOrNeed, portfolioUrl, valueHook, tone } = req.body;
  const ai = getGemini();

  const cName = leadName || 'there';
  const compName = companyName || 'your team';
  const wType = websiteType || 'website';
  const need = problemOrNeed || 'modernizing and scaling your online web presence';

  const systemPrompt = `You are the Senior Outreach Specialist for a premier International Web Development agency adhering to strict SOP communication rules:
1. Always polite, consultative, authoritative, and concise. No fluff or generic spam words.
2. In LinkedIn connection requests, LinkedIn enforces a STRICT MAXIMUM OF 300 CHARACTERS. Your connection request snippet MUST be strictly under 290 characters so it never gets clipped.
3. In Upwork proposals or introductory messages, highlight our standard staging development workflow (client inspects on private staging before live deployment) and 50% milestone structure.
4. Output in JSON format with fields:
   - connectionRequestSnippet: (String, strictly <= 290 characters, punchy and personalized)
   - introductoryMessage: (String, full introductory pitch or cover letter, 3-4 structured paragraphs)
   - followUpNudge: (String, 2-3 sentence gentle nudge for 48 hours later)
   - recommendedSubject: (String, high open-rate subject line)`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${systemPrompt}\n\nTarget Prospect:\n- Name: ${cName}\n- Company: ${compName}\n- Industry: ${industry || 'Technology / Business'}\n- Project Focus: ${wType}\n- Client Need: ${need}\n- Value Hook: ${valueHook || 'Rapid 10-day staging delivery, mobile responsive, dedicated QA'}\n- Channel Format: ${channel || 'linkedin_connect'}\n- Tone: ${tone || 'consultative'}\n\nGenerate the JSON response matching the schema now.`
      });

      const raw = response.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.connectionRequestSnippet && parsed.connectionRequestSnippet.length > 295) {
          parsed.connectionRequestSnippet = parsed.connectionRequestSnippet.slice(0, 285) + '...';
        }
        return res.json({
          success: true,
          channel,
          connectionRequestSnippet: parsed.connectionRequestSnippet || `Hi ${cName}, saw your post on ${need}. At ClientOps we build high-converting ${wType} sites with 48h staging demos. Would love to connect and share a few live examples!`,
          connectionCharCount: (parsed.connectionRequestSnippet || '').length,
          introductoryMessage: parsed.introductoryMessage || raw,
          followUpNudge: parsed.followUpNudge || `Hi ${cName}, following up on my previous note. We have a free staging sprint slot open this week if you'd like a quick preview of your ${wType} concept!`,
          recommendedSubject: parsed.recommendedSubject || `Quick question regarding ${compName}'s ${wType} build`,
          modelUsed: 'gemini-3.8-flash'
        });
      }
    } catch (err: any) {
      console.warn('Gemini Outreach generation fallback:', err.message);
    }
  }

  // High-converting SOP Rule 1 Fallback templates
  const connectionSnippet = `Hi ${cName}, saw your post regarding ${wType} development for ${compName}. We build fast, high-converting sites with live staging demos in 7 days. Would love to connect and share a few relevant case studies!`.slice(0, 285);

  let introMessage = '';
  if (channel === 'upwork_proposal') {
    introMessage = `Dear ${cName},\n\nI reviewed your project specifications regarding ${need} for ${compName}, and I am confident our specialized web development team can deliver an exceptional result.\n\nHere is how our standardized delivery process guarantees your success:\n1. Private Staging Environment: We build your ${wType} entirely on our secure internal staging servers so you can test every button, form, and mobile view before final deployment.\n2. Transparent Milestone Security: Strictly aligned with industry best practices (50% upfront to reserve sprint dates, 50% only upon staging approval).\n3. Complete Asset Coverage: Full cross-browser QA, SSL/DNS configuration on Hostinger/Namecheap, and responsive optimization included.\n\nPortfolio reference: ${portfolioUrl || 'https://clientops.agency/case-studies'}\n\nI would welcome a brief 5-minute chat to discuss your preferred design aesthetics and confirm your target delivery date.\n\nBest regards,\nLead Technical Coordinator\nClientOps Web Operations`;
  } else {
    introMessage = `Hello ${cName},\n\nThank you for connecting! I came across ${compName} and noticed you are looking into ${need}.\n\nAt ClientOps, we specialize in high-converting, mobile-responsive ${wType} websites tailored specifically for international businesses. Our development workflow includes:\n• Dedicated Internal Staging Server: Inspect live builds with zero downtime to your domain\n• 50/50 Milestone Protection: 50% advance to initiate, 50% balance upon your complete staging sign-off\n• Turnaround Guarantee: Staging prototype ready within 5-7 business days\n\nWould you be open to a quick review of your requirements so we can prepare a complimentary scope breakdown?\n\nLooking forward to hearing from you,\nSales & Operations Team\nClientOps`;
  }

  const followUpNudge = `Hi ${cName}, just wanted to float this to the top of your inbox. We are currently locking in next week's development sprint schedule. Let me know if you would like us to reserve a staging slot for ${compName}!`;

  res.json({
    success: true,
    channel,
    connectionRequestSnippet: connectionSnippet,
    connectionCharCount: connectionSnippet.length,
    introductoryMessage: introMessage,
    followUpNudge,
    recommendedSubject: `Collaborating on ${compName}'s ${wType} launch`,
    modelUsed: 'sop-rules-engine'
  });
});

// ==========================================
// 5. Unified Communications Inbox (/api/inbox)
// ==========================================

inboxRouter.get('/messages', (req: Request, res: Response) => {
  const db = readDB();
  const channel = typeof req.query.channel === 'string' ? req.query.channel : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';

  let messages = (db as any).clientInquiries || [];

  if (channel && channel !== 'all') {
    messages = messages.filter((m: any) => m.channel === channel);
  }
  if (status && status !== 'all') {
    messages = messages.filter((m: any) => m.status === status);
  }
  if (search) {
    messages = messages.filter((m: any) =>
      m.clientName.toLowerCase().includes(search) ||
      m.subject.toLowerCase().includes(search) ||
      m.content.toLowerCase().includes(search) ||
      (m.clientCompany && m.clientCompany.toLowerCase().includes(search))
    );
  }

  const unreadCount = ((db as any).clientInquiries || []).filter((m: any) => m.status === 'unread').length;
  const channelCounts = {
    linkedin: ((db as any).clientInquiries || []).filter((m: any) => m.channel === 'linkedin').length,
    upwork: ((db as any).clientInquiries || []).filter((m: any) => m.channel === 'upwork').length,
    email: ((db as any).clientInquiries || []).filter((m: any) => m.channel === 'email').length,
    discord: ((db as any).clientInquiries || []).filter((m: any) => m.channel === 'discord').length,
  };

  res.json({
    success: true,
    count: messages.length,
    unreadCount,
    channelCounts,
    messages
  });
});

inboxRouter.post('/messages', (req: Request, res: Response) => {
  const db = readDB();
  const body = req.body;
  
  if (!body.clientName || !body.content) {
    return res.status(400).json({ success: false, message: 'Client name and message content are required.' });
  }

  const newId = `inbox-${Date.now()}`;
  const newMessage = {
    id: newId,
    clientName: body.clientName,
    clientEmail: body.clientEmail || `${body.clientName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`,
    clientCompany: body.clientCompany || 'Prospective Client',
    channel: body.channel || 'email',
    projectId: body.projectId || undefined,
    subject: body.subject || 'New Website Inquiry',
    content: body.content,
    timestamp: new Date().toISOString(),
    status: 'unread',
    sentiment: body.sentiment || 'neutral',
    sentimentScore: body.sentimentScore || 75,
    urgency: body.urgency || 'medium',
    replies: []
  };

  if (!(db as any).clientInquiries) (db as any).clientInquiries = [];
  (db as any).clientInquiries.unshift(newMessage);
  writeDB(db);

  res.json({ success: true, message: 'Message logged to Unified Inbox', data: newMessage });
});

inboxRouter.put('/status/:id', (req: Request, res: Response) => {
  const db = readDB();
  const id = req.params.id;
  const { status } = req.body;

  const msg = ((db as any).clientInquiries || []).find((m: any) => m.id === id);
  if (!msg) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }

  msg.status = status || 'read';
  writeDB(db);

  res.json({ success: true, message: `Status updated to ${msg.status}`, data: msg });
});

inboxRouter.post('/reply/:id', (req: Request, res: Response) => {
  const db = readDB();
  const id = req.params.id;
  const { replyText, senderName, channel } = req.body;

  const msg = ((db as any).clientInquiries || []).find((m: any) => m.id === id);
  if (!msg) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }

  if (!msg.replies) msg.replies = [];
  const replyItem = {
    id: `rep-${Date.now()}`,
    sender: senderName || 'Sales & Coordination Team',
    body: replyText,
    sentAt: new Date().toISOString(),
    channel: channel || msg.channel
  };
  msg.replies.push(replyItem);
  msg.status = 'replied';

  // Also notify in team chat
  if (!Array.isArray(db.chatMessages)) db.chatMessages = [];
  db.chatMessages.push({
    id: `msg-inbox-rep-${Date.now()}`,
    senderId: 'user-sales-1',
    senderName: senderName || 'Tariq Mehmood',
    senderRole: 'sales',
    channel: 'sales-leads',
    content: `💬 **Unified Inbox Reply Sent** to ${msg.clientName} via ${msg.channel.toUpperCase()}.\nSubject: "${msg.subject}"\nReply Preview: ${replyText.slice(0, 160)}...`,
    timestamp: new Date().toISOString(),
    reactions: { '🔥': 0, '👏': 0 }
  });

  writeDB(db);

  res.json({ success: true, message: 'Reply sent successfully and recorded in thread', replyItem });
});

inboxRouter.post('/ai-reply/:id', async (req: Request, res: Response) => {
  const db = readDB();
  const id = req.params.id;
  const msg = ((db as any).clientInquiries || []).find((m: any) => m.id === id);
  if (!msg) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }

  const ai = getGemini();
  const prompt = `You are the Lead Client Partner and SOP Director for an elite International Web Development Agency.
Follow these strict Standard Operating Procedure (SOP) rules:
1. Always thank the client courteously and professionally.
2. If the client asks about timelines, staging, or revisions, clearly explain that all development takes place on our internal dedicated staging domain so they can inspect on live devices before anything goes live.
3. If the client asks about pricing or booking their sprint, politely reinforce our strict SOP Rule 5: 50% advance payment required to initiate the project and lock their sprint slot.
4. Keep the response consultative, high-status, and free of generic fluff or sales desperation.
5. In your analysis, identify the client's emotional sentiment, urgency level, and detected intent.

Incoming Client Message:
- Client Name: ${msg.clientName}
- Company: ${msg.clientCompany || 'Not specified'}
- Channel: ${msg.channel}
- Subject: ${msg.subject}
- Message Content: "${msg.content}"

Respond in JSON format with:
{
  "sentiment": "positive" | "hesitant" | "urgent_pricing" | "revision_request" | "dissatisfied" | "neutral",
  "sentimentScore": number (0 to 100),
  "detectedIntent": string (brief summary of what client wants),
  "suggestedSubject": string,
  "suggestedBody": string (complete, ready-to-send professional reply adhering to SOP),
  "ruleApplied": string (e.g. "SOP Rule 1: Courteous Discovery & Scope Confirmation", "SOP Rule 5: 50% Advance Protocol", "SOP Rule 8: Staging Domain Inspection")
}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });
      const text = response.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        msg.sentiment = parsed.sentiment || msg.sentiment;
        msg.sentimentScore = parsed.sentimentScore || msg.sentimentScore;
        msg.aiSuggestedReply = {
          subject: parsed.suggestedSubject || `Re: ${msg.subject}`,
          body: parsed.suggestedBody,
          ruleApplied: parsed.ruleApplied || 'SOP Rule 1: Courteous Discovery',
          confidence: 96
        };
        writeDB(db);
        return res.json({
          success: true,
          sentiment: msg.sentiment,
          sentimentScore: msg.sentimentScore,
          detectedIntent: parsed.detectedIntent,
          aiSuggestedReply: msg.aiSuggestedReply,
          modelUsed: 'gemini-3.8-flash'
        });
      }
    } catch (e) {
      console.warn('Gemini AI reply generation fallback', e);
    }
  }

  // Fallback SOP rule response
  const fallbackDraft = `Hello ${msg.clientName},\n\nThank you for reaching out to us. I would be glad to assist you with your requirements.\n\nTo ensure our team delivers the highest standard of execution, our development process takes place entirely on a dedicated private staging server. This gives you full visibility to test all responsive components and workflows before anything touches your live domain.\n\nRegarding the schedule, our sprint queue requires a standard 50% advance milestone to confirm your start date and allocate our full-stack engineering team.\n\nPlease feel free to let me know if you have any questions, or if you would like to proceed with the milestone invoice.\n\nWarm regards,\nTariq Mehmood\nClient Coordination & Sales Desk`;

  const suggestedReply = {
    subject: `Re: ${msg.subject}`,
    body: fallbackDraft,
    ruleApplied: 'SOP Rule 1 & Rule 5: Scope & 50% Advance Protocol',
    confidence: 90
  };
  msg.aiSuggestedReply = suggestedReply;
  writeDB(db);

  res.json({
    success: true,
    sentiment: msg.sentiment || 'positive',
    sentimentScore: msg.sentimentScore || 85,
    detectedIntent: 'Website Inquiry & Milestone Scope Confirmation',
    aiSuggestedReply: suggestedReply,
    modelUsed: 'sop-rules-engine'
  });
});

export default aiRouter;
