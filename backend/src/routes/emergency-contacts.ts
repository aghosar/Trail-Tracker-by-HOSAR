import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

export function registerEmergencyContactRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/emergency-contacts', {
    schema: {
      description: 'Get all emergency contacts for the authenticated user',
      tags: ['emergency-contacts'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              phoneNumber: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching emergency contacts');

    const contacts = await app.db.query.emergencyContacts.findMany({
      where: eq(schema.emergencyContacts.userId, session.user.id),
    });

    app.logger.info({ userId: session.user.id, count: contacts.length }, 'Emergency contacts fetched');
    return contacts;
  });

  app.fastify.post('/api/emergency-contacts', {
    schema: {
      description: 'Create a new emergency contact for the authenticated user',
      tags: ['emergency-contacts'],
      body: {
        type: 'object',
        required: ['name', 'phoneNumber'],
        properties: {
          name: { type: 'string' },
          phoneNumber: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            name: { type: 'string' },
            phoneNumber: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: { name: string; phoneNumber: string } }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { name, phoneNumber } = request.body;
    app.logger.info({ userId: session.user.id, name, phoneNumber }, 'Creating emergency contact');

    const contact = await app.db.insert(schema.emergencyContacts).values({
      userId: session.user.id,
      name,
      phoneNumber,
    }).returning();

    app.logger.info({ userId: session.user.id, contactId: contact[0].id }, 'Emergency contact created');
    reply.status(201);
    return contact[0];
  });

  app.fastify.put('/api/emergency-contacts/:id', {
    schema: {
      description: 'Update an emergency contact',
      tags: ['emergency-contacts'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phoneNumber: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            name: { type: 'string' },
            phoneNumber: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; phoneNumber?: string } }>,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;
    const { name, phoneNumber } = request.body;

    app.logger.info({ userId: session.user.id, contactId: id }, 'Updating emergency contact');

    const contact = await app.db.query.emergencyContacts.findFirst({
      where: and(
        eq(schema.emergencyContacts.id, id),
        eq(schema.emergencyContacts.userId, session.user.id)
      ),
    });

    if (!contact) {
      app.logger.warn({ userId: session.user.id, contactId: id }, 'Emergency contact not found');
      return reply.status(404).send({ error: 'Contact not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    const updated = await app.db.update(schema.emergencyContacts)
      .set(updateData)
      .where(eq(schema.emergencyContacts.id, id))
      .returning();

    app.logger.info({ userId: session.user.id, contactId: id }, 'Emergency contact updated');
    return updated[0];
  });

  app.fastify.delete('/api/emergency-contacts/:id', {
    schema: {
      description: 'Delete an emergency contact',
      tags: ['emergency-contacts'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { success: { type: 'boolean' } },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;
    app.logger.info({ userId: session.user.id, contactId: id }, 'Deleting emergency contact');

    const contact = await app.db.query.emergencyContacts.findFirst({
      where: and(
        eq(schema.emergencyContacts.id, id),
        eq(schema.emergencyContacts.userId, session.user.id)
      ),
    });

    if (!contact) {
      app.logger.warn({ userId: session.user.id, contactId: id }, 'Emergency contact not found');
      return reply.status(404).send({ error: 'Contact not found' });
    }

    await app.db.delete(schema.emergencyContacts).where(eq(schema.emergencyContacts.id, id));

    app.logger.info({ userId: session.user.id, contactId: id }, 'Emergency contact deleted');
    return { success: true };
  });
}
