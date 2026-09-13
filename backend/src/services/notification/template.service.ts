import { notificationRepository } from '../../repositories/notification.repository';
import { NotificationTemplateRecord, NotificationChannel } from '../../types/notification';

export class TemplateService {
  /**
   * Render title & body templates safely with variables
   */
  async renderTemplate(
    templateCode: string,
    language: string,
    channel: NotificationChannel,
    variables: Record<string, any>
  ): Promise<{ title: string; body: string; templateId: string; version: number }> {
    const template = await notificationRepository.getTemplate(templateCode, language, channel);
    
    const titleTemplate = template ? template.titleTemplate : 'SmartProcure Notification';
    const bodyTemplate = template ? template.bodyTemplate : JSON.stringify(variables);
    const templateId = template ? template.id : `fallback-${templateCode}`;
    const version = template ? template.version : 1;

    const title = this.interpolate(titleTemplate, variables);
    const body = this.interpolate(bodyTemplate, variables);

    return { title, body, templateId, version };
  }

  private interpolate(templateStr: string, variables: Record<string, any>): string {
    return templateStr.replace(/\{(\w+)\}/g, (_, key) => {
      return variables[key] !== undefined ? String(variables[key]) : `{${key}}`;
    });
  }

  async listTemplates(): Promise<NotificationTemplateRecord[]> {
    return notificationRepository.listTemplates();
  }
}

export const templateService = new TemplateService();
