/**
 * Google Tasks REST API Client Service
 * 
 * Provides automated task list creation, SOP Steps 1-11 milestone mapping,
 * two-way status synchronization, and direct Google Tasks cloud integration.
 */

import { getAccessToken } from '../lib/firebase';
import { ProjectLead } from '../types';

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
  selfLink?: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
  position?: string;
}

export interface SopTaskDefinition {
  step: number;
  title: string;
  description: string;
  isCompleted: (project: ProjectLead) => boolean;
}

export const SOP_MILESTONE_DEFINITIONS: SopTaskDefinition[] = [
  {
    step: 1,
    title: 'SOP 1: Lead Verification & Acquisition Channel Intake',
    description: 'Verify lead contact info, acquisition channel (Upwork, LinkedIn, Referral), and scope fit.',
    isCompleted: (p) => Boolean(p.clientName && p.clientEmail)
  },
  {
    step: 2,
    title: 'SOP 2: 50% Advance Deposit Payment Cleared',
    description: 'Confirm client invoice clearance for 50% advance deposit before initiating development.',
    isCompleted: (p) => Boolean(p.advancePaid)
  },
  {
    step: 3,
    title: 'SOP 3: Domain & Hosting Infrastructure Setup',
    description: 'Verify client hosting credentials, server root, or provision agency managed hosting.',
    isCompleted: (p) => Boolean(p.credentialsShared || p.hostingStatus === 'has_both' || p.hostingStatus === 'has_hosting_only')
  },
  {
    step: 4,
    title: 'SOP 4: Scope & Wireframe Prototype Approval',
    description: 'Deliver design mockups, wireframes, and architecture blueprint for formal client sign-off.',
    isCompleted: (p) => p.status !== 'lead'
  },
  {
    step: 5,
    title: 'SOP 5: Content, Logo & Digital Brand Assets Ingestion',
    description: 'Audit client logos, copywriting texts, and high-resolution images or stock photography.',
    isCompleted: (p) => Boolean(p.hasLogo && (p.hasContent || p.needsContentWriting))
  },
  {
    step: 6,
    title: 'SOP 6: Staging Preview Server Deployment',
    description: 'Deploy responsive build to agency staging environment (staging.agencyops.dev).',
    isCompleted: (p) => Boolean(p.stagingUrl && p.stagingUrl.length > 5)
  },
  {
    step: 7,
    title: 'SOP 7: Discord Handover & Team Workspace Sharing',
    description: 'Post structured handover brief into dev Discord channel and notify team.',
    isCompleted: (p) => Boolean(p.discordShared)
  },
  {
    step: 8,
    title: 'SOP 8: Strict Technical QA & Browser Cross-Testing',
    description: 'Pass 100% responsive QA, Lighthouse speed check, SEO audit, and forms submission test.',
    isCompleted: (p) => Boolean(p.internalQAPassed || (p.advancePaid && p.balancePaid))
  },
  {
    step: 9,
    title: 'SOP 9: Final 50% Balance Payment Cleared',
    description: 'Ensure 100% of project funds are deposited before releasing domain transfer or code ownership.',
    isCompleted: (p) => Boolean(p.balancePaid)
  },
  {
    step: 10,
    title: 'SOP 10: Production DNS Cutover & Domain Ownership Transfer',
    description: 'Configure production DNS records, SSL certification, and transfer site credentials to client.',
    isCompleted: (p) => Boolean(p.domainTransferred || p.status === 'transferred' || p.status === 'completed')
  },
  {
    step: 11,
    title: 'SOP 11: 30-Day Warranty Kickoff & Commission Clearance',
    description: 'Activate 30-day post-launch support and process salesperson commission settlement.',
    isCompleted: (p) => Boolean(p.commissionStatus === 'paid' || p.status === 'completed')
  }
];

class GoogleTasksService {
  private async fetchGoogleApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google authentication required. Please connect your Google Workspace account.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (res.status === 401) {
      throw new Error('Google OAuth token expired or revoked. Please sign in again.');
    }

