import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, connectWebSocket, connectAuthenticatedWebSocket, waitForMessage } from "./helpers";

describe("API Integration Tests", () => {
  let authToken: string;
  let testUserId: string;
  let emergencyContactId: string;
  let tripId: string;

  // ========== Auth Setup ==========
  test("Sign up test user", async () => {
    const { token, user } = await signUpTestUser();
    authToken = token;
    testUserId = user.id;
    expect(authToken).toBeDefined();
    expect(testUserId).toBeDefined();
  });

  // ========== Emergency Contacts CRUD ==========
  describe("Emergency Contacts", () => {
    test("Create emergency contact", async () => {
      const res = await authenticatedApi(
        "/api/emergency-contacts",
        authToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            phoneNumber: "+1234567890",
          }),
        }
      );
      await expectStatus(res, 201);
      const data = await res.json();
      emergencyContactId = data.id;
      expect(data.id).toBeDefined();
      expect(data.name).toBe("John Doe");
      expect(data.phoneNumber).toBe("+1234567890");
      expect(data.userId).toBeDefined();
    });

    test("Create emergency contact without required fields should fail", async () => {
      const res = await authenticatedApi(
        "/api/emergency-contacts",
        authToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Jane Doe" }),
        }
      );
      await expectStatus(res, 400);
    });

    test("Get all emergency contacts", async () => {
      const res = await authenticatedApi(
        "/api/emergency-contacts",
        authToken
      );
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test("Update emergency contact", async () => {
      const res = await authenticatedApi(
        `/api/emergency-contacts/${emergencyContactId}`,
        authToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Updated",
            phoneNumber: "+0987654321",
          }),
        }
      );
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.name).toBe("John Updated");
      expect(data.phoneNumber).toBe("+0987654321");
    });

    test("Update non-existent emergency contact should fail", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const res = await authenticatedApi(
        `/api/emergency-contacts/${nonExistentId}`,
        authToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Someone" }),
        }
      );
      await expectStatus(res, 404);
    });

    test("Delete emergency contact", async () => {
      const res = await authenticatedApi(
        `/api/emergency-contacts/${emergencyContactId}`,
        authToken,
        {
          method: "DELETE",
        }
      );
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test("Delete non-existent emergency contact should fail", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const res = await authenticatedApi(
        `/api/emergency-contacts/${nonExistentId}`,
        authToken,
        {
          method: "DELETE",
        }
      );
      await expectStatus(res, 404);
    });
  });

  // ========== Trips ==========
  describe("Trips", () => {
    let secondaryContactId: string;

    test("Create secondary emergency contact for trip", async () => {
      const res = await authenticatedApi(
        "/api/emergency-contacts",
        authToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Emergency Contact",
            phoneNumber: "+1111111111",
          }),
        }
      );
      await expectStatus(res, 201);
      const data = await res.json();
      secondaryContactId = data.id;
    });

    test("Start a trip", async () => {
      const res = await authenticatedApi("/api/trips/start", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyContactId: secondaryContactId,
          activityType: "hiking",
          clothingDescription: "warm jacket and boots",
          vehicleDescription: "blue sedan",
          latitude: "40.7128",
          longitude: "-74.0060",
        }),
      });
      await expectStatus(res, 201);
      const data = await res.json();
      tripId = data.id;
      expect(data.id).toBeDefined();
      expect(data.activityType).toBe("hiking");
      expect(data.status).toBeDefined();
      expect(data.lastLatitude).toBe("40.7128");
      expect(data.lastLongitude).toBe("-74.0060");
      expect(data.emergencyContact).toBeDefined();
    });

    test("Start trip without required fields should fail", async () => {
      const res = await authenticatedApi("/api/trips/start", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: "hiking",
          latitude: "40.7128",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Get active trip", async () => {
      const res = await authenticatedApi("/api/trips/active", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data).toBeDefined();
      if (data !== null) {
        expect(data.id).toBeDefined();
        expect(data.status).toBeDefined();
        expect(data.activityType).toBeDefined();
      }
    });

    test("Get all trips", async () => {
      const res = await authenticatedApi("/api/trips", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test("Update trip location", async () => {
      const res = await authenticatedApi(
        `/api/trips/${tripId}/location`,
        authToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: "40.7580",
            longitude: "-73.9855",
          }),
        }
      );
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe(tripId);
      expect(data.lastLatitude).toBe("40.7580");
      expect(data.lastLongitude).toBe("-73.9855");
    });

    test("Update non-existent trip location should fail", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const res = await authenticatedApi(
        `/api/trips/${nonExistentId}/location`,
        authToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: "40.7128",
            longitude: "-74.0060",
          }),
        }
      );
      await expectStatus(res, 404);
    });

    test("Send SOS alert for trip", async () => {
      const res = await authenticatedApi(`/api/trips/${tripId}/sos`, authToken, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: "40.7500",
          longitude: "-73.9900",
        }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe(tripId);
      expect(data.status).toBeDefined();
    });

    test("Send SOS alert for non-existent trip should fail", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const res = await authenticatedApi(
        `/api/trips/${nonExistentId}/sos`,
        authToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: "40.7128",
            longitude: "-74.0060",
          }),
        }
      );
      await expectStatus(res, 404);
    });

    test("Complete trip", async () => {
      const res = await authenticatedApi(
        `/api/trips/${tripId}/complete`,
        authToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe(tripId);
      expect(data.endTime).toBeDefined();
      expect(data.status).toBeDefined();
    });

    test("Complete non-existent trip should fail", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const res = await authenticatedApi(
        `/api/trips/${nonExistentId}/complete`,
        authToken,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      await expectStatus(res, 404);
    });
  });

  // ========== Authentication Tests ==========
  describe("Authentication", () => {
    test("Accessing emergency contacts without auth should fail", async () => {
      const res = await api("/api/emergency-contacts");
      await expectStatus(res, 401);
    });

    test("Accessing trips without auth should fail", async () => {
      const res = await api("/api/trips");
      await expectStatus(res, 401);
    });

    test("Accessing active trip without auth should fail", async () => {
      const res = await api("/api/trips/active");
      await expectStatus(res, 401);
    });

    test("Starting trip without auth should fail", async () => {
      const res = await api("/api/trips/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyContactId: "00000000-0000-0000-0000-000000000000",
          activityType: "hiking",
          latitude: "40.7128",
          longitude: "-74.0060",
        }),
      });
      await expectStatus(res, 401);
    });
  });
});
