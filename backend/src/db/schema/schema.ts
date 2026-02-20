import { pgTable, text, timestamp, uuid, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  emergencyContactId: uuid('emergency_contact_id').notNull().references(() => emergencyContacts.id, { onDelete: 'cascade' }),
  activityType: text('activity_type').notNull(),
  clothingDescription: text('clothing_description'),
  vehicleDescription: text('vehicle_description'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  status: text('status').notNull(),
  startLatitude: decimal('start_latitude', { precision: 10, scale: 8 }).notNull(),
  startLongitude: decimal('start_longitude', { precision: 11, scale: 8 }).notNull(),
  lastLatitude: decimal('last_latitude', { precision: 10, scale: 8 }).notNull(),
  lastLongitude: decimal('last_longitude', { precision: 11, scale: 8 }).notNull(),
  lastLocationUpdate: timestamp('last_location_update', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const locationUpdates = pgTable('location_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
});

export const emergencyContactsRelations = relations(emergencyContacts, ({ many }) => ({
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  emergencyContact: one(emergencyContacts, {
    fields: [trips.emergencyContactId],
    references: [emergencyContacts.id],
  }),
  locationUpdates: many(locationUpdates),
}));

export const locationUpdatesRelations = relations(locationUpdates, ({ one }) => ({
  trip: one(trips, {
    fields: [locationUpdates.tripId],
    references: [trips.id],
  }),
}));
