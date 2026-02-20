import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';
import {
  sendSMS,
  buildTripStartMessage,
  buildLocationUpdateMessage,
  buildSOSMessage,
  buildTripCompleteMessage,
  formatDecimal,
} from '../utils/sms.js';

export function registerTripRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get('/api/trips', {
    schema: {
      description: 'Get user trips (latest 20)',
      tags: ['trips'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              activityType: { type: 'string' },
              clothingDescription: { type: ['string', 'null'] },
              vehicleDescription: { type: ['string', 'null'] },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: ['string', 'null'], format: 'date-time' },
              status: { type: 'string' },
              startLatitude: { type: 'string' },
              startLongitude: { type: 'string' },
              lastLatitude: { type: 'string' },
              lastLongitude: { type: 'string' },
              lastLocationUpdate: { type: 'string', format: 'date-time' },
              emergencyContact: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  phoneNumber: { type: 'string' },
                },
              },
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

    app.logger.info({ userId: session.user.id }, 'Fetching user trips');

    const trips = await app.db.query.trips.findMany({
      where: eq(schema.trips.userId, session.user.id),
      with: {
        emergencyContact: true,
      },
      orderBy: desc(schema.trips.createdAt),
      limit: 20,
    });

    const formattedTrips = trips.map((trip) => ({
      ...trip,
      startLatitude: formatDecimal(trip.startLatitude),
      startLongitude: formatDecimal(trip.startLongitude),
      lastLatitude: formatDecimal(trip.lastLatitude),
      lastLongitude: formatDecimal(trip.lastLongitude),
      emergencyContact: {
        name: trip.emergencyContact.name,
        phoneNumber: trip.emergencyContact.phoneNumber,
      },
    }));

    app.logger.info({ userId: session.user.id, count: trips.length }, 'Trips fetched');
    return formattedTrips;
  });

  app.fastify.get('/api/trips/active', {
    schema: {
      description: 'Get active trip for authenticated user',
      tags: ['trips'],
      response: {
        200: {
          type: ['object', 'null'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            activityType: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
            lastLatitude: { type: 'string' },
            lastLongitude: { type: 'string' },
            lastLocationUpdate: { type: 'string', format: 'date-time' },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phoneNumber: { type: 'string' },
              },
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

    app.logger.info({ userId: session.user.id }, 'Fetching active trip');

    const trip = await app.db.query.trips.findFirst({
      where: and(
        eq(schema.trips.userId, session.user.id),
        eq(schema.trips.status, 'active')
      ),
      with: {
        emergencyContact: true,
      },
    });

    if (!trip) {
      app.logger.info({ userId: session.user.id }, 'No active trip found');
      return null;
    }

    const result = {
      id: trip.id,
      activityType: trip.activityType,
      startTime: trip.startTime,
      status: trip.status,
      lastLatitude: trip.lastLatitude,
      lastLongitude: trip.lastLongitude,
      lastLocationUpdate: trip.lastLocationUpdate,
      emergencyContact: {
        name: trip.emergencyContact.name,
        phoneNumber: trip.emergencyContact.phoneNumber,
      },
    };

    app.logger.info({ userId: session.user.id, tripId: trip.id }, 'Active trip found');
    return result;
  });

  app.fastify.post('/api/trips/start', {
    schema: {
      description: 'Start a new trip',
      tags: ['trips'],
      body: {
        type: 'object',
        required: ['emergencyContactId', 'activityType', 'latitude', 'longitude'],
        properties: {
          emergencyContactId: { type: 'string', format: 'uuid' },
          activityType: { type: 'string' },
          clothingDescription: { type: 'string' },
          vehicleDescription: { type: 'string' },
          latitude: { type: 'string' },
          longitude: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            activityType: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
            lastLatitude: { type: 'string' },
            lastLongitude: { type: 'string' },
            lastLocationUpdate: { type: 'string', format: 'date-time' },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phoneNumber: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        emergencyContactId: string;
        activityType: string;
        clothingDescription?: string;
        vehicleDescription?: string;
        latitude: string;
        longitude: string;
      };
    }>,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const {
      emergencyContactId,
      activityType,
      clothingDescription,
      vehicleDescription,
      latitude,
      longitude,
    } = request.body;

    app.logger.info(
      {
        userId: session.user.id,
        emergencyContactId,
        activityType,
      },
      'Starting trip'
    );

    const contact = await app.db.query.emergencyContacts.findFirst({
      where: and(
        eq(schema.emergencyContacts.id, emergencyContactId),
        eq(schema.emergencyContacts.userId, session.user.id)
      ),
    });

    if (!contact) {
      app.logger.warn(
        { userId: session.user.id, emergencyContactId },
        'Emergency contact not found'
      );
      return reply.status(400).send({ error: 'Emergency contact not found' });
    }

    const now = new Date();
    const trip = await app.db.insert(schema.trips).values({
      userId: session.user.id,
      emergencyContactId,
      activityType,
      clothingDescription,
      vehicleDescription,
      startTime: now,
      startLatitude: latitude,
      startLongitude: longitude,
      lastLatitude: latitude,
      lastLongitude: longitude,
      lastLocationUpdate: now,
      status: 'active',
    }).returning();

    const tripData = trip[0];

    const message = buildTripStartMessage(
      activityType,
      clothingDescription,
      vehicleDescription,
      latitude,
      longitude
    );

    await sendSMS(contact.phoneNumber, message, app.logger);

    app.logger.info(
      { userId: session.user.id, tripId: tripData.id },
      'Trip started successfully'
    );

    const result = {
      id: tripData.id,
      activityType: tripData.activityType,
      startTime: tripData.startTime,
      status: tripData.status,
      lastLatitude: formatDecimal(tripData.lastLatitude),
      lastLongitude: formatDecimal(tripData.lastLongitude),
      lastLocationUpdate: tripData.lastLocationUpdate,
      emergencyContact: {
        name: contact.name,
        phoneNumber: contact.phoneNumber,
      },
    };

    reply.status(201);
    return result;
  });

  app.fastify.put('/api/trips/:id/location', {
    schema: {
      description: 'Update trip location',
      tags: ['trips'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: { type: 'string' },
          longitude: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            activityType: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
            lastLatitude: { type: 'string' },
            lastLongitude: { type: 'string' },
            lastLocationUpdate: { type: 'string', format: 'date-time' },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phoneNumber: { type: 'string' },
              },
            },
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
    request: FastifyRequest<{
      Params: { id: string };
      Body: { latitude: string; longitude: string };
    }>,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;
    const { latitude, longitude } = request.body;

    app.logger.info(
      { userId: session.user.id, tripId: id, latitude, longitude },
      'Updating trip location'
    );

    const trip = await app.db.query.trips.findFirst({
      where: and(
        eq(schema.trips.id, id),
        eq(schema.trips.userId, session.user.id)
      ),
      with: {
        emergencyContact: true,
      },
    });

    if (!trip) {
      app.logger.warn({ userId: session.user.id, tripId: id }, 'Trip not found');
      return reply.status(404).send({ error: 'Trip not found' });
    }

    if (trip.status !== 'active') {
      app.logger.warn(
        { userId: session.user.id, tripId: id, status: trip.status },
        'Trip is not active'
      );
      return reply.status(400).send({ error: 'Trip is not active' });
    }

    const now = new Date();

    await app.db.insert(schema.locationUpdates).values({
      tripId: id,
      latitude,
      longitude,
      timestamp: now,
    });

    const updated = await app.db.update(schema.trips)
      .set({
        lastLatitude: latitude,
        lastLongitude: longitude,
        lastLocationUpdate: now,
      })
      .where(eq(schema.trips.id, id))
      .returning();

    const tripData = updated[0];

    const message = buildLocationUpdateMessage(latitude, longitude);
    await sendSMS(trip.emergencyContact.phoneNumber, message, app.logger);

    app.logger.info(
      { userId: session.user.id, tripId: id },
      'Trip location updated'
    );

    const result = {
      id: tripData.id,
      activityType: tripData.activityType,
      startTime: tripData.startTime,
      status: tripData.status,
      lastLatitude: formatDecimal(tripData.lastLatitude),
      lastLongitude: formatDecimal(tripData.lastLongitude),
      lastLocationUpdate: tripData.lastLocationUpdate,
      emergencyContact: {
        name: trip.emergencyContact.name,
        phoneNumber: trip.emergencyContact.phoneNumber,
      },
    };

    return result;
  });

  app.fastify.put('/api/trips/:id/complete', {
    schema: {
      description: 'Complete a trip',
      tags: ['trips'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            activityType: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: ['string', 'null'], format: 'date-time' },
            status: { type: 'string' },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phoneNumber: { type: 'string' },
              },
            },
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
    request: FastifyRequest<{
      Params: { id: string };
      Body: Record<string, never>;
    }>,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;

    app.logger.info({ userId: session.user.id, tripId: id }, 'Completing trip');

    const trip = await app.db.query.trips.findFirst({
      where: and(
        eq(schema.trips.id, id),
        eq(schema.trips.userId, session.user.id)
      ),
      with: {
        emergencyContact: true,
      },
    });

    if (!trip) {
      app.logger.warn({ userId: session.user.id, tripId: id }, 'Trip not found');
      return reply.status(404).send({ error: 'Trip not found' });
    }

    const now = new Date();
    const updated = await app.db.update(schema.trips)
      .set({
        status: 'completed',
        endTime: now,
      })
      .where(eq(schema.trips.id, id))
      .returning();

    const tripData = updated[0];

    const message = buildTripCompleteMessage();
    await sendSMS(trip.emergencyContact.phoneNumber, message, app.logger);

    app.logger.info({ userId: session.user.id, tripId: id }, 'Trip completed');

    const result = {
      id: tripData.id,
      activityType: tripData.activityType,
      startTime: tripData.startTime,
      endTime: tripData.endTime,
      status: tripData.status,
      emergencyContact: {
        name: trip.emergencyContact.name,
        phoneNumber: trip.emergencyContact.phoneNumber,
      },
    };

    return result;
  });

  app.fastify.put('/api/trips/:id/sos', {
    schema: {
      description: 'Send SOS alert for a trip',
      tags: ['trips'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: { type: 'string' },
          longitude: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            activityType: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
            lastLatitude: { type: 'string' },
            lastLongitude: { type: 'string' },
            lastLocationUpdate: { type: 'string', format: 'date-time' },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phoneNumber: { type: 'string' },
              },
            },
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
    request: FastifyRequest<{
      Params: { id: string };
      Body: { latitude: string; longitude: string };
    }>,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;
    const { latitude, longitude } = request.body;

    app.logger.info(
      { userId: session.user.id, tripId: id, latitude, longitude },
      'SOS alert triggered'
    );

    const trip = await app.db.query.trips.findFirst({
      where: and(
        eq(schema.trips.id, id),
        eq(schema.trips.userId, session.user.id)
      ),
      with: {
        emergencyContact: true,
      },
    });

    if (!trip) {
      app.logger.warn({ userId: session.user.id, tripId: id }, 'Trip not found');
      return reply.status(404).send({ error: 'Trip not found' });
    }

    const now = new Date();

    await app.db.insert(schema.locationUpdates).values({
      tripId: id,
      latitude,
      longitude,
      timestamp: now,
    });

    const updated = await app.db.update(schema.trips)
      .set({
        status: 'sos',
        lastLatitude: latitude,
        lastLongitude: longitude,
        lastLocationUpdate: now,
      })
      .where(eq(schema.trips.id, id))
      .returning();

    const tripData = updated[0];

    const message = buildSOSMessage(
      trip.clothingDescription,
      trip.vehicleDescription,
      latitude,
      longitude
    );
    await sendSMS(trip.emergencyContact.phoneNumber, message, app.logger);

    app.logger.info(
      { userId: session.user.id, tripId: id },
      'SOS alert sent'
    );

    const result = {
      id: tripData.id,
      activityType: tripData.activityType,
      startTime: tripData.startTime,
      status: tripData.status,
      lastLatitude: formatDecimal(tripData.lastLatitude),
      lastLongitude: formatDecimal(tripData.lastLongitude),
      lastLocationUpdate: tripData.lastLocationUpdate,
      emergencyContact: {
        name: trip.emergencyContact.name,
        phoneNumber: trip.emergencyContact.phoneNumber,
      },
    };

    return result;
  });
}