    return res;
  }

  /**
   * 1. List user's Google Task lists
   */
  public async listTaskLists(): Promise<GoogleTaskList[]> {
    const res = await this.fetchGoogleApi('https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=50');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Google Task lists (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.items || [];
  }

  /**
   * 2. Create a dedicated task list for a project
   */
  public async createTaskList(title: string): Promise<GoogleTaskList> {
    const res = await this.fetchGoogleApi('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      body: JSON.stringify({ title })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create Task list (HTTP ${res.status})`);
    }

    return await res.json();
  }

  /**
   * 3. List all tasks in a task list
   */
  public async listTasks(taskListId: string): Promise<GoogleTaskItem[]> {
    const res = await this.fetchGoogleApi(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true&maxResults=100`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch tasks (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.items || [];
  }

  /**
   * 4. Create a task in a task list
   */
  public async createTask(
    taskListId: string,
    task: { title: string; notes?: string; due?: string; status?: 'needsAction' | 'completed' }
  ): Promise<GoogleTaskItem> {
    const res = await this.fetchGoogleApi(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create task (HTTP ${res.status})`);
    }

    return await res.json();
  }

  /**
   * 5. Update task completion status
   */
  public async updateTaskStatus(
    taskListId: string,
    taskId: string,
    completed: boolean
  ): Promise<GoogleTaskItem> {
    const res = await this.fetchGoogleApi(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: completed ? 'completed' : 'needsAction'
        })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update task status (HTTP ${res.status})`);
    }

    return await res.json();
  }

  /**
   * 6. Sync SOP Steps 1-11 for a ProjectLead
   * Automatically creates the Google Task list if absent and populates all 11 steps
   * with current milestone status.
   */
  public async syncSopTasksForProject(
    project: ProjectLead
  ): Promise<{ taskListId: string; taskListTitle: string; taskCount: number; webUrl: string }> {
    const company = project.clientCompany || project.clientName || 'Client';
    const targetTitle = `Client: ${company} - SOP Pipeline`;

    // 1. Check existing lists or use saved googleTaskListId
    let taskListId = project.googleTaskListId;
    let taskListTitle = targetTitle;

    if (!taskListId) {
      const existingLists = await this.listTaskLists();
      const matched = existingLists.find(l => l.title === targetTitle || l.title.includes(company));
      if (matched) {
        taskListId = matched.id;
        taskListTitle = matched.title;
      } else {
        const created = await this.createTaskList(targetTitle);
        taskListId = created.id;
        taskListTitle = created.title;
      }
    }

    // 2. Fetch existing tasks inside this list
    const existingTasks = await this.listTasks(taskListId);

    // 3. Populate or update each of the 11 SOP milestones
    for (const sopDef of SOP_MILESTONE_DEFINITIONS) {
      const isDone = sopDef.isCompleted(project);
      const matchedTask = existingTasks.find(t => 
        t.title.startsWith(`SOP ${sopDef.step}:`) || 
        t.title.includes(`SOP ${sopDef.step}`)
      );

      if (matchedTask) {
        // Update status if different
        const currentDone = matchedTask.status === 'completed';
        if (currentDone !== isDone) {
          await this.updateTaskStatus(taskListId, matchedTask.id, isDone);
        }
      } else {
        // Create task
        await this.createTask(taskListId, {
          title: sopDef.title,
          notes: `${sopDef.description}\n\nClient: ${project.clientName} (${company})\nDeal Value: $${project.finalPrice}\nProject ID: ${project.id}`,
          status: isDone ? 'completed' : 'needsAction'
        });
      }
    }

    const webUrl = `https://calendar.google.com/calendar/u/0/r/tasks`;

    return {
      taskListId,
      taskListTitle,
      taskCount: SOP_MILESTONE_DEFINITIONS.length,
      webUrl
    };
  }
}

export const googleTasksService = new GoogleTasksService();
