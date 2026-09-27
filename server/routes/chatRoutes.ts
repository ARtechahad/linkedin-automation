import { Router, Request, Response } from 'express';
import { readDB, writeDB } from '../db';

const router = Router();

// GET /api/chat & /api/chat/messages
router.get('/', (req: Request, res: Response) => {
  const db = readDB();
  const channel = typeof req.query.channel === 'string' ? req.query.channel : '';
  let messages = db.chatMessages || [];
  if (channel) {
    messages = messages.filter((m: any) => m.channel === channel);
  }
  res.json({ success: true, messages });
});

router.get('/messages', (req: Request, res: Response) => {
  const db = readDB();
  const channel = typeof req.query.channel === 'string' ? req.query.channel : '';
  let messages = db.chatMessages || [];
  if (channel) {
    messages = messages.filter((m: any) => m.channel === channel);
  }
  res.json({ success: true, messages });
});

// POST /api/chat & /api/chat/messages
const handleCreateChatMessage = (req: Request, res: Response) => {
  const db = readDB();
  const { senderId, senderName, senderRole, channel, content, attachmentName, attachmentUrl } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  const newMessage = {
    id: `msg-${Date.now()}`,
    senderId: senderId || 'user-anon',
    senderName: senderName || 'Team Member',
    senderRole: senderRole || 'sales',
    channel: channel || 'general',
    content: content.trim(),
    timestamp: new Date().toISOString(),
    attachmentName: attachmentName || undefined,
    attachmentUrl: attachmentUrl || undefined,
    reactions: {}
  };

  if (!Array.isArray(db.chatMessages)) db.chatMessages = [];
  (db.chatMessages as any).push(newMessage);
  writeDB(db);

  res.status(201).json({ success: true, message: newMessage });
};

router.post('/', handleCreateChatMessage);
router.post('/messages', handleCreateChatMessage);

export default router;
