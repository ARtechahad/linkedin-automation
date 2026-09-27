import { ProjectLead, ProjectTask, ProjectTimeLog } from '../types';

/**
 * Standard SOP Development Tasks generator based on project attributes
 */
export function generateDefaultTasksForProject(project: ProjectLead): ProjectTask[] {
  const isEcommerce = project.websiteType === 'ecommerce';
  const isCorporate = project.websiteType === 'corporate';

  const tasks: ProjectTask[] = [
    {
      id: `task-${project.id}-1`,
      projectId: project.id,
      title: 'Step 2 & 3: Asset Audit & CPanel / DNS Architecture',
      description: 'Audit client-provided logo, branding palette, copywriting, and configure staging DNS/hosting.',
      status: project.credentialsShared ? 'completed' : 'in_progress',
      priority: 'high',
      category: 'devops',
      assignedDeveloper: 'Alex Rivera',
      estimatedHours: 3.5,
      loggedHours: 3.5,
      createdAt: project.createdAt || new Date().toISOString(),
      completedAt: project.credentialsShared ? new Date().toISOString() : undefined
    },
    {
      id: `task-${project.id}-2`,
      projectId: project.id,
      title: isEcommerce
        ? 'Step 8: E-commerce Catalog, Cart & Stripe Checkout Gateway'
        : isCorporate
        ? 'Step 8: Multi-page Corporate Architecture & Lead Capture Forms'
        : 'Step 8: High-Conversion Landing Page & Mobile Responsive Layout',
      description: 'Core frontend implementation conforming to modern Figma specifications with 100% responsive fluid breakpoints.',
      status: project.internalQAPassed ? 'completed' : 'in_progress',
      priority: 'urgent',
      category: 'frontend',
      assignedDeveloper: 'Dev Team (Lead)',
      estimatedHours: isEcommerce ? 16.0 : isCorporate ? 14.0 : 8.0,
      loggedHours: project.internalQAPassed ? (isEcommerce ? 14.5 : isCorporate ? 12.0 : 7.0) : 4.5,
      createdAt: project.createdAt || new Date().toISOString(),
      completedAt: project.internalQAPassed ? new Date().toISOString() : undefined
    },
    {
      id: `task-${project.id}-3`,
      projectId: project.id,
      title: 'Step 8: Internal QA, Cross-Browser Testing & Lighthouse Audit',
      description: 'Execute automated regression tests, Lighthouse 90+ performance audit, and SSL security checks.',
      status: project.internalQAPassed ? 'completed' : 'todo',
      priority: 'high',
      category: 'qa',
      assignedDeveloper: 'Tariq Mehmood',
      estimatedHours: 4.0,
      loggedHours: project.internalQAPassed ? 3.0 : 0.0,
      createdAt: project.createdAt || new Date().toISOString()
    },
    {
      id: `task-${project.id}-4`,
      projectId: project.id,
      title: 'Step 8 & 9: Staging URL Deployment & Client Feedback Iterations',
      description: 'Deploy to internal staging subdomain for client review, incorporating revisions from the secure portal.',
      status: project.clientApproved ? 'completed' : 'in_progress',
      priority: 'medium',
      category: 'frontend',
      assignedDeveloper: 'Dev Team (Lead)',
      estimatedHours: 5.0,
      loggedHours: project.clientApproved ? 4.5 : 1.5,
      createdAt: project.createdAt || new Date().toISOString()
    },
    {
      id: `task-${project.id}-5`,
      projectId: project.id,
      title: 'Step 8.3 & 11: Final Domain Migration Gate & Post-Launch Retainer',
      description: 'Verify 50% balance payment lock release, migrate DNS records to live client domain, and configure SSL certificates.',
      status: project.domainTransferred ? 'completed' : 'todo',
      priority: 'high',
      category: 'devops',
      assignedDeveloper: 'Alex Rivera',
      estimatedHours: 3.0,
      loggedHours: project.domainTransferred ? 2.5 : 0.0,
      createdAt: project.createdAt || new Date().toISOString(),
      completedAt: project.domainTransferred ? project.transferCompletedAt : undefined
    }
  ];

  return tasks;
}

/**
 * Standard seed time logs for realistic developer workflow
 */
export function generateDefaultTimeLogsForProject(project: ProjectLead, tasks: ProjectTask[]): ProjectTimeLog[] {
  const logs: ProjectTimeLog[] = [];
  const baseRate = 45;

  if (tasks.length > 0) {
    const t1 = tasks[0];
    if (t1.loggedHours > 0) {
      logs.push({
        id: `log-${project.id}-1`,
        projectId: project.id,
        taskId: t1.id,
        taskTitle: t1.title,
        developerName: t1.assignedDeveloper || 'Alex Rivera',
        developerEmail: 'dev@agencyops.dev',
        developerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        hours: 3.5,
        durationMinutes: 210,
        date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        loggedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        billable: true,
        hourlyRate: baseRate,
        notes: 'Configured staging DNS records, CPanel SSL, and verified client repository structure.'
      });
    }

    if (tasks.length > 1) {
      const t2 = tasks[1];
      if (t2.loggedHours > 0) {
        logs.push({
          id: `log-${project.id}-2`,
          projectId: project.id,
          taskId: t2.id,
          taskTitle: t2.title,
          developerName: 'Dev Team (Lead)',
          developerEmail: 'lead@agencyops.dev',
          developerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          hours: Math.min(t2.loggedHours, 4.5),
          durationMinutes: Math.round(Math.min(t2.loggedHours, 4.5) * 60),
          date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          loggedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          billable: true,
          hourlyRate: 50,
          notes: 'Implemented core responsive navigation, hero section, and interactive forms according to SOP specification.'
        });
      }
    }
  }

  return logs;
}
